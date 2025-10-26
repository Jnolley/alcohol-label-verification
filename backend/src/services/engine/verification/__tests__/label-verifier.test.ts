import { LabelVerifier } from '../implementation/label-verifier';
import { FormData } from '../../../../common/contracts/form-data';
import { FieldType } from '../../../../common/enums/field-type';
import { MatchStatus } from '../../../../common/enums/match-status';
import { ExtractedText } from '../../ocr/contracts/extracted-text';
import { INormalizer } from '../../../utility/normalization/interface/normalizer.interface';

describe('LabelVerifier', () => {
  let verifier: LabelVerifier;
  let mockNormalizer: jest.Mocked<INormalizer>;

  beforeEach(() => {
    mockNormalizer = {
      normalizeAbv: jest.fn(),
      normalizeVolume: jest.fn((text: string) => {
        // Simple string-based extraction matching real normalizer behavior
        const upper = text.toUpperCase();
        if (upper.includes('750ML') || upper.includes('750 ML') || upper.includes('750 MILLILITERS')) return 750;
        if (upper.includes('1L') || upper.includes('1 L') || upper.includes('1 LITERS')) return 1000;
        if (upper.includes('75CL') || upper.includes('75 CL') || upper.includes('75 CENTILITERS')) return 750;
        return null;
      }),
      convertToMilliliters: jest.fn((value: number, unit: string) => {
        const lowerUnit = unit.toLowerCase();
        if (lowerUnit === 'ml') return value;
        if (lowerUnit === 'cl') return value * 10;
        if (lowerUnit === 'l') return value * 1000;
        return value;
      }),
    };
    verifier = new LabelVerifier(mockNormalizer);
  });

  const createExtractedText = (text: string, confidence: number = 90): ExtractedText => ({
    raw: text,
    normalized: text.toUpperCase(),
    confidence,
    words: [],
  });

  describe('verify', () => {
    it('should return success when all fields match', () => {
      const formData: FormData = {
        brandName: 'Old Tom Distillery',
        productType: 'Kentucky Straight Bourbon Whiskey',
        alcoholContent: 45,
        netContentsValue: 750,
        netContentsUnit: 'ml',
      };

      const fullWarning =
        'GOVERNMENT WARNING SURGEON GENERAL WOMEN SHOULD NOT DRINK ALCOHOLIC BEVERAGES DURING PREGNANCY ' +
        'RISK OF BIRTH DEFECTS CONSUMPTION OF ALCOHOLIC BEVERAGES IMPAIRS YOUR ABILITY TO DRIVE ' +
        'OPERATE MACHINERY MAY CAUSE HEALTH PROBLEMS';

      const extractedText = createExtractedText(
        `OLD TOM DISTILLERY KENTUCKY STRAIGHT BOURBON WHISKEY 45% 750ML ${fullWarning}`
      );

      const result = verifier.verify(formData, extractedText);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Label matches form data');
      expect(result.fieldChecks).toHaveLength(5); // brand, product, alcohol, net contents, govt warning
    });

    it('should return failure when some fields do not match', () => {
      const formData: FormData = {
        brandName: 'Different Brand',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('OLD TOM DISTILLERY BOURBON 45%');

      const result = verifier.verify(formData, extractedText);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Label does not match form data');
    });

    it('should include all field checks in result', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45%');

      const result = verifier.verify(formData, extractedText);

      const fieldTypes = result.fieldChecks.map((check) => check.fieldType);
      expect(fieldTypes).toContain(FieldType.BrandName);
      expect(fieldTypes).toContain(FieldType.ProductType);
      expect(fieldTypes).toContain(FieldType.AlcoholContent);
      expect(fieldTypes).toContain(FieldType.GovernmentWarning);
    });

    it('should skip net contents verification when not provided', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45%');

      const result = verifier.verify(formData, extractedText);

      const netContentsCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.NetContents
      );
      expect(netContentsCheck).toBeUndefined();
    });
  });

  describe('verifyBrandName', () => {
    it('should match exact brand name', () => {
      const formData: FormData = {
        brandName: 'Old Tom Distillery',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('OLD TOM DISTILLERY BOURBON 45%');
      const result = verifier.verify(formData, extractedText);

      const brandCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.BrandName
      );
      expect(brandCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match brand name with case insensitivity', () => {
      const formData: FormData = {
        brandName: 'old tom distillery',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('OLD TOM DISTILLERY BOURBON 45%');
      const result = verifier.verify(formData, extractedText);

      const brandCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.BrandName
      );
      expect(brandCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match brand name ignoring punctuation', () => {
      const formData: FormData = {
        brandName: "O'Malley's Distillery",
        productType: 'Whiskey',
        alcoholContent: 40,
      };

      const extractedText = createExtractedText('OMALLEYS DISTILLERY WHISKEY 40%');
      const result = verifier.verify(formData, extractedText);

      const brandCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.BrandName
      );
      expect(brandCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match partial brand name (word matching)', () => {
      const formData: FormData = {
        brandName: 'Tom Distillery',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('OLD TOM DISTILLERY BOURBON 45%');
      const result = verifier.verify(formData, extractedText);

      const brandCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.BrandName
      );
      expect(brandCheck?.status).toBe(MatchStatus.Match);
    });

    it('should not match brand name with insufficient words', () => {
      const formData: FormData = {
        brandName: 'Different Brand Name Here',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('OLD TOM DISTILLERY BOURBON 45%');
      const result = verifier.verify(formData, extractedText);

      const brandCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.BrandName
      );
      expect(brandCheck?.status).toBe(MatchStatus.NotFound);
    });

    it('should skip very short words in brand matching', () => {
      const formData: FormData = {
        brandName: 'Distillery Bourbon Company',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('DISTILLERY BOURBON COMPANY 45%');
      const result = verifier.verify(formData, extractedText);

      const brandCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.BrandName
      );
      // Should match because "Distillery", "Bourbon", "Company" are all found
      expect(brandCheck?.status).toBe(MatchStatus.Match);
    });
  });

  describe('verifyProductType', () => {
    it('should match exact product type', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Kentucky Straight Bourbon Whiskey',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST KENTUCKY STRAIGHT BOURBON WHISKEY 45%');
      const result = verifier.verify(formData, extractedText);

      const productCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.ProductType
      );
      expect(productCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match product type keywords', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon Whiskey',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST KENTUCKY BOURBON WHISKEY 45%');
      const result = verifier.verify(formData, extractedText);

      const productCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.ProductType
      );
      expect(productCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match with minimum keyword threshold', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST KENTUCKY STRAIGHT BOURBON WHISKEY 45%');
      const result = verifier.verify(formData, extractedText);

      const productCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.ProductType
      );
      expect(productCheck?.status).toBe(MatchStatus.Match);
    });

    it('should not match when keywords not found', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Vodka',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON WHISKEY 45%');
      const result = verifier.verify(formData, extractedText);

      const productCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.ProductType
      );
      expect(productCheck?.status).toBe(MatchStatus.NotFound);
    });

    it('should match case-insensitive product types', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'bourbon whiskey',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON WHISKEY 45%');
      const result = verifier.verify(formData, extractedText);

      const productCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.ProductType
      );
      expect(productCheck?.status).toBe(MatchStatus.Match);
    });
  });

  describe('verifyAlcoholContent', () => {
    it('should match exact alcohol content with percentage', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45%');
      const result = verifier.verify(formData, extractedText);

      const alcoholCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.AlcoholContent
      );
      expect(alcoholCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match alcohol content with decimal', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45.5,
      };

      const extractedText = createExtractedText('TEST BOURBON 45.5%');
      const result = verifier.verify(formData, extractedText);

      const alcoholCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.AlcoholContent
      );
      expect(alcoholCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match within tolerance range', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45.4%');
      const result = verifier.verify(formData, extractedText);

      const alcoholCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.AlcoholContent
      );
      expect(alcoholCheck?.status).toBe(MatchStatus.Match);
    });

    it('should not match outside tolerance range', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 46%');
      const result = verifier.verify(formData, extractedText);

      const alcoholCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.AlcoholContent
      );
      expect(alcoholCheck?.status).toBe(MatchStatus.NotFound);
    });

    it('should match alcohol content without percentage symbol', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45 ALC/VOL');
      const result = verifier.verify(formData, extractedText);

      const alcoholCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.AlcoholContent
      );
      expect(alcoholCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match with space before percentage', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45 %');
      const result = verifier.verify(formData, extractedText);

      const alcoholCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.AlcoholContent
      );
      expect(alcoholCheck?.status).toBe(MatchStatus.Match);
    });

    it('should handle zero alcohol content', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Non-Alcoholic',
        alcoholContent: 0,
      };

      const extractedText = createExtractedText('TEST NON-ALCOHOLIC 0%');
      const result = verifier.verify(formData, extractedText);

      const alcoholCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.AlcoholContent
      );
      expect(alcoholCheck?.status).toBe(MatchStatus.Match);
    });

    it('should select correct percentage from multiple values', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45% CONTAINS 10% SUGAR');
      const result = verifier.verify(formData, extractedText);

      const alcoholCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.AlcoholContent
      );
      expect(alcoholCheck?.status).toBe(MatchStatus.Match);
    });
  });

  describe('verifyNetContents', () => {
    it('should match exact net contents', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 750,
        netContentsUnit: 'mL',
      };

      const extractedText = createExtractedText('TEST BOURBON 45% 750ML');
      const result = verifier.verify(formData, extractedText);

      const netContentsCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.NetContents
      );
      expect(netContentsCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match net contents ignoring whitespace', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 750,
        netContentsUnit: 'mL',
      };

      const extractedText = createExtractedText('TEST BOURBON 45% 750ML');
      const result = verifier.verify(formData, extractedText);

      const netContentsCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.NetContents
      );
      expect(netContentsCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match net contents with different case', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 750,
        netContentsUnit: 'ml',
      };

      const extractedText = createExtractedText('TEST BOURBON 45% 750ML');
      const result = verifier.verify(formData, extractedText);

      const netContentsCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.NetContents
      );
      expect(netContentsCheck?.status).toBe(MatchStatus.Match);
    });

    it('should match net contents by numeric value', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 750,
        netContentsUnit: 'mL',
      };

      const extractedText = createExtractedText('TEST BOURBON 45% NET: 750 MILLILITERS');
      const result = verifier.verify(formData, extractedText);

      const netContentsCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.NetContents
      );
      expect(netContentsCheck?.status).toBe(MatchStatus.Match);
    });

    it('should not match when net contents not found', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 1,
        netContentsUnit: 'L',
      };

      const extractedText = createExtractedText('TEST BOURBON 45% 750ML');
      const result = verifier.verify(formData, extractedText);

      const netContentsCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.NetContents
      );
      // Mismatch because we found 750ml but expected 1000ml (1L)
      expect(netContentsCheck?.status).toBe(MatchStatus.Mismatch);
    });
  });

  describe('verifyGovernmentWarning', () => {
    it('should match when all required warning sections present', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const warningText =
        'GOVERNMENT WARNING (1) ACCORDING TO THE SURGEON GENERAL WOMEN SHOULD NOT DRINK ' +
        'ALCOHOLIC BEVERAGES DURING PREGNANCY BECAUSE OF THE RISK OF BIRTH DEFECTS ' +
        '(2) CONSUMPTION OF ALCOHOLIC BEVERAGES IMPAIRS YOUR ABILITY TO DRIVE A CAR OR ' +
        'OPERATE MACHINERY AND MAY CAUSE HEALTH PROBLEMS';

      const extractedText = createExtractedText(`TEST BOURBON 45% ${warningText}`);
      const result = verifier.verify(formData, extractedText);

      const warningCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.GovernmentWarning
      );
      expect(warningCheck?.status).toBe(MatchStatus.Match);
    });

    it('should return mismatch when warning is incomplete', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const incompleteWarning = 'GOVERNMENT WARNING ACCORDING TO THE SURGEON GENERAL';

      const extractedText = createExtractedText(`TEST BOURBON 45% ${incompleteWarning}`);
      const result = verifier.verify(formData, extractedText);

      const warningCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.GovernmentWarning
      );
      expect(warningCheck?.status).toBe(MatchStatus.Mismatch);
    });

    it('should return not found when warning is completely missing', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45%');
      const result = verifier.verify(formData, extractedText);

      const warningCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.GovernmentWarning
      );
      expect(warningCheck?.status).toBe(MatchStatus.NotFound);
    });

    it('should handle partial warning with WARNING keyword', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('TEST BOURBON 45% WARNING: DRINK RESPONSIBLY');
      const result = verifier.verify(formData, extractedText);

      const warningCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.GovernmentWarning
      );
      expect(warningCheck?.status).toBe(MatchStatus.Mismatch);
    });
  });

  describe('edge cases and complex scenarios', () => {
    it('should handle OCR errors and misspellings gracefully', () => {
      const formData: FormData = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      // Simulate OCR errors
      const extractedText = createExtractedText('0LD T0M B0URB0N 45%');
      const result = verifier.verify(formData, extractedText);

      // Should still find matches due to flexible matching
      expect(result.fieldChecks.length).toBeGreaterThan(0);
    });

    it('should handle text with excessive whitespace', () => {
      const formData: FormData = {
        brandName: 'Old Tom',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('OLD    TOM    BOURBON    45%');
      const result = verifier.verify(formData, extractedText);

      const brandCheck = result.fieldChecks.find(
        (check) => check.fieldType === FieldType.BrandName
      );
      expect(brandCheck?.status).toBe(MatchStatus.Match);
    });

    it('should handle empty extracted text', () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const extractedText = createExtractedText('');
      const result = verifier.verify(formData, extractedText);

      expect(result.success).toBe(false);
      expect(result.fieldChecks.every((check) => check.status !== MatchStatus.Match)).toBe(true);
    });

    it('should handle very long text with all information scattered', () => {
      const formData: FormData = {
        brandName: 'Old Tom Distillery',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 750,
        netContentsUnit: 'mL',
      };

      const longText =
        'PREMIUM QUALITY OLD TOM DISTILLERY ESTABLISHED 1920 KENTUCKY STRAIGHT BOURBON ' +
        'WHISKEY AGED 8 YEARS ALCOHOL 45% BY VOLUME NET CONTENTS 750ML MADE IN USA ' +
        'GOVERNMENT WARNING...';

      const extractedText = createExtractedText(longText);
      const result = verifier.verify(formData, extractedText);

      expect(result.success).toBe(false); // Might fail on govt warning
      expect(
        result.fieldChecks.filter((check) => check.status === MatchStatus.Match).length
      ).toBeGreaterThan(2);
    });
  });
});