import { FormData, VerificationResult } from '../../../../common';
import { ExtractedText } from '../../ocr';

export interface ILabelVerifier {
  verify(formData: FormData, extractedText: ExtractedText): VerificationResult;
}