import { FormData } from '../../../../common/contracts/form-data';
import { VerificationResult } from '../../../../common/contracts/verification-result';
import { ExtractedText } from '../../ocr/contracts/extracted-text';

export interface ILabelVerifier {
  verify(formData: FormData, extractedText: ExtractedText): VerificationResult;
}