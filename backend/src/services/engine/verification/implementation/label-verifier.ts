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

    // Check for word boundary match (not just substring)
    // Create regex that matches the brand as complete words
    const brandWords = normalizedBrand.split(/\s+/);
    const wordBoundaryPattern = brandWords.map(word => `\\b${this.escapeRegex(word)}\\b`).join('\\s+');
    const regex = new RegExp(wordBoundaryPattern);

    if (regex.test(normalizedExtracted)) {
      const foundText = this.extractMatchingText(normalizedBrand, extractedText);
      return {
        fieldType: FieldType.BrandName,
        status: MatchStatus.Match,
        message: 'Brand name found on label',
        expected: brandName,
        found: foundText || brandName,
      };
    }

    // Fuzzy matching for OCR errors, but still require reasonable length match
    const score = fuzzball.partial_ratio(normalizedBrand, normalizedExtracted);

    if (score >= config.verification.fuzzyMatchThreshold) {
      const foundText = this.extractBestMatch(normalizedBrand, extractedText);

      // Verify the found text is proportional to the search term (prevent "a" matching everything)
      if (foundText && foundText.length >= normalizedBrand.length * config.verification.fuzzyMatchMinLength) {
        return {
          fieldType: FieldType.BrandName,
          status: MatchStatus.Match,
          message: 'Brand name found on label',
          expected: brandName,
          found: foundText || `~${brandName}`,
        };
      }
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

    // Check for word boundary match (not just substring)
    const typeWords = normalizedType.split(/\s+/);
    const wordBoundaryPattern = typeWords.map(word => `\\b${this.escapeRegex(word)}\\b`).join('\\s+');
    const regex = new RegExp(wordBoundaryPattern);

    if (regex.test(normalizedExtracted)) {
      return {
        fieldType: FieldType.ProductType,
        status: MatchStatus.Match,
        message: 'Product type found on label',
        expected: productType,
        found: productType,
      };
    }

    // Fuzzy matching for OCR errors, but still require reasonable length match
    const score = fuzzball.partial_ratio(normalizedType, normalizedExtracted);

    if (score >= config.verification.fuzzyMatchThreshold) {
      const foundText = this.extractBestMatch(normalizedType, extractedText);

      // Verify the found text is proportional to the search term
      if (foundText && foundText.length >= normalizedType.length * config.verification.fuzzyMatchMinLength) {
        return {
          fieldType: FieldType.ProductType,
          status: MatchStatus.Match,
          message: 'Product type found on label',
          expected: productType,
          found: foundText || productType,
        };
      }
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
    // Extract volume text with unit from OCR
    const foundVolume = this.extractVolumeWithUnit(extractedText);

    if (foundVolume) {
      // Normalize both the expected and found values for comparison
      const normalizedExpected = this.normalizeVolumeString(value, unit);
      const normalizedFound = this.normalizeVolumeString(foundVolume.value, foundVolume.unit);

      // Exact match on value and unit (no conversions)
      if (normalizedExpected.value === normalizedFound.value &&
          normalizedExpected.unit === normalizedFound.unit) {
        return {
          fieldType: FieldType.NetContents,
          status: MatchStatus.Match,
          message: 'Net contents matches',
          expected: `${value} ${unit}`,
          found: `${foundVolume.value} ${foundVolume.unit}`,
        };
      }

      return {
        fieldType: FieldType.NetContents,
        status: MatchStatus.Mismatch,
        message: 'Net contents does not match label',
        expected: `${value} ${unit}`,
        found: `${foundVolume.value} ${foundVolume.unit}`,
      };
    }

    return {
      fieldType: FieldType.NetContents,
      status: MatchStatus.NotFound,
      message: 'Net contents not found on label',
      expected: `${value} ${unit}`,
    };
  }

  /**
   * Extract volume value and unit from OCR text
   */
  private extractVolumeWithUnit(text: string): { value: number; unit: string } | null {
    const normalized = text.toUpperCase().replace(/\.(\s|$)/g, '$1').replace(/\s+/g, ' ');

    // Search for volume patterns in order of specificity
    const patterns = [
      { regex: /(\d+(?:\.\d+)?)\s*(?:FL\s*OZ|FLOZ)/i, unit: 'fl oz' },
      { regex: /(\d+(?:\.\d+)?)\s*GAL/i, unit: 'gal' },
      { regex: /(\d+(?:\.\d+)?)\s*ML/i, unit: 'ml' },
      { regex: /(\d+(?:\.\d+)?)\s*CL/i, unit: 'cl' },
      { regex: /(\d+(?:\.\d+)?)\s*L(?:\s|$)/i, unit: 'L' },
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern.regex);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value) && value > 0) {
          return { value, unit: pattern.unit };
        }
      }
    }

    return null;
  }

  /**
   * Normalize volume string for comparison (handle decimal variations)
   */
  private normalizeVolumeString(value: number, unit: string): { value: number; unit: string } {
    // Normalize unit to lowercase for comparison
    const normalizedUnit = unit.toLowerCase().trim();

    // Round value to 2 decimal places to avoid floating point issues
    const roundedValue = Math.round(value * 100) / 100;

    return { value: roundedValue, unit: normalizedUnit };
  }


  private removePunctuation(text: string): string {
    // Keep apostrophes for possessives like "Daniel's"
    return text.replace(/[^A-Z0-9' ]/g, '');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Extract the actual matching text from OCR output
   */
  private extractMatchingText(searchTerm: string, extractedText: string): string | null {
    const normalizedSearch = this.removePunctuation(searchTerm.toUpperCase());
    const normalizedExtracted = this.removePunctuation(extractedText);

    const index = normalizedExtracted.indexOf(normalizedSearch);
    if (index === -1) return null;

    // Extract the original text (with punctuation including apostrophes) from the same position
    let charCount = 0;
    let startIdx = 0;

    for (let i = 0; i < extractedText.length; i++) {
      const char = extractedText[i];
      // Include apostrophes when counting characters
      if (/[A-Z0-9' ]/.test(char.toUpperCase())) {
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

    return bestScore >= config.verification.bestMatchThreshold ? bestMatch : null;
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
      return foundKeywords.length >= Math.ceil(keywords.length * config.verification.keywordMatchThreshold);
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