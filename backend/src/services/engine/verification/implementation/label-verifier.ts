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
import { isValidAlcoholType } from '../../../../config/alcohol-types';

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

    // First, verify the user input is a valid alcohol type
    // This prevents matching random words like "Crystal" or "French"
    if (!isValidAlcoholType(productType)) {
      return {
        fieldType: FieldType.ProductType,
        status: MatchStatus.NotFound,
        message: `"${productType}" is not a recognized alcohol type`,
        expected: productType,
      };
    }

    // Check for word boundary match (not just substring)
    const typeWords = normalizedType.split(/\s+/);
    const wordBoundaryPattern = typeWords.map(word => `\\b${this.escapeRegex(word)}\\b`).join('\\s+');
    const regex = new RegExp(wordBoundaryPattern);

    if (regex.test(normalizedExtracted)) {
      const foundText = this.extractMatchingText(normalizedType, extractedText);
      return {
        fieldType: FieldType.ProductType,
        status: MatchStatus.Match,
        message: 'Product type found on label',
        expected: productType,
        found: foundText || productType,
      };
    }

    // Fuzzy matching for OCR errors
    const score = fuzzball.partial_ratio(normalizedType, normalizedExtracted);

    if (score >= config.verification.fuzzyMatchThreshold) {
      const foundText = this.extractBestMatch(normalizedType, extractedText);

      // Verify found text is proportional
      if (foundText && foundText.length >= normalizedType.length * config.verification.fuzzyMatchMinLength) {
        return {
          fieldType: FieldType.ProductType,
          status: MatchStatus.Match,
          message: 'Product type found on label',
          expected: productType,
          found: foundText,
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
    // Extract alcohol percentages (numbers near "%" or "ABV" or "ALC/VOL")
    const percentageValues = this.extractAlcoholPercentages(extractedText);

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

    // If we found values but none matched, it's a mismatch
    if (percentageValues.length > 0) {
      return {
        fieldType: FieldType.AlcoholContent,
        status: MatchStatus.Mismatch,
        message: `Alcohol content mismatch: label shows ${percentageValues[0]}%, but you entered ${alcoholContent}%`,
        expected: `${alcoholContent}%`,
        found: `${percentageValues[0]}%`,
      };
    }

    return {
      fieldType: FieldType.AlcoholContent,
      status: MatchStatus.NotFound,
      message: 'Alcohol content not found on label',
      expected: `${alcoholContent}%`,
    };
  }

  /**
   * Extract alcohol percentages from text
   * Only extracts numbers that are near alcohol-related keywords (%, ABV, ALC/VOL)
   */
  private extractAlcoholPercentages(text: string): number[] {
    const values: number[] = [];
    const normalized = text.toUpperCase();

    // Pattern 1: Numbers followed by % (e.g., "40%", "40 %")
    const percentPattern = /(\d+(?:\.\d+)?)\s*%/g;
    let match;
    while ((match = percentPattern.exec(normalized)) !== null) {
      const value = parseFloat(match[1]);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        values.push(value);
      }
    }

    // Pattern 2: Numbers near "ABV" or "ALC/VOL" keywords
    const abvPattern = /(\d+(?:\.\d+)?)\s*(?:ABV|ALC\/VOL|ALCOHOL BY VOLUME)/gi;
    while ((match = abvPattern.exec(normalized)) !== null) {
      const value = parseFloat(match[1]);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        values.push(value);
      }
    }

    return values;
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

    // Extract just the government warning portion to compare against (reduces noise)
    const govWarningStart = extractedText.indexOf('GOVERNMENT WARNING');
    const govWarningText = govWarningStart >= 0
      ? extractedText.substring(govWarningStart, Math.min(govWarningStart + 500, extractedText.length))
      : extractedText;

    // Use token_set_ratio which is more forgiving of OCR errors and extra words
    // It checks if the tokens/words from the section are present, ignoring order and extra text
    // Threshold of 65% handles common OCR errors like "OPERATE" → "OPERAS"
    const threshold = 65;
    const sectionMatches = requiredSections.map((section: string) => {
      // token_set_ratio: checks if all words in section are present (best for OCR errors)
      const tokenScore = fuzzball.token_set_ratio(section, govWarningText);

      // partial_ratio: finds best substring match
      const partialScore = fuzzball.partial_ratio(section, govWarningText);

      // Use the better score
      const score = Math.max(tokenScore, partialScore);

      return {
        section,
        score,
        found: score >= threshold
      };
    });

    const foundSections = sectionMatches.filter(m => m.found).map(m => m.section);

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
      const missingSections = sectionMatches.filter(m => !m.found);
      const missingDetails = missingSections.map(m => `"${m.section}" (${m.score}%)`).join('; ');

      return {
        fieldType: FieldType.GovernmentWarning,
        status: MatchStatus.Mismatch,
        message: `Government warning incomplete (found ${foundSections.length}/${requiredSections.length} sections)`,
        expected: config.requiredTexts.governmentWarning,
        found: `Missing sections: ${missingDetails}`,
      };
    }

    // If we found minimal or no sections - show all scores for debugging
    if (extractedText.includes('WARNING')) {
      const allScores = sectionMatches
        .map(m => `"${m.section}": ${m.score}%${m.found ? ' ✓' : ' ✗'}`)
        .join(' | ');

      return {
        fieldType: FieldType.GovernmentWarning,
        status: MatchStatus.Mismatch,
        message: `Warning text found but only ${foundSections.length}/${requiredSections.length} sections matched`,
        expected: config.requiredTexts.governmentWarning,
        found: `Section scores: ${allScores}`,
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