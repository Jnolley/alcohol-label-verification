import { Component, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelFormComponent } from '../../components/label-form/label-form.component';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';
import { VerificationModalComponent } from '../../components/verification-modal/verification-modal.component';
import { VerificationStore } from '../../store/verification.store';
import { VerificationService } from '../../services/verification.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LabelFormData } from '../../../../shared/models/label-form-data.model';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [
    CommonModule,
    LabelFormComponent,
    ImageUploadComponent,
    VerificationModalComponent
  ],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.css'
})
export class VerificationComponent {
  store = inject(VerificationStore);
  verificationService = inject(VerificationService);
  toastService = inject(ToastService);
  formComponent = viewChild(LabelFormComponent);

  formData: LabelFormData | null = null;
  imageFile: File | null = null;
  showModal = false;

  onFormDataChange(data: LabelFormData): void {
    this.formData = data;
  }

  onImageSelected(file: File): void {
    this.imageFile = file;
  }

  get canSubmit(): boolean {
    return this.formData !== null && this.imageFile !== null;
  }

  onSubmit(): void {
    if (!this.canSubmit || !this.formData || !this.imageFile) {
      return;
    }

    this.store.setLoading();

    this.verificationService.verifyLabel({
      formData: this.formData,
      imageFile: this.imageFile
    }).subscribe({
      next: (result: any) => {
        this.store.setSuccess(result);
        this.showModal = true;
        if (result.success) {
          this.toastService.showSuccess('Label verification successful! All fields match.');
        } else {
          this.toastService.showWarning('Label verification completed with discrepancies. Check results in the modal.');
        }
      },
      error: (error: any) => {
        const errorMessage = error.error?.error?.message || error.message || 'Verification failed';
        this.store.setError(errorMessage);
        this.toastService.showError(errorMessage);
      }
    });
  }

  onReset(): void {
    this.formData = null;
    this.imageFile = null;
    this.formComponent()?.form.reset();
    this.store.reset();
    this.showModal = false;
  }

  onCloseModal(): void {
    this.showModal = false;
  }
}