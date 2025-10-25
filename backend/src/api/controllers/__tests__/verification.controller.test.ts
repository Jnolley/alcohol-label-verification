import { Request, Response } from 'express';
import { VerificationController } from '../verification.controller';
import { IVerificationManager } from '../../../services/manager/label-verification';
import { VerificationResult, FieldCheck, FieldType, MatchStatus } from '../../../common';
import createError from 'http-errors';

describe('VerificationController', () => {
  let controller: VerificationController;
  let mockVerificationManager: jest.Mocked<IVerificationManager>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockVerificationManager = {
      processVerification: jest.fn(),
    };

    controller = new VerificationController(mockVerificationManager);

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockRequest = {
      body: {},
      file: undefined,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyLabel', () => {
    it('should return 400 when no file is uploaded', async () => {
      mockRequest.file = undefined;

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'MISSING_IMAGE',
          message: 'Image file is required',
        },
      });
      expect(mockVerificationManager.processVerification).not.toHaveBeenCalled();
    });

    it('should successfully verify label with valid data', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: 'Old Tom Distillery',
        productType: 'Bourbon',
        alcoholContent: '45',
        netContentsValue: '750',
        netContentsUnit: 'ml',
      };

      const mockResult: VerificationResult = {
        success: true,
        message: 'Label matches form data',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.Match,
            message: 'Brand name found on label',
            expected: 'Old Tom Distillery',
            found: 'Old Tom Distillery',
          },
        ],
      };

      mockVerificationManager.processVerification.mockResolvedValue(mockResult);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(mockVerificationManager.processVerification).toHaveBeenCalledWith(
        {
          brandName: 'Old Tom Distillery',
          productType: 'Bourbon',
          alcoholContent: 45,
          netContentsValue: 750,
          netContentsUnit: 'ml',
        },
        mockFile.buffer,
        mockFile.originalname
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Label matches form data',
        fieldChecks: mockResult.fieldChecks,
      });
    });

    it('should handle form data without optional net contents', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.jpg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: 'Test Brand',
        productType: 'Vodka',
        alcoholContent: '40',
      };

      const mockResult: VerificationResult = {
        success: true,
        message: 'Label matches form data',
        fieldChecks: [],
      };

      mockVerificationManager.processVerification.mockResolvedValue(mockResult);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(mockVerificationManager.processVerification).toHaveBeenCalledWith(
        {
          brandName: 'Test Brand',
          productType: 'Vodka',
          alcoholContent: 40,
          netContentsValue: undefined,
          netContentsUnit: undefined,
        },
        mockFile.buffer,
        mockFile.originalname
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should handle HTTP errors with correct status code', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.jpg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: '',
        productType: 'Bourbon',
        alcoholContent: '45',
      };

      const error = createError(422, 'Brand name is required');
      mockVerificationManager.processVerification.mockRejectedValue(error);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: error.name,
          message: 'Brand name is required',
        },
      });
    });

    it('should handle field validation errors', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.jpg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: '150', // Invalid
      };

      const error = createError(400, 'Alcohol content cannot exceed 100');
      mockVerificationManager.processVerification.mockRejectedValue(error);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: error.name,
          message: 'Alcohol content cannot exceed 100',
        },
      });
    });

    it('should handle image validation errors', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.txt',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: '45',
      };

      const error = createError(422, 'Invalid image format');
      mockVerificationManager.processVerification.mockRejectedValue(error);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: error.name,
          message: 'Invalid image format',
        },
      });
    });

    it('should handle OCR extraction errors', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.jpg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: '45',
      };

      const error = createError(422, 'No text could be extracted from the image');
      mockVerificationManager.processVerification.mockRejectedValue(error);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: error.name,
          message: 'No text could be extracted from the image',
        },
      });
    });

    it('should handle unexpected non-HTTP errors', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.jpg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: '45',
      };

      const error = new Error('Unexpected error');
      mockVerificationManager.processVerification.mockRejectedValue(error);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });

    it('should parse alcoholContent and netContentsValue as floats', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.jpg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: '45.5',
        netContentsValue: '750.5',
        netContentsUnit: 'ml',
      };

      const mockResult: VerificationResult = {
        success: true,
        message: 'Label matches form data',
        fieldChecks: [],
      };

      mockVerificationManager.processVerification.mockResolvedValue(mockResult);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(mockVerificationManager.processVerification).toHaveBeenCalledWith(
        expect.objectContaining({
          alcoholContent: 45.5,
          netContentsValue: 750.5,
        }),
        expect.any(Buffer),
        expect.any(String)
      );
    });

    it('should handle verification failure (label mismatch)', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'label.jpg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        brandName: 'Wrong Brand',
        productType: 'Bourbon',
        alcoholContent: '45',
      };

      const mockResult: VerificationResult = {
        success: false,
        message: 'Label does not match form data',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.NotFound,
            message: 'Brand name not found on label',
            expected: 'Wrong Brand',
          },
        ],
      };

      mockVerificationManager.processVerification.mockResolvedValue(mockResult);

      await controller.verifyLabel(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Label does not match form data',
        fieldChecks: mockResult.fieldChecks,
      });
    });
  });
});