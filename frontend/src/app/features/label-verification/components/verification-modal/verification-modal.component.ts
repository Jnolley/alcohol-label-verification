import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationResult } from '../../../../shared/models/verification-result.model';

@Component({
  selector: 'app-verification-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verification-modal.component.html',
  styleUrl: './verification-modal.component.css'
})
export class VerificationModalComponent {
  result = input.required<VerificationResult>();
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}