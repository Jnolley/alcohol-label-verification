import { Submission, SubmissionStatus } from '../contracts/submission';
import { FormData } from '../../common/contracts/form-data';
import { VerificationResult } from '../../common/contracts/verification-result';
import { ExtractedText } from '../../services/engine/ocr/contracts/extracted-text';

/**
 * In-memory storage for label verification submissions
 * No database required - simple MVP implementation
 */
export class SubmissionStore {
  private submissions: Submission[] = [];
  private idCounter: number = 1;

  /**
   * Add a new submission for admin review
   */
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
      // Set status based on verification result
      status: verificationResult.success ? SubmissionStatus.AUTO_APPROVED : SubmissionStatus.PENDING,
      timestamp: new Date(),
    };

    this.submissions.push(submission);
    return submission;
  }

  /**
   * Get all submissions, optionally filtered by status
   */
  getAll(status?: SubmissionStatus): Submission[] {
    if (status) {
      return this.submissions.filter((s) => s.status === status);
    }
    return [...this.submissions];
  }

  /**
   * Get a specific submission by ID
   */
  getById(id: string): Submission | undefined {
    return this.submissions.find((s) => s.id === id);
  }

  /**
   * Update submission status and add admin notes
   */
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

  /**
   * Get count of submissions by status
   */
  getCount(status?: SubmissionStatus): number {
    if (status) {
      return this.submissions.filter((s) => s.status === status).length;
    }
    return this.submissions.length;
  }
}