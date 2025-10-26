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

    if (normalizedExtracted.includes(normalizedBrand)) {
      const foundText = this.extractMatchingText(normalizedBrand, extractedText);
      return {
        fieldType: FieldType.BrandName,
        status: MatchStatus.Match,
        message: 'Brand name found on label',
        expected: brandName,
        found: foundText || brandName,
      };
    }

    const score = fuzzball.partial_ratio(normalizedBrand, normalizedExtracted);

    if (score >= config.verification.fuzzyMatchThreshold) {
      const foundText = this.extractBestMatch(normalizedBrand, extractedText);
      return {
        fieldType: FieldType.BrandName,
        status: MatchStatus.Match,
        message: 'Brand name found on label',
        expected: brandName,
        found: foundText || `~${brandName}`,
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

    if (normalizedExtracted.includes(normalizedType)) {
      return {
        fieldType: FieldType.ProductType,
        status: MatchStatus.Match,
        message: 'Product type found on label',
        expected: productType,
        found: productType,
      };
    }

    const score = fuzzball.partial_ratio(normalizedType, normalizedExtracted);

    if (score >= config.verification.fuzzyMatchThreshold) {
      return {
        fieldType: FieldType.ProductType,
        status: MatchStatus.Match,
        message: 'Product type found on label',
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
        let numberStr = '';
        let j = i - 1;

        while (j >= 0 && text[j] === ' ') {
          j--;
        }

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
    const expectedMl = this.normalizer.convertToMilliliters(value, unit);

    const extractedMl = this.normalizer.normalizeVolume(extractedText);

    if (extractedMl !== null) {
      // Round both to 2 decimal places for comparison to avoid floating point errors
      const roundedExpected = Math.round(expectedMl * 100) / 100;
      const roundedExtracted = Math.round(extractedMl * 100) / 100;

      // Exact match required - no tolerance (but with rounding for floating point)
      if (roundedExtracted === roundedExpected) {
        return {
          fieldType: FieldType.NetContents,
          status: MatchStatus.Match,
          message: 'Net contents matches',
          expected: `${value} ${unit}`,
          found: `${roundedExtracted} ml`,
        };
      }

      return {
        fieldType: FieldType.NetContents,
        status: MatchStatus.Mismatch,
        message: 'Net contents does not match label',
        expected: `${value} ${unit} (${roundedExpected} ml)`,
        found: `${roundedExtracted} ml`,
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

  /**
   * Extract the actual matching text from OCR output
   */
  private extractMatchingText(searchTerm: string, extractedText: string): string | null {
    const normalizedSearch = this.removePunctuation(searchTerm.toUpperCase());
    const normalizedExtracted = this.removePunctuation(extractedText);

    const index = normalizedExtracted.indexOf(normalizedSearch);
    if (index === -1) return null;

    // Extract the original text (with punctuation) from the same position
    let charCount = 0;
    let startIdx = 0;

    for (let i = 0; i < extractedText.length; i++) {
      const char = extractedText[i];
      if (/[A-Z0-9 ]/.test(char.toUpperCase())) {
        if (charCount === index) {
          startIdx = i;
          break;
        }
        charCount++;
      }
    }

    return extractedText.substring(startIdx, startIdx + searchTerm.length).trim();
  }

  /**
   * Extract best fuzzy match from OCR output
   */
  private extractBestMatch(searchTerm: string, extractedText: string): string | null {
    const words = extractedText.split(/\s+/);
    const searchWords = searchTerm.split(/\s+/);

    // Try to find the best matching consecutive words
    let bestMatch = '';
    let bestScore = 0;

    for (let i = 0; i <= words.length - searchWords.length; i++) {
      const candidate = words.slice(i, i + searchWords.length).join(' ');
      const score = fuzzball.ratio(this.removePunctuation(searchTerm.toUpperCase()), this.removePunctuation(candidate.toUpperCase()));

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestScore >= 70 ? bestMatch : null;
  }

  private verifyGovernmentWarning(extractedText: string): FieldCheck {
    const requiredSections = config.requiredTexts.governmentWarningSections;

    // Use flexible keyword-based matching instead of exact phrase matching
    // This handles OCR issues with line breaks and spacing
    const foundSections = requiredSections.filter((section: string) => {
      // For exact matches (short phrases), use exact matching
      if (section.split(' ').length <= 3) {
        return extractedText.includes(section);
      }

      // For longer phrases, check if most key words are present
      const keywords = section.split(' ').filter(word => word.length > 3); // Skip short words like "TO", "A", "OF"
      const foundKeywords = keywords.filter(keyword => extractedText.includes(keyword));

      // Require at least 80% of keywords to be present
      return foundKeywords.length >= Math.ceil(keywords.length * 0.8);
    });

    // Require all sections to be present
    if (foundSections.length >= config.verification.governmentWarningMinSections) {
      return {
        fieldType: FieldType.GovernmentWarning,
        status: MatchStatus.Match,
        message: 'Government warning verified on label',
        expected: config.requiredTexts.governmentWarning,
        found: `All required sections found`,
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