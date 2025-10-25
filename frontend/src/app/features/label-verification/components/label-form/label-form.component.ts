import { Component, output, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LabelFormData } from '../../../../shared/models/label-form-data.model';
import { VerificationResult } from '../../../../shared/models/verification-result.model';

@Component({
  selector: 'app-label-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './label-form.component.html'
})
export class LabelFormComponent {
  formSubmit = output<LabelFormData>();
  verificationResult = input<VerificationResult | null>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      brandName: ['', [Validators.required]],
      productType: ['', [Validators.required]],
      alcoholContent: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      netContents: ['']
    });

    // Emit form data whenever form changes and is valid
    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        const formValue = this.form.value;
        this.formSubmit.emit({
          ...formValue,
          alcoholContent: Number(formValue.alcoholContent)
        } as LabelFormData);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      this.formSubmit.emit({
        ...formValue,
        alcoholContent: Number(formValue.alcoholContent)
      } as LabelFormData);
    }
  }

  get brandName() {
    return this.form.get('brandName');
  }

  get productType() {
    return this.form.get('productType');
  }

  get alcoholContent() {
    return this.form.get('alcoholContent');
  }

  get netContents() {
    return this.form.get('netContents');
  }

  getFieldCheck(fieldType: string) {
    return this.verificationResult()?.fieldChecks.find(check => check.fieldType === fieldType);
  }

  getFieldStatusClass(fieldType: string): string {
    const check = this.getFieldCheck(fieldType);
    if (!check) return '';

    switch (check.status) {
      case 'MATCH':
        return 'border-success bg-green-50';
      case 'MISMATCH':
        return 'border-error bg-red-50';
      case 'NOT_FOUND':
        return 'border-warning bg-yellow-50';
      default:
        return '';
    }
  }
}