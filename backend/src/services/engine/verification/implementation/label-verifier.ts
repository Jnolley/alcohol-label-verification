import { ILabelVerifier } from '../interface/label-verifier.interface';
import { FormData, VerificationResult, FieldCheck, FieldType, MatchStatus } from '../../../../common';
import { ExtractedText } from '../../ocr';

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

    const allMatch = fieldChecks.every(check => check.status === MatchStatus.Match);

    return {
      success: allMatch,
      message: allMatch ? 'Label matches form data' : 'Label does not match form data',
      fieldChecks,
    };
  }

  private verifyBrandName(brandName: string, extractedText: string): FieldCheck {
    const normalizedBrand = brandName.toUpperCase().trim();

    if (extractedText.includes(normalizedBrand)) {
      return {
        fieldType: FieldType.BrandName,
        status: MatchStatus.Match,
        message: 'Brand name found on label',
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
    const normalizedType = productType.toUpperCase().trim();
    const keywords = normalizedType.split(/\s+/);

    // Check if any significant keywords are present
    const foundKeywords = keywords.filter(keyword =>
      keyword.length > 2 && extractedText.includes(keyword)
    );

    if (foundKeywords.length > 0) {
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
    // Look for percentage patterns in text
    const percentPattern = /(\d+\.?\d*)\s*%/g;
    const matches = extractedText.matchAll(percentPattern);

    const tolerance = 0.5;

    for (const match of matches) {
      const foundValue = parseFloat(match[1]);
      const difference = Math.abs(foundValue - alcoholContent);

      if (difference <= tolerance) {
        return {
          fieldType: FieldType.AlcoholContent,
          status: MatchStatus.Match,
          message: 'Alcohol content matches',
          expected: `${alcoholContent}%`,
          found: `${foundValue}%`,
        };
      }
    }

    // Try to find the number without % sign
    const numberPattern = new RegExp(`\\b${alcoholContent}(\\.0)?\\b`);
    if (numberPattern.test(extractedText)) {
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

  private verifyNetContents(netContents: string, extractedText: string): FieldCheck {
    // Normalize both by removing spaces
    const normalizedExpected = netContents.toUpperCase().replace(/\s+/g, '');
    const normalizedText = extractedText.replace(/\s+/g, '');

    if (normalizedText.includes(normalizedExpected)) {
      return {
        fieldType: FieldType.NetContents,
        status: MatchStatus.Match,
        message: 'Net contents matches',
        expected: netContents,
        found: netContents,
      };
    }

    return {
      fieldType: FieldType.NetContents,
      status: MatchStatus.NotFound,
      message: 'Net contents not found on label',
      expected: netContents,
    };
  }
}