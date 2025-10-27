import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  signal,
  effect,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExtractedText, DetectedWord } from '../../../../shared/models/submission.model';
import { VerificationResult } from '../../../../shared/models/verification-result.model';
import { MatchStatus } from '../../../../shared/enums/match-status.enum';
import { ToastService } from '../../../../core/services/toast.service';

interface AnnotatedWord extends DetectedWord {
  color: string;
  fieldType?: string;
}

interface TooltipData {
  text: string;
  confidence: number;
  fieldType?: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-image-annotator',
  imports: [CommonModule],
  templateUrl: './image-annotator.component.html',
  styleUrl: './image-annotator.component.css',
})
export class ImageAnnotatorComponent implements AfterViewInit, OnChanges {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() imageBase64!: string;
  @Input() ocrData!: ExtractedText;
  @Input() verificationResult!: VerificationResult;

  showAnnotations = signal(true);
  tooltip = signal<TooltipData | null>(null);
  loading = signal(true);

  private ctx: CanvasRenderingContext2D | null = null;
  private image: HTMLImageElement | null = null;
  private scale: number = 1;
  private annotatedWords: AnnotatedWord[] = [];

  constructor(private toastService: ToastService) {
    effect(() => {
      if (this.showAnnotations() !== undefined && this.image) {
        this.render();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['imageBase64'] || changes['ocrData'] || changes['verificationResult']) && this.canvasRef) {
      this.initCanvas();
    }
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  private initCanvas(): void {
    if (!this.imageBase64 || !this.ocrData || !this.verificationResult) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');

    if (!this.ctx) {
      this.toastService.showError('Failed to initialize canvas context');
      this.loading.set(false);
      return;
    }

    this.image = new Image();
    this.image.onload = () => {
      this.setupCanvas();
      this.annotateWords();
      this.render();
      this.loading.set(false);
    };
    this.image.onerror = () => {
      this.toastService.showError('Failed to load label image');
      this.loading.set(false);
    };
    this.image.src = `data:image/png;base64,${this.imageBase64}`;
  }

  private setupCanvas(): void {
    if (!this.image || !this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    const maxWidth = canvas.parentElement?.clientWidth || 800;

    this.scale = Math.min(maxWidth / this.image.width, 1);

    canvas.width = this.image.width * this.scale;
    canvas.height = this.image.height * this.scale;
  }

  private annotateWords(): void {
    if (!this.ocrData.words || this.ocrData.words.length === 0) {
      this.toastService.showWarning('No text was detected in the image');
      this.annotatedWords = [];
      return;
    }

    this.annotatedWords = this.ocrData.words.map((word) => {
      const fieldType = this.findFieldForWord(word.text);
      const color = this.getColorForWord(word.text, fieldType);

      return {
        ...word,
        color,
        fieldType,
      };
    });
  }

  private findFieldForWord(text: string): string | undefined {
    const normalized = text.toUpperCase().trim();

    // Check against each field in verification result
    for (const check of this.verificationResult.fieldChecks) {
      if (check.expected && check.expected.toUpperCase().includes(normalized)) {
        return check.fieldType;
      }
      if (check.found && check.found.toUpperCase().includes(normalized)) {
        return check.fieldType;
      }
    }

    return undefined;
  }

  private getColorForWord(text: string, fieldType?: string): string {
    if (!fieldType) {
      return '#06b6d4'; // Cyan for other text (brighter, more visible)
    }

    const check = this.verificationResult.fieldChecks.find((c) => c.fieldType === fieldType);
    if (!check) return '#06b6d4';

    switch (check.status) {
      case MatchStatus.Match:
        return '#10b981'; // Green
      case MatchStatus.Mismatch:
        return '#ef4444'; // Red
      case MatchStatus.NotFound:
        return '#ef4444'; // Red
      default:
        return '#06b6d4'; // Cyan
    }
  }

  private render(): void {
    if (!this.ctx || !this.image) return;

    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);

    this.ctx.drawImage(
      this.image,
      0,
      0,
      this.image.width * this.scale,
      this.image.height * this.scale
    );

    if (this.showAnnotations()) {
      this.drawAnnotations();
    }
  }

  private drawAnnotations(): void {
    if (!this.ctx) return;

    this.annotatedWords.forEach((word) => {
      const x = word.bbox.x * this.scale;
      const y = word.bbox.y * this.scale;
      const width = word.bbox.width * this.scale;
      const height = word.bbox.height * this.scale;

      this.ctx!.strokeStyle = word.color;
      this.ctx!.lineWidth = 2;
      this.ctx!.strokeRect(x, y, width, height);
    });
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.showAnnotations()) {
      this.tooltip.set(null);
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const word = this.findWordAtPosition(x, y);

    if (word) {
      this.tooltip.set({
        text: word.text,
        confidence: word.confidence,
        fieldType: word.fieldType,
        x: event.clientX,
        y: event.clientY,
      });
    } else {
      this.tooltip.set(null);
    }
  }

  onMouseLeave(): void {
    this.tooltip.set(null);
  }

  private findWordAtPosition(x: number, y: number): AnnotatedWord | null {
    for (const word of this.annotatedWords) {
      const wx = word.bbox.x * this.scale;
      const wy = word.bbox.y * this.scale;
      const ww = word.bbox.width * this.scale;
      const wh = word.bbox.height * this.scale;

      if (x >= wx && x <= wx + ww && y >= wy && y <= wy + wh) {
        return word;
      }
    }
    return null;
  }

  toggleAnnotations(): void {
    this.showAnnotations.update((v) => !v);
  }
}
