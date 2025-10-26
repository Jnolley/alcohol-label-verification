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

  readonly volumeUnits = ['ml', 'cl', 'L', 'fl oz', 'gal'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      brandName: ['', [Validators.required]],
      productType: ['', [Validators.required]],
      alcoholContent: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      netContentsValue: [''],
      netContentsUnit: ['ml']
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        this.emitFormData();
      }
    });
  }

  private emitFormData(): void {
    const formValue = this.form.value;
    this.formSubmit.emit({
      brandName: formValue.brandName,
      productType: formValue.productType,
      alcoholContent: Number(formValue.alcoholContent),
      netContentsValue: formValue.netContentsValue ? Number(formValue.netContentsValue) : undefined,
      netContentsUnit: formValue.netContentsValue ? formValue.netContentsUnit : undefined
    } as LabelFormData);
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

  get netContentsValue() {
    return this.form.get('netContentsValue');
  }

  get netContentsUnit() {
    return this.form.get('netContentsUnit');
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