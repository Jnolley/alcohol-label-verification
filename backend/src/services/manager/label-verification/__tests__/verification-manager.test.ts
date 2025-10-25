import { VerificationManager } from '../implementation/verification-manager';
import { IFieldValidator } from '../../../validation/field-validation';
import { IImageValidator } from '../../../utility/image-processing';
import { ITextExtractor } from '../../../engine/ocr';
import { ILabelVerifier } from '../../../engine/verification';
import {
  FormData,
  VerificationResult,
  FieldCheck,
  FieldType,
  MatchStatus,
} from '../../../../common';
import { ExtractedText } from '../../../engine/ocr';
import createError from 'http-errors';

describe('VerificationManager', () => {
  let manager: VerificationManager;
  let mockFieldValidator: jest.Mocked<IFieldValidator>;
  let mockImageValidator: jest.Mocked<IImageValidator>;
  let mockTextExtractor: jest.Mocked<ITextExtractor>;
  let mockLabelVerifier: jest.Mocked<ILabelVerifier>;

  beforeEach(() => {
    mockFieldValidator = {
      validate: jest.fn(),
    };

    mockImageValidator = {
      validate: jest.fn(),
    };

    mockTextExtractor = {
      extract: jest.fn(),
    };

    mockLabelVerifier = {
      verify: jest.fn(),
    };

    manager = new VerificationManager(
      mockFieldValidator,
      mockImageValidator,
      mockTextExtractor,
      mockLabelVerifier
    );
  });

  const createFormData = (): FormData => ({
    brandName: 'Old Tom Distillery',
    productType: 'Kentucky Straight Bourbon Whiskey',
    alcoholContent: 45,
    netContentsValue: 750,
    netContentsUnit: 'mL',
  });

  const createExtractedText = (): ExtractedText => ({
    raw: 'Old Tom Distillery Kentucky Straight Bourbon Whiskey 45% 750mL',
    normalized: 'OLD TOM DISTILLERY KENTUCKY STRAIGHT BOURBON WHISKEY 45% 750ML',
    confidence: 90,
  });

  const createSuccessResult = (): VerificationResult => ({
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
  });

  describe('processVerification', () => {
    it('should successfully process verification with valid data', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const extractedText = createExtractedText();
      const expectedResult = createSuccessResult();

      mockFieldValidator.validate.mockReturnValue(undefined);
      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(expectedResult);

      const result = await manager.processVerification(formData, imageBuffer, filename);

      expect(result).toEqual(expectedResult);
      expect(mockFieldValidator.validate).toHaveBeenCalledWith(formData);
      expect(mockImageValidator.validate).toHaveBeenCalledWith(imageBuffer, filename);
      expect(mockTextExtractor.extract).toHaveBeenCalledWith(imageBuffer);
      expect(mockLabelVerifier.verify).toHaveBeenCalledWith(formData, extractedText);
    });

    it('should call services in correct order', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const extractedText = createExtractedText();
      const result = createSuccessResult();

      const callOrder: string[] = [];

      mockFieldValidator.validate.mockImplementation(() => {
        callOrder.push('fieldValidator');
      });

      mockImageValidator.validate.mockImplementation(async () => {
        callOrder.push('imageValidator');
      });

      mockTextExtractor.extract.mockImplementation(async () => {
        callOrder.push('textExtractor');
        return extractedText;
      });

      mockLabelVerifier.verify.mockImplementation(() => {
        callOrder.push('labelVerifier');
        return result;
      });

      await manager.processVerification(formData, imageBuffer, filename);

      expect(callOrder).toEqual([
        'fieldValidator',
        'imageValidator',
        'textExtractor',
        'labelVerifier',
      ]);
    });

    it('should pass image buffer to both image validator and text extractor', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const extractedText = createExtractedText();

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      await manager.processVerification(formData, imageBuffer, filename);

      expect(mockImageValidator.validate).toHaveBeenCalledWith(imageBuffer, filename);
      expect(mockTextExtractor.extract).toHaveBeenCalledWith(imageBuffer);
    });

    it('should pass form data and extracted text to label verifier', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const extractedText = createExtractedText();

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      await manager.processVerification(formData, imageBuffer, filename);

      expect(mockLabelVerifier.verify).toHaveBeenCalledWith(formData, extractedText);
    });
  });

  describe('error handling', () => {
    it('should throw error when field validation fails', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const error = createError(400, 'Brand name is required');

      mockFieldValidator.validate.mockImplementation(() => {
        throw error;
      });

      await expect(manager.processVerification(formData, imageBuffer, filename)).rejects.toThrow(
        'Brand name is required'
      );

      // Should not call subsequent services
      expect(mockImageValidator.validate).not.toHaveBeenCalled();
      expect(mockTextExtractor.extract).not.toHaveBeenCalled();
      expect(mockLabelVerifier.verify).not.toHaveBeenCalled();
    });

    it('should throw error when image validation fails', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const error = createError(422, 'Invalid image format');

      mockFieldValidator.validate.mockReturnValue(undefined);
      mockImageValidator.validate.mockRejectedValue(error);

      await expect(manager.processVerification(formData, imageBuffer, filename)).rejects.toThrow(
        'Invalid image format'
      );

      // Field validator should be called
      expect(mockFieldValidator.validate).toHaveBeenCalled();

      // Should not call subsequent services
      expect(mockTextExtractor.extract).not.toHaveBeenCalled();
      expect(mockLabelVerifier.verify).not.toHaveBeenCalled();
    });

    it('should throw error when text extraction fails', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const error = createError(422, 'No text could be extracted');

      mockFieldValidator.validate.mockReturnValue(undefined);
      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockRejectedValue(error);

      await expect(manager.processVerification(formData, imageBuffer, filename)).rejects.toThrow(
        'No text could be extracted'
      );

      // Previous services should be called
      expect(mockFieldValidator.validate).toHaveBeenCalled();
      expect(mockImageValidator.validate).toHaveBeenCalled();

      // Should not call label verifier
      expect(mockLabelVerifier.verify).not.toHaveBeenCalled();
    });

    it('should propagate unexpected errors', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const error = new Error('Unexpected error');

      mockFieldValidator.validate.mockReturnValue(undefined);
      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockRejectedValue(error);

      await expect(manager.processVerification(formData, imageBuffer, filename)).rejects.toThrow(
        'Unexpected error'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle verification failure (mismatch)', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const extractedText = createExtractedText();

      const failureResult: VerificationResult = {
        success: false,
        message: 'Label does not match form data',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.NotFound,
            message: 'Brand name not found on label',
            expected: 'Different Brand',
          },
        ],
      };

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(failureResult);

      const result = await manager.processVerification(formData, imageBuffer, filename);

      expect(result.success).toBe(false);
      expect(result.fieldChecks.some((check) => check.status === MatchStatus.NotFound)).toBe(true);
    });

    it('should handle low confidence OCR', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';

      const lowConfidenceText: ExtractedText = {
        raw: 'Some barely readable text',
        normalized: 'SOME BARELY READABLE TEXT',
        confidence: 45,
      };

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(lowConfidenceText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      const result = await manager.processVerification(formData, imageBuffer, filename);

      expect(mockTextExtractor.extract).toHaveBeenCalled();
      expect(mockLabelVerifier.verify).toHaveBeenCalledWith(formData, lowConfidenceText);
      expect(result).toBeDefined();
    });

    it('should handle minimal extracted text', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';

      const minimalText: ExtractedText = {
        raw: 'BOURBON',
        normalized: 'BOURBON',
        confidence: 80,
      };

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(minimalText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      await manager.processVerification(formData, imageBuffer, filename);

      expect(mockLabelVerifier.verify).toHaveBeenCalledWith(formData, minimalText);
    });

    it('should handle form data without optional net contents', async () => {
      const formData: FormData = {
        brandName: 'Test',
        productType: 'Bourbon',
        alcoholContent: 45,
      };

      const imageBuffer = Buffer.from('fake image data');
      const filename = 'test.jpg';
      const extractedText = createExtractedText();

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      await manager.processVerification(formData, imageBuffer, filename);

      expect(mockFieldValidator.validate).toHaveBeenCalledWith(formData);
      expect(mockLabelVerifier.verify).toHaveBeenCalledWith(formData, extractedText);
    });

    it('should handle large image buffers', async () => {
      const formData = createFormData();
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const filename = 'large.jpg';
      const extractedText = createExtractedText();

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      await manager.processVerification(formData, largeBuffer, filename);

      expect(mockImageValidator.validate).toHaveBeenCalledWith(largeBuffer, filename);
      expect(mockTextExtractor.extract).toHaveBeenCalledWith(largeBuffer);
    });

    it('should handle different image formats', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const extractedText = createExtractedText();

      const formats = ['test.jpg', 'test.png', 'test.webp'];

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      for (const filename of formats) {
        await manager.processVerification(formData, imageBuffer, filename);
        expect(mockImageValidator.validate).toHaveBeenCalledWith(imageBuffer, filename);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty image buffer', async () => {
      const formData = createFormData();
      const emptyBuffer = Buffer.from([]);
      const filename = 'empty.jpg';

      mockFieldValidator.validate.mockReturnValue(undefined);
      mockImageValidator.validate.mockRejectedValue(
        createError(422, 'Image file is empty')
      );

      await expect(manager.processVerification(formData, emptyBuffer, filename)).rejects.toThrow(
        'Image file is empty'
      );
    });

    it('should handle very short filenames', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'a.jpg';
      const extractedText = createExtractedText();

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      await manager.processVerification(formData, imageBuffer, filename);

      expect(mockImageValidator.validate).toHaveBeenCalledWith(imageBuffer, filename);
    });

    it('should handle filename without extension', async () => {
      const formData = createFormData();
      const imageBuffer = Buffer.from('fake image data');
      const filename = 'testimage';
      const extractedText = createExtractedText();

      mockImageValidator.validate.mockResolvedValue(undefined);
      mockTextExtractor.extract.mockResolvedValue(extractedText);
      mockLabelVerifier.verify.mockReturnValue(createSuccessResult());

      await manager.processVerification(formData, imageBuffer, filename);

      expect(mockImageValidator.validate).toHaveBeenCalledWith(imageBuffer, filename);
    });
  });
});
