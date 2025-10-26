import { FieldValidator } from '../implementation/field-validator';
import { FormData } from '../../../../common/contracts/form-data';
import createError from 'http-errors';

describe('FieldValidator', () => {
  let validator: FieldValidator;

  beforeEach(() => {
    validator = new FieldValidator();
  });

  describe('validate', () => {
    it('should pass validation for valid form data', () => {
      const validData: FormData = {
        brandName: 'Old Tom Distillery',
        productType: 'Kentucky Straight Bourbon Whiskey',
        alcoholContent: 45,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should pass validation with optional net contents', () => {
      const validData: FormData = {
        brandName: 'Old Tom Distillery',
        productType: 'Bourbon',
        alcoholContent: 40,
        netContentsValue: 750,
        netContentsUnit: 'ml',
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should pass validation with zero alcohol content', () => {
      const validData: FormData = {
        brandName: 'Non-Alcoholic Brand',
        productType: 'Non-Alcoholic Beer',
        alcoholContent: 0,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should pass validation with 100% alcohol content', () => {
      const validData: FormData = {
        brandName: 'Pure Spirits',
        productType: 'Grain Alcohol',
        alcoholContent: 100,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });
  });

  describe('validateBrandName', () => {
    it('should throw error when brand name is missing', () => {
      const invalidData: FormData = {
        brandName: '',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Brand name is required');
    });

    it('should throw error when brand name is only whitespace', () => {
      const invalidData: FormData = {
        brandName: '   ',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Brand name is required');
    });

    it('should throw error when brand name exceeds 200 characters', () => {
      const invalidData: FormData = {
        brandName: 'A'.repeat(201),
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Brand name cannot exceed 200 characters');
    });

    it('should pass validation for brand name with exactly 200 characters', () => {
      const validData: FormData = {
        brandName: 'A'.repeat(200),
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should pass validation for brand name with special characters', () => {
      const validData: FormData = {
        brandName: "O'Malley's Distillery & Co.",
        productType: 'Whiskey',
        alcoholContent: 40,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });
  });

  describe('validateProductType', () => {
    it('should throw error when product type is missing', () => {
      const invalidData: FormData = {
        brandName: 'Old Tom',
        productType: '',
        alcoholContent: 45,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Product type is required');
    });

    it('should throw error when product type is only whitespace', () => {
      const invalidData: FormData = {
        brandName: 'Old Tom',
        productType: '   ',
        alcoholContent: 45,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Product type is required');
    });

    it('should throw error when product type exceeds 200 characters', () => {
      const invalidData: FormData = {
        brandName: 'Old Tom',
        productType: 'A'.repeat(201),
        alcoholContent: 45,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Product type cannot exceed 200 characters');
    });

    it('should pass validation for product type with exactly 200 characters', () => {
      const validData: FormData = {
        brandName: 'Old Tom',
        productType: 'A'.repeat(200),
        alcoholContent: 45,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });
  });

  describe('validateAlcoholContent', () => {
    it('should throw error when alcohol content is undefined', () => {
      const invalidData: any = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Alcohol content is required');
    });

    it('should throw error when alcohol content is null', () => {
      const invalidData: any = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: null,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Alcohol content is required');
    });

    it('should throw error when alcohol content is not a number', () => {
      const invalidData: any = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 'forty-five',
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Alcohol content must be a valid number');
    });

    it('should throw error when alcohol content is NaN', () => {
      const invalidData: any = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: NaN,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Alcohol content must be a valid number');
    });

    it('should throw error when alcohol content is negative', () => {
      const invalidData: FormData = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: -1,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Alcohol content must be between 0 and 100');
    });

    it('should throw error when alcohol content exceeds 100', () => {
      const invalidData: FormData = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 101,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Alcohol content must be between 0 and 100');
    });

    it('should pass validation for decimal alcohol content', () => {
      const validData: FormData = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45.5,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should pass validation for very small decimal alcohol content', () => {
      const validData: FormData = {
        brandName: 'Light Beer',
        productType: 'Beer',
        alcoholContent: 0.5,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });
  });

  describe('validateNetContents', () => {
    it('should pass validation when net contents is undefined', () => {
      const validData: FormData = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should pass validation when net contents is not provided', () => {
      const validData: FormData = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should throw error when net contents value is provided without unit', () => {
      const invalidData: any = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 750,
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Net contents unit is required when value is provided');
    });

    it('should throw error when net contents unit is provided without value', () => {
      const invalidData: any = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsUnit: 'ml',
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Net contents value is required when unit is provided');
    });

    it('should throw error when net contents value is zero or negative', () => {
      const invalidData: any = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 0,
        netContentsUnit: 'ml',
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Net contents value must be greater than 0');
    });

    it('should throw error for invalid net contents unit', () => {
      const invalidData: any = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 750,
        netContentsUnit: 'invalid',
      };

      expect(() => validator.validate(invalidData)).toThrow(Error);
      expect(() => validator.validate(invalidData)).toThrow('Net contents unit must be one of:');
    });

    it('should pass validation for various net contents units', () => {
      const formats = [
        { value: 750, unit: 'ml' },
        { value: 75, unit: 'cl' },
        { value: 1, unit: 'L' },
        { value: 1.5, unit: 'L' },
        { value: 25.4, unit: 'fl oz' },
        { value: 1, unit: 'gal' },
      ];

      formats.forEach(({ value, unit }) => {
        const validData: any = {
          brandName: 'Old Tom',
          productType: 'Bourbon',
          alcoholContent: 45,
          netContentsValue: value,
          netContentsUnit: unit,
        };

        expect(() => validator.validate(validData)).not.toThrow();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle form data with all fields at maximum valid values', () => {
      const validData: FormData = {
        brandName: 'A'.repeat(200),
        productType: 'B'.repeat(200),
        alcoholContent: 100,
        netContentsValue: 999999,
        netContentsUnit: 'L',
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should handle form data with minimum valid values', () => {
      const validData: FormData = {
        brandName: 'A',
        productType: 'B',
        alcoholContent: 0,
      };

      expect(() => validator.validate(validData)).not.toThrow();
    });

    it('should validate all fields and throw first error encountered', () => {
      const invalidData: any = {
        brandName: '',
        productType: '',
        alcoholContent: -1,
      };

      // Should throw error for brand name first since it's validated first
      expect(() => validator.validate(invalidData)).toThrow('Brand name is required');
    });
  });
});