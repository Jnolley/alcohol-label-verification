import { IVerificationManager } from '../interface/verification-manager.interface';
import { FormData } from '../../../../common/contracts/form-data';
import { VerificationResult } from '../../../../common/contracts/verification-result';
import { IFieldValidator } from '../../../validation/field-validation/interface/field-validator.interface';
import { IImageValidator } from '../../../utility/image-processing/interface/image-validator.interface';
import { ITextExtractor } from '../../../engine/ocr/interface/text-extractor.interface';
import { ILabelVerifier } from '../../../engine/verification/interface/label-verifier.interface';
import { ExtendedVerificationResult } from '../contracts/extended-verification-result';

export class VerificationManager implements IVerificationManager {
  constructor(
    private readonly fieldValidator: IFieldValidator,
    private readonly imageValidator: IImageValidator,
    private readonly textExtractor: ITextExtractor,
    private readonly labelVerifier: ILabelVerifier
  ) {}

  async processVerification(
    formData: FormData,
    imageBuffer: Buffer | Buffer[],
    filename: string | string[]
  ): Promise<VerificationResult> {
    this.fieldValidator.validate(formData);

    const buffers = Array.isArray(imageBuffer) ? imageBuffer : [imageBuffer];
    const filenames = Array.isArray(filename) ? filename : [filename];

    // Validate all images
    for (let i = 0; i < buffers.length; i++) {
      await this.imageValidator.validate(buffers[i], filenames[i] || `image-${i}`);
    }

    // Extract text (uses combined extraction for multiple images)
    const extractedText = buffers.length > 1
      ? await this.textExtractor.extractFromMultiple(buffers)
      : await this.textExtractor.extract(buffers[0]);

    const result = this.labelVerifier.verify(formData, extractedText);

    return result;
  }

  /**
   * Extended version that returns OCR data for admin submissions
   */
  async processVerificationExtended(
    formData: FormData,
    imageBuffer: Buffer | Buffer[],
    filename: string | string[]
  ): Promise<ExtendedVerificationResult> {
    this.fieldValidator.validate(formData);

    const buffers = Array.isArray(imageBuffer) ? imageBuffer : [imageBuffer];
    const filenames = Array.isArray(filename) ? filename : [filename];

    // Validate all images
    for (let i = 0; i < buffers.length; i++) {
      await this.imageValidator.validate(buffers[i], filenames[i] || `image-${i}`);
    }

    // Extract text (uses combined extraction for multiple images)
    const ocrData = buffers.length > 1
      ? await this.textExtractor.extractFromMultiple(buffers)
      : await this.textExtractor.extract(buffers[0]);

    const result = this.labelVerifier.verify(formData, ocrData);

    return {
      result,
      ocrData,
    };
  }
}