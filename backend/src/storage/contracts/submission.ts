import { FormData } from '../../common/contracts/form-data';
import { VerificationResult } from '../../common/contracts/verification-result';
import { ExtractedText } from '../../services/engine/ocr/contracts/extracted-text';

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AUTO_APPROVED = 'auto_approved', // Approved by OCR system without admin review
}

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