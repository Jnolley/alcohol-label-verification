import { TextExtractor } from '../implementation/text-extractor';
import { createWorker, PSM } from 'tesseract.js';
import createError from 'http-errors';
import config from '../../../../config';

// Mock tesseract.js
jest.mock('tesseract.js');

describe('TextExtractor', () => {
  let extractor: TextExtractor;
  let mockWorker: any;

  beforeEach(() => {
    mockWorker = {
      setParameters: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn(),
      terminate: jest.fn().mockResolvedValue(undefined),
    };

    (createWorker as jest.Mock).mockResolvedValue(mockWorker);

    extractor = new TextExtractor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extract', () => {
    it('should successfully extract text from valid image', async () => {
      const buffer = Buffer.from('fake-image-data');
      const mockOCRData = {
        text: 'OLD TOM DISTILLERY KENTUCKY BOURBON 45% 750ML',
        confidence: 95,
      };

      mockWorker.recognize.mockResolvedValue({ data: mockOCRData });

      const result = await extractor.extract(buffer);

      expect(createWorker).toHaveBeenCalledWith(config.ocr.language);
      expect(mockWorker.setParameters).toHaveBeenCalledWith({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
      });
      expect(mockWorker.recognize).toHaveBeenCalledWith(buffer);
      expect(mockWorker.terminate).toHaveBeenCalled();

      expect(result).toEqual({
        raw: mockOCRData.text,
        normalized: 'OLD TOM DISTILLERY KENTUCKY BOURBON 45% 750ML',
        confidence: 95,
      });
    });

    it('should normalize text by converting to uppercase and collapsing whitespace', async () => {
      const buffer = Buffer.from('fake-image-data');
      const mockOCRData = {
        text: '  old   tom    distillery   bourbon  ',
        confidence: 92,
      };

      mockWorker.recognize.mockResolvedValue({ data: mockOCRData });

      const result = await extractor.extract(buffer);

      expect(result.normalized).toBe('OLD TOM DISTILLERY BOURBON');
      expect(result.raw).toBe(mockOCRData.text);
    });

    it('should throw error when no text is extracted', async () => {
      const buffer = Buffer.from('fake-image-data');
      mockWorker.recognize.mockResolvedValue({ data: { text: '', confidence: 90 } });

      await expect(extractor.extract(buffer)).rejects.toThrow(
        'No text could be extracted from the image'
      );

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should throw error when extracted text is only whitespace', async () => {
      const buffer = Buffer.from('fake-image-data');
      mockWorker.recognize.mockResolvedValue({ data: { text: '   ', confidence: 90 } });

      await expect(extractor.extract(buffer)).rejects.toThrow(
        'No text could be extracted from the image'
      );

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should throw error when text length is below minimum', async () => {
      const buffer = Buffer.from('fake-image-data');
      const shortText = 'AB'; // Less than minTextLength
      mockWorker.recognize.mockResolvedValue({ data: { text: shortText, confidence: 90 } });

      await expect(extractor.extract(buffer)).rejects.toThrow('Insufficient text extracted');

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should throw error when confidence is below minimum threshold', async () => {
      const buffer = Buffer.from('fake-image-data');
      const lowConfidence = config.ocr.minConfidence - 10;
      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Some text here that is long enough', confidence: lowConfidence },
      });

      await expect(extractor.extract(buffer)).rejects.toThrow('Image quality too low');

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should warn when confidence is moderate but above minimum', async () => {
      const buffer = Buffer.from('fake-image-data');
      const moderateConfidence = config.ocr.warningConfidenceThreshold - 5;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Some text here that is long enough', confidence: moderateConfidence },
      });

      await extractor.extract(buffer);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('OCR confidence is moderate')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should not warn when confidence is high', async () => {
      const buffer = Buffer.from('fake-image-data');
      const highConfidence = config.ocr.warningConfidenceThreshold + 10;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Some text here that is long enough', confidence: highConfidence },
      });

      await extractor.extract(buffer);

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle OCR processing errors gracefully', async () => {
      const buffer = Buffer.from('fake-image-data');
      mockWorker.recognize.mockRejectedValue(new Error('Tesseract processing failed'));

      await expect(extractor.extract(buffer)).rejects.toThrow('OCR processing failed');

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should re-throw HTTP errors without wrapping them', async () => {
      const buffer = Buffer.from('fake-image-data');
      const httpError = createError(422, 'Custom HTTP error');
      mockWorker.recognize.mockRejectedValue(httpError);

      await expect(extractor.extract(buffer)).rejects.toThrow('Custom HTTP error');

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should terminate worker even when extraction succeeds', async () => {
      const buffer = Buffer.from('fake-image-data');
      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Valid text content here', confidence: 95 },
      });

      await extractor.extract(buffer);

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should terminate worker even when extraction fails', async () => {
      const buffer = Buffer.from('fake-image-data');
      mockWorker.recognize.mockRejectedValue(new Error('Some error'));

      await expect(extractor.extract(buffer)).rejects.toThrow();

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should handle text with mixed case and extra whitespace', async () => {
      const buffer = Buffer.from('fake-image-data');
      const messyText = '  Old   TOM  \n  DISTILLERY  \t  Bourbon  \n  ';
      mockWorker.recognize.mockResolvedValue({
        data: { text: messyText, confidence: 92 },
      });

      const result = await extractor.extract(buffer);

      expect(result.normalized).toBe('OLD TOM DISTILLERY BOURBON');
      expect(result.normalized).not.toContain('\n');
      expect(result.normalized).not.toContain('\t');
      expect(result.normalized).not.toMatch(/\s{2,}/); // No double spaces
    });

    it('should handle text exactly at minimum length threshold', async () => {
      const buffer = Buffer.from('fake-image-data');
      const minText = 'A'.repeat(config.ocr.minTextLength);
      mockWorker.recognize.mockResolvedValue({
        data: { text: minText, confidence: 95 },
      });

      const result = await extractor.extract(buffer);

      expect(result.raw).toBe(minText);
      expect(result.confidence).toBe(95);
    });

    it('should handle confidence exactly at minimum threshold', async () => {
      const buffer = Buffer.from('fake-image-data');
      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Valid text content here', confidence: config.ocr.minConfidence },
      });

      const result = await extractor.extract(buffer);

      expect(result.confidence).toBe(config.ocr.minConfidence);
    });
  });
});