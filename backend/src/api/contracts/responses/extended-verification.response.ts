import { VerificationResult } from '../../../common/contracts/verification-result';
import { ExtractedText } from '../../../services/engine/ocr/contracts/extracted-text';

/**
 * Extended verification response that includes OCR data
 * Used internally to pass OCR information to the controller for admin submissions
 */
export interface ExtendedVerificationResponse {
  result: VerificationResult;
  ocrData: ExtractedText;
}