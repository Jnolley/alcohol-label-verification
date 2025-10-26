import { FieldCheck } from './field-check.model';
import { VerificationResult } from './verification-result.model';
import { LabelFormData } from './label-form-data.model';

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AUTO_APPROVED = 'auto_approved',
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedWord {
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface ExtractedText {
  raw: string;
  normalized: string;
  confidence: number;
  words: DetectedWord[];
  imageDimensions?: {
    original: { width: number; height: number };
    processed: { width: number; height: number };
  };
}

export interface Submission {
  id: string;
  formData: LabelFormData;
  imageBase64: string;
  ocrData: ExtractedText;
  verificationResult: VerificationResult;
  status: SubmissionStatus;
  timestamp: string;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface SubmissionsResponse {
  success: boolean;
  count: number;
  submissions: Submission[];
}

export interface SubmissionResponse {
  success: boolean;
  submission: Submission;
}