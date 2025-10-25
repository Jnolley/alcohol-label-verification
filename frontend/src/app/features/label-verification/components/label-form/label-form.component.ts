import { Component, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LabelFormData } from '../../../../shared/models/label-form-data.model';

@Component({
  selector: 'app-label-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './label-form.component.html',
  styleUrl: './label-form.component.css'
})
export class LabelFormComponent {
  formSubmit = output<LabelFormData>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      brandName: ['', [Validators.required]],
      productType: ['', [Validators.required]],
      alcoholContent: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      netContents: ['']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value as LabelFormData);
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
}