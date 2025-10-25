import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div
          [class]="getToastClass(toast.type)"
          class="px-4 py-3 rounded shadow-lg max-w-sm animate-slide-in"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">{{ toast.message }}</p>
            <button
              (click)="toastService.remove(toast.id)"
              class="ml-4 text-current opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClass(type: string): string {
    const baseClasses = 'border-l-4';
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-500 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-500 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-500 text-gray-800`;
    }
  }
}