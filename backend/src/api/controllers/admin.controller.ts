import { Request, Response } from 'express';
import createError from 'http-errors';
import { ISubmissionStore } from '../../storage/interface/submission.store.interface';
import { SubmissionStatus } from '../../storage/contracts/submission-status';

export class AdminController {
  constructor(private submissionStore: ISubmissionStore) {}

  login = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'Login successful' });
  };

  getSubmissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.query;

      const submissions = status && Object.values(SubmissionStatus).includes(status as SubmissionStatus)
        ? this.submissionStore.getAll(status as SubmissionStatus)
        : this.submissionStore.getAll();

      submissions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      res.json({ success: true, count: submissions.length, submissions });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getSubmissionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const submission = this.submissionStore.getById(req.params.id);

      if (!submission) {
        throw createError(404, `Submission ${req.params.id} not found`);
      }

      res.json({ success: true, submission });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateSubmissionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, adminNotes, reviewedBy } = req.body;

      if (!status || !Object.values(SubmissionStatus).includes(status)) {
        throw createError(400, 'Invalid status. Must be: pending, approved, or rejected');
      }

      const updatedSubmission = this.submissionStore.updateStatus(
        id,
        status as SubmissionStatus,
        adminNotes,
        reviewedBy
      );

      if (!updatedSubmission) {
        throw createError(404, `Submission ${id} not found`);
      }

      res.json({ success: true, message: `Submission ${status}`, submission: updatedSubmission });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    if (createError.isHttpError(error)) {
      res.status(error.statusCode).json({
        error: {
          code: error.name,
          message: error.message,
        },
      });
    } else {
      console.error('Unexpected error in AdminController:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
}