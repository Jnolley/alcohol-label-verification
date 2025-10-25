import { IFieldValidator } from '../interface/field-validator.interface';
import { FormData, FieldValidationException } from '../../../../common';

export class FieldValidator implements IFieldValidator {
  validate(formData: FormData): void {
    this.validateBrandName(formData.brandName);
    this.validateProductType(formData.productType);
    this.validateAlcoholContent(formData.alcoholContent);

    if (formData.netContents !== undefined && formData.netContents !== null) {
      this.validateNetContents(formData.netContents);
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

  private validateNetContents(netContents: string): void {
    if (netContents.trim().length === 0) {
      throw new FieldValidationException('Net contents cannot be empty if provided', 'netContents');
    }

    if (netContents.length > 100) {
      throw new FieldValidationException('Net contents cannot exceed 100 characters', 'netContents');
    }
  }
}
