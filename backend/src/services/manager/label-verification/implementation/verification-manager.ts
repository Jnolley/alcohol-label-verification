import { IVerificationManager } from '../interface/verification-manager.interface';
import { FormData } from '../../../../common/contracts/form-data';
import { VerificationResult } from '../../../../common/contracts/verification-result';
import { ExtractedText } from '../../../engine/ocr/contracts/extracted-text';
import { IFieldValidator } from '../../../validation/field-validation/interface/field-validator.interface';
import { IImageValidator } from '../../../utility/image-processing/interface/image-validator.interface';
import { ITextExtractor } from '../../../engine/ocr/interface/text-extractor.interface';
import { ILabelVerifier } from '../../../engine/verification/interface/label-verifier.interface';

export interface ExtendedVerificationResult {
  result: VerificationResult;
  ocrData: ExtractedText;
}

export class VerificationManager implements IVerificationManager {
  constructor(
    private readonly fieldValidator: IFieldValidator,
    private readonly imageValidator: IImageValidator,
    private readonly textExtractor: ITextExtractor,
    private readonly labelVerifier: ILabelVerifier
  ) {}

  async processVerification(
    formData: FormData,
    imageBuffer: Buffer,
    filename: string
  ): Promise<VerificationResult> {
    this.fieldValidator.validate(formData);

    await this.imageValidator.validate(imageBuffer, filename);

    const extractedText = await this.textExtractor.extract(imageBuffer);

    const result = this.labelVerifier.verify(formData, extractedText);

    return result;
  }

  /**
   * Extended version that returns OCR data for admin submissions
   */
  async processVerificationExtended(
    formData: FormData,
    imageBuffer: Buffer,
    filename: string
  ): Promise<ExtendedVerificationResult> {
    this.fieldValidator.validate(formData);

    await this.imageValidator.validate(imageBuffer, filename);

    const ocrData = await this.textExtractor.extract(imageBuffer);

    const result = this.labelVerifier.verify(formData, ocrData);

    return {
      result,
      ocrData,
    };
  }
}