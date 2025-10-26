import { IFieldValidator } from '../interface/field-validator.interface';
import { FormData } from '../../../../common/contracts/form-data';
import createError from 'http-errors';

export class FieldValidator implements IFieldValidator {
  validate(formData: FormData): void {
    // Validate brandName
    if (!formData.brandName || typeof formData.brandName !== 'string') {
      throw createError(400, 'Brand name is required');
    }
    const brandName = formData.brandName.trim();
    if (brandName.length === 0) {
      throw createError(400, 'Brand name is required');
    }
    if (brandName.length > 200) {
      throw createError(400, 'Brand name cannot exceed 200 characters');
    }

    // Validate productType
    if (!formData.productType || typeof formData.productType !== 'string') {
      throw createError(400, 'Product type is required');
    }
    const productType = formData.productType.trim();
    if (productType.length === 0) {
      throw createError(400, 'Product type is required');
    }
    if (productType.length > 200) {
      throw createError(400, 'Product type cannot exceed 200 characters');
    }

    // Validate alcoholContent
    if (formData.alcoholContent === undefined || formData.alcoholContent === null) {
      throw createError(400, 'Alcohol content is required');
    }
    if (typeof formData.alcoholContent !== 'number' || isNaN(formData.alcoholContent)) {
      throw createError(400, 'Alcohol content must be a valid number');
    }
    if (formData.alcoholContent < 0 || formData.alcoholContent > 100) {
      throw createError(400, 'Alcohol content must be between 0 and 100');
    }

    // Validate netContents (optional but both value and unit must be present together)
    const hasValue = formData.netContentsValue !== undefined;
    const hasUnit = formData.netContentsUnit !== undefined;

    if (hasValue && !hasUnit) {
      throw createError(400, 'Net contents unit is required when value is provided');
    }
    if (hasUnit && !hasValue) {
      throw createError(400, 'Net contents value is required when unit is provided');
    }

    if (hasValue) {
      if (typeof formData.netContentsValue !== 'number' || isNaN(formData.netContentsValue)) {
        throw createError(400, 'Net contents value must be a valid number');
      }
      if (formData.netContentsValue <= 0) {
        throw createError(400, 'Net contents value must be greater than 0');
      }
    }

    if (hasUnit) {
      const allowedUnits = ['ml', 'cl', 'L', 'fl oz', 'gal'];
      if (typeof formData.netContentsUnit !== 'string' || !allowedUnits.includes(formData.netContentsUnit)) {
        throw createError(400, 'Net contents unit must be one of: ml, cl, L, fl oz, gal');
      }
    }
  }
}
