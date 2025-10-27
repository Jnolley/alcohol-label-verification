import { FormData } from '../../common/contracts/form-data';
import { VerificationResult } from '../../common/contracts/verification-result';
import { ExtractedText } from '../../services/engine/ocr/contracts/extracted-text';
import { SubmissionStatus } from './submission-status';

export interface Submission {
  id: string;
  formData: FormData;
  imageBase64: string;
  ocrData: ExtractedText;
  verificationResult: VerificationResult;
  status: SubmissionStatus;
  timestamp: Date;
  adminNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}