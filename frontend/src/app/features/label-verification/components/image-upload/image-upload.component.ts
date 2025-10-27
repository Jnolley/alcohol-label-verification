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
  isDragging = signal<boolean>(false);

  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.clearSelection();
      return;
    }

    this.processFile(file);
  }

  clearSelection(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.error.set(null);
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

    // Try getting file from files first (local file drops)
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
      return;
    }

    // Handle drops from browser windows/other sources using items API
    const items = event.dataTransfer?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Try to get as file first
        if (item.kind === 'file') {
          const droppedFile = item.getAsFile();
          if (droppedFile) {
            this.processFile(droppedFile);
            return;
          }
        }

        // If it's a string (URL), fetch the image
        if (item.kind === 'string' && item.type.match('^text/uri-list')) {
          item.getAsString(async (url) => {
            try {
              await this.fetchAndProcessImage(url);
            } catch (error) {
              this.error.set('Failed to load image from URL');
            }
          });
          return;
        }
      }
    }

    // Fallback: try to get URL from getData
    const url = event.dataTransfer?.getData('text/uri-list') || event.dataTransfer?.getData('text/html');
    if (url) {
      try {
        await this.fetchAndProcessImage(url);
      } catch (error) {
        this.error.set('Failed to load image from URL');
      }
    }
  }

  private async fetchAndProcessImage(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      // Convert blob to File
      const fileName = url.split('/').pop() || 'image.jpg';
      const file = new File([blob], fileName, { type: blob.type });

      this.processFile(file);
    } catch (error) {
      throw new Error('Failed to fetch image');
    }
  }

  private processFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Please select a valid image file (JPEG, PNG, or WebP)');
      this.clearSelection();
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.error.set('File size must be less than 10MB');
      this.clearSelection();
      return;
    }

    this.error.set(null);
    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.fileSelected.emit(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
