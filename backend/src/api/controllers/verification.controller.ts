import { Request, Response } from 'express';
import { IVerificationManager } from '../../services/manager/label-verification';
import { RequestMapper } from '../mappers/request.mapper';
import { ResponseMapper } from '../mappers/response.mapper';
import { BaseException } from '../../common';

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

      const requestData = {
        brandName: req.body.brandName,
        productType: req.body.productType,
        alcoholContent: req.body.alcoholContent,
        netContents: req.body.netContents,
        image: req.file,
      };

      const formData = RequestMapper.toFormData(requestData);
      const result = await this.verificationManager.processVerification(
        formData,
        req.file.buffer,
        req.file.originalname
      );

      const response = ResponseMapper.toVerificationResponse(result);
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = ResponseMapper.toErrorResponse(error as Error);

      if (error instanceof BaseException) {
        res.status(error.statusCode).json(errorResponse);
      } else {
        res.status(500).json(errorResponse);
      }
    }
  }
}