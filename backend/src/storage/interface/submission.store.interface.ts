import { Submission } from '../contracts/submission';
import { SubmissionStatus } from '../contracts/submission-status';
import { FormData } from '../../common/contracts/form-data';
import { VerificationResult } from '../../common/contracts/verification-result';
import { ExtractedText } from '../../services/engine/ocr/contracts/extracted-text';

export interface ISubmissionStore {
  add(
    formData: FormData,
    imageBase64: string,
    ocrData: ExtractedText,
    verificationResult: VerificationResult
  ): Submission;

  getAll(status?: SubmissionStatus): Submission[];

  getById(id: string): Submission | undefined;

  updateStatus(
    id: string,
    status: SubmissionStatus,
    adminNotes?: string,
    reviewedBy?: string
  ): Submission | undefined;
}