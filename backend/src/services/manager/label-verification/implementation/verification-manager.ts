import { IVerificationManager } from '../interface/verification-manager.interface';
import { FormData } from '../../../../common/contracts/form-data';
import { VerificationResult } from '../../../../common/contracts/verification-result';
import { ExtractedText } from '../../../engine/ocr/contracts/extracted-text';
import { IFieldValidator } from '../../../validation/field-validation/interface/field-validator.interface';
import { IImageValidator } from '../../../utility/image-processing/interface/image-validator.interface';
import { ITextExtractor } from '../../../engine/ocr/interface/text-extractor.interface';
import { ILabelVerifier } from '../../../engine/verification/interface/label-verifier.interface';
import { ILogger } from '../../../utility/logging/interface/logger.interface';
import config from '../../../../config';

export interface ExtendedVerificationResult {
  result: VerificationResult;
  ocrData: ExtractedText;
}

export class VerificationManager implements IVerificationManager {
  constructor(
    private readonly fieldValidator: IFieldValidator,
    private readonly imageValidator: IImageValidator,
    private readonly textExtractor: ITextExtractor,
    private readonly labelVerifier: ILabelVerifier,
    private readonly logger: ILogger
  ) {}

  async processVerification(
    formData: FormData,
    imageBuffer: Buffer,
    filename: string
  ): Promise<VerificationResult> {
    // Step 1: Validate form fields
    this.fieldValidator.validate(formData);

    // Step 2: Validate image file
    await this.imageValidator.validate(imageBuffer, filename);

    // Step 3: Extract text from image
    const extractedText = await this.textExtractor.extract(imageBuffer);

    // Step 4: Verify fields against extracted text
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
    // Step 1: Validate form fields
    this.fieldValidator.validate(formData);

    // Step 2: Validate image file
    await this.imageValidator.validate(imageBuffer, filename);

    // Step 3: Extract text from image
    const ocrData = await this.textExtractor.extract(imageBuffer);

    // Step 4: Verify fields against extracted text
    const result = this.labelVerifier.verify(formData, ocrData);

    return {
      result,
      ocrData,
    };
  }
}