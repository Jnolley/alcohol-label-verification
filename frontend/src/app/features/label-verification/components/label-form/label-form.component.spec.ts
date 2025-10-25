import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LabelFormComponent } from './label-form.component';
import { MatchStatus } from '../../../../shared/enums/match-status.enum';
import { FieldType } from '../../../../shared/enums/field-type.enum';

describe('LabelFormComponent', () => {
  let component: LabelFormComponent;
  let fixture: ComponentFixture<LabelFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelFormComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(LabelFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.form.get('brandName')?.value).toBe('');
      expect(component.form.get('productType')?.value).toBe('');
      expect(component.form.get('alcoholContent')?.value).toBe('');
      expect(component.form.get('netContents')?.value).toBe('');
    });

    it('should have required validators on required fields', () => {
      expect(component.form.get('brandName')?.hasError('required')).toBe(true);
      expect(component.form.get('productType')?.hasError('required')).toBe(true);
      expect(component.form.get('alcoholContent')?.hasError('required')).toBe(true);
    });

    it('should not have required validator on netContents', () => {
      const netContents = component.form.get('netContents');
      netContents?.setValue('');
      expect(netContents?.hasError('required')).toBe(false);
    });

    it('should have min/max validators on alcoholContent', () => {
      const alcoholContent = component.form.get('alcoholContent');

      alcoholContent?.setValue(-1);
      expect(alcoholContent?.hasError('min')).toBe(true);

      alcoholContent?.setValue(101);
      expect(alcoholContent?.hasError('max')).toBe(true);

      alcoholContent?.setValue(50);
      expect(alcoholContent?.hasError('min')).toBe(false);
      expect(alcoholContent?.hasError('max')).toBe(false);
    });
  });

  describe('form submission', () => {
    it('should emit formSubmit when form is valid and onSubmit called', (done) => {
      component.formSubmit.subscribe(data => {
        expect(data.brandName).toBe('Test Brand');
        expect(data.productType).toBe('Bourbon');
        expect(data.alcoholContent).toBe(45);
        expect(data.netContents).toBe('750mL');
        done();
      });

      component.form.patchValue({
        brandName: 'Test Brand',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContents: '750mL'
      });

      component.onSubmit();
    });

    it('should not emit when form is invalid', () => {
      let emitted = false;
      component.formSubmit.subscribe(() => {
        emitted = true;
      });

      component.form.patchValue({
        brandName: '',
        productType: 'Bourbon',
        alcoholContent: 45
      });

      component.onSubmit();
      expect(emitted).toBe(false);
    });

    it('should convert alcoholContent to number', (done) => {
      component.formSubmit.subscribe(data => {
        expect(typeof data.alcoholContent).toBe('number');
        expect(data.alcoholContent).toBe(45.5);
        done();
      });

      component.form.patchValue({
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: '45.5'
      });

      component.onSubmit();
    });

    it('should handle submission without optional netContents', (done) => {
      component.formSubmit.subscribe(data => {
        expect(data.netContents).toBe('');
        done();
      });

      component.form.patchValue({
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContents: ''
      });

      component.onSubmit();
    });
  });

  describe('form validation', () => {
    it('should be invalid when brand name is empty', () => {
      component.form.patchValue({
        brandName: '',
        productType: 'Bourbon',
        alcoholContent: 45
      });
      expect(component.form.valid).toBe(false);
    });

    it('should be invalid when product type is empty', () => {
      component.form.patchValue({
        brandName: 'Test',
        productType: '',
        alcoholContent: 45
      });
      expect(component.form.valid).toBe(false);
    });

    it('should be invalid when alcohol content is empty', () => {
      component.form.patchValue({
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: ''
      });
      expect(component.form.valid).toBe(false);
    });

    it('should be valid with all required fields filled', () => {
      component.form.patchValue({
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45
      });
      expect(component.form.valid).toBe(true);
    });
  });

  describe('getFieldStatusClass', () => {
    it('should return success class for MATCH status', () => {
      fixture.componentRef.setInput('verificationResult', {
        success: true,
        message: 'Success',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.Match,
            message: 'Match',
            expected: 'Test',
            found: 'Test'
          }
        ]
      });
      fixture.detectChanges();

      const statusClass = component.getFieldStatusClass(FieldType.BrandName);
      expect(statusClass).toContain('border-success');
      expect(statusClass).toContain('bg-green-50');
    });

    it('should return error class for MISMATCH status', () => {
      fixture.componentRef.setInput('verificationResult', {
        success: false,
        message: 'Failed',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.Mismatch,
            message: 'Mismatch',
            expected: 'Test',
            found: 'Different'
          }
        ]
      });
      fixture.detectChanges();

      const statusClass = component.getFieldStatusClass(FieldType.BrandName);
      expect(statusClass).toContain('border-error');
      expect(statusClass).toContain('bg-red-50');
    });

    it('should return warning class for NOT_FOUND status', () => {
      fixture.componentRef.setInput('verificationResult', {
        success: false,
        message: 'Failed',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.NotFound,
            message: 'Not found',
            expected: 'Test'
          }
        ]
      });
      fixture.detectChanges();

      const statusClass = component.getFieldStatusClass(FieldType.BrandName);
      expect(statusClass).toContain('border-warning');
      expect(statusClass).toContain('bg-yellow-50');
    });

    it('should return empty string when no verification result', () => {
      const statusClass = component.getFieldStatusClass(FieldType.BrandName);
      expect(statusClass).toBe('');
    });

    it('should return empty string when field not in results', () => {
      fixture.componentRef.setInput('verificationResult', {
        success: true,
        message: 'Success',
        fieldChecks: []
      });
      fixture.detectChanges();

      const statusClass = component.getFieldStatusClass(FieldType.BrandName);
      expect(statusClass).toBe('');
    });
  });

  describe('form accessors', () => {
    it('should provide access to brandName control', () => {
      expect(component.brandName).toBe(component.form.get('brandName'));
    });

    it('should provide access to productType control', () => {
      expect(component.productType).toBe(component.form.get('productType'));
    });

    it('should provide access to alcoholContent control', () => {
      expect(component.alcoholContent).toBe(component.form.get('alcoholContent'));
    });

    it('should provide access to netContents control', () => {
      expect(component.netContents).toBe(component.form.get('netContents'));
    });
  });
});
