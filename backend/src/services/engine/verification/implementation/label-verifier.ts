import { ILabelVerifier } from '../interface/label-verifier.interface';
import { FormData, VerificationResult, FieldCheck, FieldType, MatchStatus } from '../../../../common';
import { ExtractedText } from '../../ocr';
import config from '../../../../config';

export class LabelVerifier implements ILabelVerifier {

  verify(formData: FormData, extractedText: ExtractedText): VerificationResult {
    const fieldChecks: FieldCheck[] = [
      this.verifyBrandName(formData.brandName, extractedText.normalized),
      this.verifyProductType(formData.productType, extractedText.normalized),
      this.verifyAlcoholContent(formData.alcoholContent, extractedText.normalized),
    ];

    if (formData.netContents) {
      fieldChecks.push(this.verifyNetContents(formData.netContents, extractedText.normalized));
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
      return {
        fieldType: FieldType.BrandName,
        status: MatchStatus.Match,
        message: 'Brand name found on label',
        expected: brandName,
        found: brandName,
      };
    }

    const brandWords = this.splitByWhitespace(normalizedBrand);
    const foundWords = brandWords.filter(word =>
      word.length > 2 && normalizedExtracted.includes(word)
    );

    if (foundWords.length >= brandWords.length * config.verification.brandNameMinWordMatch) {
      return {
        fieldType: FieldType.BrandName,
        status: MatchStatus.Match,
        message: 'Brand name found on label',
        expected: brandName,
        found: foundWords.join(' '),
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
    const normalizedType = productType.toUpperCase().trim();
    const keywords = this.splitByWhitespace(normalizedType);

    // Check if any significant keywords are present
    const foundKeywords = keywords.filter(keyword =>
      keyword.length > 2 && extractedText.includes(keyword)
    );

    if (foundKeywords.length >= config.verification.productTypeMinKeywordMatch) {
      return {
        fieldType: FieldType.ProductType,
        status: MatchStatus.Match,
        message: 'Product type found on label',
        expected: productType,
        found: foundKeywords.join(' '),
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

  private verifyNetContents(netContents: string, extractedText: string): FieldCheck {
    const normalizedExpected = this.removeWhitespace(netContents.toUpperCase());
    const normalizedText = this.removeWhitespace(extractedText);

    if (normalizedText.includes(normalizedExpected)) {
      return {
        fieldType: FieldType.NetContents,
        status: MatchStatus.Match,
        message: 'Net contents matches',
        expected: netContents,
        found: netContents,
      };
    }

    // Extract numbers from expected value
    const expectedNumbers = this.extractNumbers(netContents);

    // Look for any of these numbers in the text
    for (const num of expectedNumbers) {
      if (extractedText.includes(num)) {
        return {
          fieldType: FieldType.NetContents,
          status: MatchStatus.Match,
          message: 'Net contents found on label',
          expected: netContents,
          found: num,
        };
      }
    }

    return {
      fieldType: FieldType.NetContents,
      status: MatchStatus.NotFound,
      message: 'Net contents not found on label',
      expected: netContents,
    };
  }

  private extractNumbers(text: string): string[] {
    const numbers: string[] = [];
    let currentNumber = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (this.isDigit(char) || char === '.') {
        currentNumber += char;
      } else if (currentNumber) {
        numbers.push(currentNumber);
        currentNumber = '';
      }
    }

    if (currentNumber) {
      numbers.push(currentNumber);
    }

    return numbers;
  }

  private splitByWhitespace(text: string): string[] {
    return text.split(' ').filter(word => word.length > 0);
  }

  private removeWhitespace(text: string): string {
    return text.split(' ').join('');
  }

  private removePunctuation(text: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if ((char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char === ' ') {
        result += char;
      }
    }
    return result;
  }

  private verifyGovernmentWarning(extractedText: string): FieldCheck {
    const requiredSections = config.requiredTexts.governmentWarningSections;

    const foundSections = requiredSections.filter(section =>
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