import { Component, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelFormComponent } from '../../components/label-form/label-form.component';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';
import { VerificationResultsComponent } from '../../components/verification-results/verification-results.component';
import { VerificationStore } from '../../store/verification.store';
import { LabelFormData } from '../../../../shared/models/label-form-data.model';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [
    CommonModule,
    LabelFormComponent,
    ImageUploadComponent,
    VerificationResultsComponent
  ],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.css'
})
export class VerificationComponent {
  store = inject(VerificationStore);
  formComponent = viewChild(LabelFormComponent);

  formData: LabelFormData | null = null;
  imageFile: File | null = null;

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
    if (!this.canSubmit) {
      return;
    }

    // TODO: Trigger verification via store when backend is ready
    // For now, this is a placeholder
    console.log('Form Data:', this.formData);
    console.log('Image File:', this.imageFile);
  }

  onReset(): void {
    this.formData = null;
    this.imageFile = null;
    this.formComponent()?.form.reset();
  }
}