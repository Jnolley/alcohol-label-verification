import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface UploadedImage {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.css'
})
export class ImageUploadComponent {
  filesSelected = output<{primary: File | null, secondary: File | null}>();

  images = signal<UploadedImage[]>([]);
  error = signal<string | null>(null);
  isDragging = signal<boolean>(false);

  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  readonly MAX_FILES = 2;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    // Process each selected file
    for (let i = 0; i < files.length; i++) {
      if (this.images().length >= this.MAX_FILES) {
        this.error.set(`Maximum ${this.MAX_FILES} images allowed`);
        break;
      }
      this.processFile(files[i]);
    }
  }

  clearSelection(): void {
    this.images.set([]);
    this.error.set(null);
    this.emitFiles();
  }

  removeImage(index: number): void {
    const current = this.images();
    this.images.set(current.filter((_, i) => i !== index));
    this.error.set(null);
    this.emitFiles();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Process dropped files
      for (let i = 0; i < files.length; i++) {
        if (this.images().length >= this.MAX_FILES) {
          this.error.set(`Maximum ${this.MAX_FILES} images allowed`);
          break;
        }
        this.processFile(files[i]);
      }
      return;
    }

    // Handle URL drops
    const items = event.dataTransfer?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.kind === 'file') {
          const droppedFile = item.getAsFile();
          if (droppedFile && this.images().length < this.MAX_FILES) {
            this.processFile(droppedFile);
          }
        } else if (item.kind === 'string' && item.type.match('^text/uri-list')) {
          if (this.images().length < this.MAX_FILES) {
            item.getAsString(async (url) => {
              try {
                const fetchedFile = await this.fetchImageFile(url);
                this.processFile(fetchedFile);
              } catch (error) {
                this.error.set('Failed to load image from URL');
              }
            });
          }
        }
      }
    }
  }

  private async fetchImageFile(url: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    const fileName = url.split('/').pop() || 'image.jpg';
    return new File([blob], fileName, { type: blob.type });
  }

  private processFile(file: File): void {
    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.error.set('File size must be less than 10MB');
      return;
    }

    // Check max files limit
    if (this.images().length >= this.MAX_FILES) {
      this.error.set(`Maximum ${this.MAX_FILES} images allowed`);
      return;
    }

    this.error.set(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      this.images.update(current => [...current, { file, preview }]);
      this.emitFiles();
    };
    reader.readAsDataURL(file);
  }

  private emitFiles(): void {
    const current = this.images();
    this.filesSelected.emit({
      primary: current[0]?.file || null,
      secondary: current[1]?.file || null
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}