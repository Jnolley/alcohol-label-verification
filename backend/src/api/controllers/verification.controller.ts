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
      const { formData, imageBuffers, filenames, uploadedImages } = this.extractRequestData(req);

      if (this.submissionStore) {
        await this.verifyWithStorage(formData, imageBuffers, filenames, uploadedImages, res);
      } else {
        await this.verifyWithoutStorage(formData, imageBuffers, filenames, res);
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private extractRequestData(req: Request) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const primaryImage = files?.primaryImage?.[0];
    const secondaryImage = files?.secondaryImage?.[0];

    if (!primaryImage && !secondaryImage) {
      throw createError(400, 'At least one image file is required');
    }

    const formData = {
      brandName: req.body.brandName,
      productType: req.body.productType,
      alcoholContent: parseFloat(req.body.alcoholContent),
      netContentsValue: req.body.netContentsValue ? parseFloat(req.body.netContentsValue) : undefined,
      netContentsUnit: req.body.netContentsUnit,
    };

    const uploadedImages = [primaryImage, secondaryImage].filter(Boolean) as Express.Multer.File[];
    const imageBuffers = uploadedImages.map(img => img.buffer);
    const filenames = uploadedImages.map(img => img.originalname);

    return { formData, imageBuffers, filenames, uploadedImages };
  }

  private async verifyWithStorage(
    formData: any,
    imageBuffers: Buffer[],
    filenames: string[],
    uploadedImages: Express.Multer.File[],
    res: Response
  ): Promise<void> {
    const { result, ocrData } = await this.verificationManager.processVerificationExtended(
      formData,
      imageBuffers,
      filenames
    );

    const imageBase64s = uploadedImages.map((img, i) => {
      const buffer = ocrData.processedImageBuffers?.[i] || img.buffer;
      return buffer.toString('base64');
    });

    this.submissionStore!.add(formData, imageBase64s, ocrData, result);

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
  }

  private async verifyWithoutStorage(
    formData: any,
    imageBuffers: Buffer[],
    filenames: string[],
    res: Response
  ): Promise<void> {
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

  private handleError(error: unknown, res: Response): void {
    const errorResponse = createError.isHttpError(error)
      ? { error: { code: error.name, message: error.message } }
      : { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } };

    const statusCode = createError.isHttpError(error) ? error.statusCode : 500;
    res.status(statusCode).json(errorResponse);
  }
}