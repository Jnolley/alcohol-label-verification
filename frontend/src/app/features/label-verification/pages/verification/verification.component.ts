import { Component, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelFormComponent } from '../../components/label-form/label-form.component';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';
import { VerificationModalComponent } from '../../components/verification-modal/verification-modal.component';
import { VerificationStore } from '../../store/verification.store';
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
  templateUrl: './verification.component.html'
})
export class VerificationComponent {
  store = inject(VerificationStore);
  formComponent = viewChild(LabelFormComponent);

  showModal = false;

  onFormDataChange(data: LabelFormData): void {
    this.store.setFormData(data);
  }

  onImageSelected(file: File): void {
    this.store.setImage(file);
  }

  onSubmit(): void {
    this.store.submitVerification(() => {
      this.showModal = true;
    });
  }

  onReset(): void {
    this.formComponent()?.form.reset();
    this.store.reset();
    this.showModal = false;
  }

  onCloseModal(): void {
    this.showModal = false;
  }
}