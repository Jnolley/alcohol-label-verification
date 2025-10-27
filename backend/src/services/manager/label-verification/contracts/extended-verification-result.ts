import { VerificationResult } from '../../../../common/contracts/verification-result';
import { ExtractedText } from '../../../engine/ocr/contracts/extracted-text';

export interface ExtendedVerificationResult {
  result: VerificationResult;
  ocrData: ExtractedText;
}