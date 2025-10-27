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
  imageIndex?: number; // Which image this word came from (0 = primary, 1 = secondary, etc.)
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
  images: string[]; // Array of base64 encoded images
  imageBase64?: string; // Deprecated: for backward compatibility with old submissions
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