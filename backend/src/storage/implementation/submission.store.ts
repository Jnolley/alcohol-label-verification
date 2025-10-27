import { Submission } from '../contracts/submission';
import { SubmissionStatus } from '../contracts/submission-status';
import { FormData } from '../../common/contracts/form-data';
import { VerificationResult } from '../../common/contracts/verification-result';
import { ExtractedText } from '../../services/engine/ocr/contracts/extracted-text';
import { ISubmissionStore } from '../interface/submission.store.interface';

// In-memory storage for label verification submissions
export class SubmissionStore implements ISubmissionStore {
  private submissions: Submission[] = [];
  private idCounter: number = 1;

  add(
    formData: FormData,
    imageBase64: string,
    ocrData: ExtractedText,
    verificationResult: VerificationResult
  ): Submission {
    const submission: Submission = {
      id: `SUB-${this.idCounter++}`,
      formData,
      imageBase64,
      ocrData,
      verificationResult,
      status: verificationResult.success ? SubmissionStatus.AUTO_APPROVED : SubmissionStatus.PENDING,
      timestamp: new Date(),
    };

    this.submissions.push(submission);
    return submission;
  }

  getAll(status?: SubmissionStatus): Submission[] {
    if (status) {
      return this.submissions.filter((s) => s.status === status);
    }
    return [...this.submissions];
  }

  getById(id: string): Submission | undefined {
    return this.submissions.find((s) => s.id === id);
  }

  updateStatus(
    id: string,
    status: SubmissionStatus,
    adminNotes?: string,
    reviewedBy?: string
  ): Submission | undefined {
    const submission = this.submissions.find((s) => s.id === id);
    if (!submission) {
      return undefined;
    }

    submission.status = status;
    submission.reviewedAt = new Date();
    if (adminNotes) {
      submission.adminNotes = adminNotes;
    }
    if (reviewedBy) {
      submission.reviewedBy = reviewedBy;
    }

    return submission;
  }
}