import { Request, Response } from 'express';
import createError from 'http-errors';
import { SubmissionStore } from '../../storage/implementation/submission.store';
import { SubmissionStatus } from '../../storage/contracts/submission';

export class AdminController {
  constructor(private submissionStore: SubmissionStore) {}

  /**
   * POST /api/admin/login
   * Validate admin credentials (middleware already checked, just return success)
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // If we reached here, auth middleware already validated credentials
      res.json({
        success: true,
        message: 'Login successful',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * GET /api/admin/submissions
   * Get all submissions, optionally filtered by status
   */
  getSubmissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.query;

      let submissions;
      if (status && Object.values(SubmissionStatus).includes(status as SubmissionStatus)) {
        submissions = this.submissionStore.getAll(status as SubmissionStatus);
      } else {
        submissions = this.submissionStore.getAll();
      }

      // Sort by timestamp, newest first
      submissions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      res.json({
        success: true,
        count: submissions.length,
        submissions,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * GET /api/admin/submissions/:id
   * Get a specific submission by ID
   */
  getSubmissionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const submission = this.submissionStore.getById(id);

      if (!submission) {
        throw createError(404, `Submission ${id} not found`);
      }

      res.json({
        success: true,
        submission,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * PATCH /api/admin/submissions/:id
   * Update submission status (approve/reject)
   */
  updateSubmissionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, adminNotes, reviewedBy } = req.body;

      // Validate status
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

      res.json({
        success: true,
        message: `Submission ${status}`,
        submission: updatedSubmission,
      });
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