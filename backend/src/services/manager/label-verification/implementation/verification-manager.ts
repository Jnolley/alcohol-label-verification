import { IVerificationManager } from '../interface/verification-manager.interface';
import { FormData, VerificationResult } from '../../../../common';
import { IFieldValidator } from '../../../validation/field-validation';
import { IImageValidator } from '../../../utility/image-processing';
import { ITextExtractor } from '../../../engine/ocr';
import { ILabelVerifier } from '../../../engine/verification';

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
}