import { IFieldValidator } from '../interface/field-validator.interface';
import { FormData, FieldValidationException } from '../../../../common';

export class FieldValidator implements IFieldValidator {
  validate(formData: FormData): void {
    this.validateBrandName(formData.brandName);
    this.validateProductType(formData.productType);
    this.validateAlcoholContent(formData.alcoholContent);

    // Net contents is optional - only validate if provided
    if (formData.netContentsValue !== undefined || formData.netContentsUnit !== undefined) {
      this.validateNetContents(formData.netContentsValue, formData.netContentsUnit);
    }
  }

  private validateBrandName(brandName: string): void {
    if (!brandName || brandName.trim().length === 0) {
      throw new FieldValidationException('Brand name is required', 'brandName');
    }

    if (brandName.length > 200) {
      throw new FieldValidationException('Brand name cannot exceed 200 characters', 'brandName');
    }
  }

  private validateProductType(productType: string): void {
    if (!productType || productType.trim().length === 0) {
      throw new FieldValidationException('Product type is required', 'productType');
    }

    if (productType.length > 200) {
      throw new FieldValidationException('Product type cannot exceed 200 characters', 'productType');
    }
  }

  private validateAlcoholContent(alcoholContent: number): void {
    if (alcoholContent === undefined || alcoholContent === null) {
      throw new FieldValidationException('Alcohol content is required', 'alcoholContent');
    }

    if (typeof alcoholContent !== 'number' || isNaN(alcoholContent)) {
      throw new FieldValidationException('Alcohol content must be a valid number', 'alcoholContent');
    }

    if (alcoholContent < 0 || alcoholContent > 100) {
      throw new FieldValidationException('Alcohol content must be between 0 and 100', 'alcoholContent');
    }
  }

  private validateNetContents(value?: number, unit?: string): void {
    // If value is provided, unit must also be provided
    if (value !== undefined && !unit) {
      throw new FieldValidationException('Net contents unit is required when value is provided', 'netContentsUnit');
    }
    if (unit && value === undefined) {
      throw new FieldValidationException('Net contents value is required when unit is provided', 'netContentsValue');
    }
    if (value !== undefined && value <= 0) {
      throw new FieldValidationException('Net contents value must be greater than 0', 'netContentsValue');
    }

    // Validate unit is one of the allowed values
    const allowedUnits = ['ml', 'cl', 'L', 'fl oz', 'gal'];
    if (unit && !allowedUnits.includes(unit)) {
      throw new FieldValidationException(`Net contents unit must be one of: ${allowedUnits.join(', ')}`, 'netContentsUnit');
    }
  }
}
