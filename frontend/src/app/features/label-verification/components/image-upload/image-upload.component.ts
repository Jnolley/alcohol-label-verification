import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html'
})
export class ImageUploadComponent {
  fileSelected = output<File>();

  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  error = signal<string | null>(null);

  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.clearSelection();
      return;
    }

    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Please select a valid image file (JPEG, PNG, or WebP)');
      this.clearSelection();
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.error.set('File size must be less than 10MB');
      this.clearSelection();
      return;
    }

    // Clear any previous errors
    this.error.set(null);

    // Set selected file
    this.selectedFile.set(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Emit file to parent
    this.fileSelected.emit(file);
  }

  clearSelection(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.error.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}