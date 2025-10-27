import { Request, Response } from 'express';
import { IVerificationManager } from '../../services/manager/label-verification/interface/verification-manager.interface';
import { ISubmissionStore } from '../../storage/interface/submission.store.interface';
import createError from 'http-errors';

export class VerificationController {
  constructor(
    private readonly verificationManager: IVerificationManager,
    private readonly submissionStore?: ISubmissionStore
  ) {}

  async verifyLabel(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const primaryImage = files?.primaryImage?.[0];
      const secondaryImage = files?.secondaryImage?.[0];

      if (!primaryImage && !secondaryImage) {
        res.status(400).json({
          error: {
            code: 'MISSING_IMAGE',
            message: 'At least one image file is required',
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

      const imageBuffers: Buffer[] = [];
      const filenames: string[] = [];
      if (primaryImage) {
        imageBuffers.push(primaryImage.buffer);
        filenames.push(primaryImage.originalname);
      }
      if (secondaryImage) {
        imageBuffers.push(secondaryImage.buffer);
        filenames.push(secondaryImage.originalname);
      }

      if (this.submissionStore) {
        const { result, ocrData } = await this.verificationManager.processVerificationExtended(
          formData,
          imageBuffers,
          filenames
        );

        // Convert images to base64 for storage
        const imageBase64s: string[] = [];
        if (primaryImage) {
          const buffer = ocrData.processedImageBuffers?.[0] || primaryImage.buffer;
          imageBase64s.push(buffer.toString('base64'));
        }
        if (secondaryImage) {
          const buffer = ocrData.processedImageBuffers?.[1] || ocrData.processedImageBuffers?.[0] || secondaryImage.buffer;
          imageBase64s.push(buffer.toString('base64'));
        }

        this.submissionStore.add(formData, imageBase64s, ocrData, result);

        if (!result.success) {
          res.status(200).json({
            success: false,
            underReview: true,
            message: 'Your submission is under review by an administrator. We will verify the label manually and contact you with the results.',
            fieldChecks: result.fieldChecks,
          });
          return;
        }

        res.status(200).json({
          success: result.success,
          underReview: false,
          message: result.message,
          fieldChecks: result.fieldChecks,
        });
      } else {
        const result = await this.verificationManager.processVerification(
          formData,
          imageBuffers,
          filenames
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