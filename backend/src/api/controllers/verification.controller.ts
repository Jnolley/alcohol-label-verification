import { Request, Response } from 'express';
import { IVerificationManager } from '../../services/manager/label-verification/interface/verification-manager.interface';
import { VerificationManager } from '../../services/manager/label-verification/implementation/verification-manager';
import { SubmissionStore } from '../../storage/implementation/submission.store';
import createError from 'http-errors';

export class VerificationController {
  constructor(
    private readonly verificationManager: IVerificationManager,
    private readonly submissionStore?: SubmissionStore
  ) {}

  async verifyLabel(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'MISSING_IMAGE',
            message: 'Image file is required',
          },
        });
        return;
      }

      const formData = {
        brandName: req.body.brandName,
        productType: req.body.productType,
        alcoholContent: parseFloat(req.body.alcoholContent),
        netContentsValue: req.body.netContentsValue ? parseFloat(req.body.netContentsValue) : undefined,
        netContentsUnit: req.body.netContentsUnit,
      };

      // Use extended verification if submission store is available
      if (this.submissionStore && this.verificationManager instanceof VerificationManager) {
        const { result, ocrData } = await this.verificationManager.processVerificationExtended(
          formData,
          req.file.buffer,
          req.file.originalname
        );

        // Save all submissions to admin panel
        const imageBase64 = req.file.buffer.toString('base64');
        this.submissionStore.add(formData, imageBase64, ocrData, result);

        // If verification failed, notify user it's under review
        if (!result.success) {
          res.status(200).json({
            success: false,
            underReview: true,
            message: 'Your submission is under review by an administrator. We will verify the label manually and contact you with the results.',
            fieldChecks: result.fieldChecks,
          });
          return;
        }

        // Verification passed
        res.status(200).json({
          success: result.success,
          underReview: false,
          message: result.message,
          fieldChecks: result.fieldChecks,
        });
      } else {
        // Fallback to regular verification (no admin review)
        const result = await this.verificationManager.processVerification(
          formData,
          req.file.buffer,
          req.file.originalname
        );

        res.status(200).json({
          success: result.success,
          message: result.message,
          fieldChecks: result.fieldChecks,
        });
      }
    } catch (error) {
      const errorResponse = createError.isHttpError(error)
        ? { error: { code: error.name, message: error.message } }
        : { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } };

      const statusCode = createError.isHttpError(error) ? error.statusCode : 500;
      res.status(statusCode).json(errorResponse);
    }
  }
}