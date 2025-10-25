import { Request, Response } from 'express';
import { IVerificationManager } from '../../services/manager/label-verification';
import createError from 'http-errors';

export class VerificationController {
  constructor(private readonly verificationManager: IVerificationManager) {}

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
    } catch (error) {
      const errorResponse = createError.isHttpError(error)
        ? { error: { code: error.name, message: error.message } }
        : { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } };

      const statusCode = createError.isHttpError(error) ? error.statusCode : 500;
      res.status(statusCode).json(errorResponse);
    }
  }
}