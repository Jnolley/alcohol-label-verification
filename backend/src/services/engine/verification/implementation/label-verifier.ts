import { ILabelVerifier } from '../interface/label-verifier.interface';
import { FormData } from '../../../../common/contracts/form-data';
import { VerificationResult } from '../../../../common/contracts/verification-result';
import { FieldCheck } from '../../../../common/contracts/field-check';
import { FieldType } from '../../../../common/enums/field-type';
import { MatchStatus } from '../../../../common/enums/match-status';
import { ExtractedText } from '../../ocr/contracts/extracted-text';
import { INormalizer } from '../../../utility/normalization/interface/normalizer.interface';
import config from '../../../../config';
import * as fuzzball from 'fuzzball';

export class LabelVerifier implements ILabelVerifier {
  constructor(private readonly normalizer: INormalizer) {}

  verify(formData: FormData, extractedText: ExtractedText): VerificationResult {
    const fieldChecks: FieldCheck[] = [
      this.verifyBrandName(formData.brandName, extractedText.normalized),
      this.verifyProductType(formData.productType, extractedText.normalized),
      this.verifyAlcoholContent(formData.alcoholContent, extractedText.normalized),
    ];

    if (formData.netContentsValue && formData.netContentsUnit) {
      fieldChecks.push(this.verifyNetContents(formData.netContentsValue, formData.netContentsUnit, extractedText.normalized));
    }

    fieldChecks.push(this.verifyGovernmentWarning(extractedText.normalized));

    const allMatch = fieldChecks.every(check => check.status === MatchStatus.Match);

    return {
      success: allMatch,
      message: allMatch ? 'Label matches form data' : 'Label does not match form data',
      fieldChecks,
    };
  }

  private verifyBrandName(brandName: string, extractedText: string): FieldCheck {
    const normalizedBrand = this.removePunctuation(brandName.toUpperCase().trim());
    const normalizedExtracted = this.removePunctuation(extractedText);

    // Try exact match first
    if (normalizedExtracted.includes(normalizedBrand)) {
      return {
        fieldType: FieldType.BrandName,
        status: MatchStatus.Match,
        message: 'Brand name found on label',
        expected: brandName,
        found: brandName,
      };
    }

    // Use fuzzy matching
    const score = fuzzball.partial_ratio(normalizedBrand, normalizedExtracted);

    if (score >= config.verification.fuzzyMatchThreshold) {
      return {
        fieldType: FieldType.BrandName,
        status: MatchStatus.Match,
        message: `Brand name found on label (${score}% match)`,
        expected: brandName,
        found: brandName,
      };
    }

    return {
      fieldType: FieldType.BrandName,
      status: MatchStatus.NotFound,
      message: 'Brand name not found on label',
      expected: brandName,
    };
  }

  private verifyProductType(productType: string, extractedText: string): FieldCheck {
    const normalizedType = this.removePunctuation(productType.toUpperCase().trim());
    const normalizedExtracted = this.removePunctuation(extractedText);

    // Try exact match first
    if (normalizedExtracted.includes(normalizedType)) {
      return {
        fieldType: FieldType.ProductType,
        status: MatchStatus.Match,
        message: 'Product type found on label',
        expected: productType,
        found: productType,
      };
    }

    // Use fuzzy matching
    const score = fuzzball.partial_ratio(normalizedType, normalizedExtracted);

    if (score >= config.verification.fuzzyMatchThreshold) {
      return {
        fieldType: FieldType.ProductType,
        status: MatchStatus.Match,
        message: `Product type found on label (${score}% match)`,
        expected: productType,
        found: productType,
      };
    }

    return {
      fieldType: FieldType.ProductType,
      status: MatchStatus.NotFound,
      message: 'Product type not found on label',
      expected: productType,
    };
  }

  private verifyAlcoholContent(alcoholContent: number, extractedText: string): FieldCheck {
    // Find all percentage values in the text
    const percentageValues = this.extractPercentageValues(extractedText);

    for (const foundValue of percentageValues) {
      const difference = Math.abs(foundValue - alcoholContent);

      if (difference <= config.verification.alcoholContentTolerance) {
        return {
          fieldType: FieldType.AlcoholContent,
          status: MatchStatus.Match,
          message: 'Alcohol content matches',
          expected: `${alcoholContent}%`,
          found: `${foundValue}%`,
        };
      }
    }

    // Try to find the exact number in the text
    if (this.containsNumber(extractedText, alcoholContent)) {
      return {
        fieldType: FieldType.AlcoholContent,
        status: MatchStatus.Match,
        message: 'Alcohol content matches',
        expected: `${alcoholContent}%`,
        found: `${alcoholContent}%`,
      };
    }

    return {
      fieldType: FieldType.AlcoholContent,
      status: MatchStatus.NotFound,
      message: 'Alcohol content not found on label',
      expected: `${alcoholContent}%`,
    };
  }

  private extractPercentageValues(text: string): number[] {
    const values: number[] = [];
    let i = 0;

    while (i < text.length) {
      if (text[i] === '%') {
        // Look backwards to find the number
        let numberStr = '';
        let j = i - 1;

        // Skip whitespace
        while (j >= 0 && text[j] === ' ') {
          j--;
        }

        // Extract number
        while (j >= 0 && (this.isDigit(text[j]) || text[j] === '.')) {
          numberStr = text[j] + numberStr;
          j--;
        }

        if (numberStr) {
          const value = parseFloat(numberStr);
          if (!isNaN(value)) {
            values.push(value);
          }
        }
      }
      i++;
    }

    return values;
  }

  private containsNumber(text: string, target: number): boolean {
    const targetStr = target.toString();
    const targetWithDecimal = target.toFixed(1);

    return text.includes(targetStr) || text.includes(targetWithDecimal);
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private verifyNetContents(value: number, unit: string, extractedText: string): FieldCheck {
    // Convert user input to milliliters
    const expectedMl = this.normalizer.convertToMilliliters(value, unit);

    // Try to extract volume from label using normalizer
    const extractedMl = this.normalizer.normalizeVolume(extractedText);

    if (extractedMl !== null) {
      // Exact match required - no tolerance
      if (extractedMl === expectedMl) {
        return {
          fieldType: FieldType.NetContents,
          status: MatchStatus.Match,
          message: 'Net contents matches',
          expected: `${value} ${unit}`,
          found: `${extractedMl} ml`,
        };
      }

      return {
        fieldType: FieldType.NetContents,
        status: MatchStatus.Mismatch,
        message: 'Net contents does not match label',
        expected: `${value} ${unit} (${expectedMl} ml)`,
        found: `${extractedMl} ml`,
      };
    }

    return {
      fieldType: FieldType.NetContents,
      status: MatchStatus.NotFound,
      message: 'Net contents not found on label',
      expected: `${value} ${unit}`,
    };
  }

  private removePunctuation(text: string): string {
    return text.replace(/[^A-Z0-9 ]/g, '');
  }

  private verifyGovernmentWarning(extractedText: string): FieldCheck {
    const requiredSections = config.requiredTexts.governmentWarningSections;

    const foundSections = requiredSections.filter((section: string) =>
      extractedText.includes(section)
    );

    // Require 100% match - all required sections must be present
    if (foundSections.length === config.verification.governmentWarningMinSections) {
      return {
        fieldType: FieldType.GovernmentWarning,
        status: MatchStatus.Match,
        message: 'Government warning verified on label',
        expected: config.requiredTexts.governmentWarning,
        found: `All ${requiredSections.length} required sections found`,
      };
    }

    // If we found some sections but not all
    if (foundSections.length >= 4) {
      return {
        fieldType: FieldType.GovernmentWarning,
        status: MatchStatus.Mismatch,
        message: `Government warning incomplete (found ${foundSections.length}/${requiredSections.length} required sections)`,
        expected: config.requiredTexts.governmentWarning,
        found: `Partial warning text: ${foundSections.join(', ')}`,
      };
    }

    // If we found minimal or no sections
    if (extractedText.includes('WARNING')) {
      return {
        fieldType: FieldType.GovernmentWarning,
        status: MatchStatus.Mismatch,
        message: 'Warning text found but does not match required government warning',
        expected: config.requiredTexts.governmentWarning,
        found: 'Incomplete or incorrect warning text',
      };
    }

    return {
      fieldType: FieldType.GovernmentWarning,
      status: MatchStatus.NotFound,
      message: 'Government warning text is missing from the label',
      expected: config.requiredTexts.governmentWarning,
    };
  }
}