import { createWorker, PSM } from 'tesseract.js';
import { ITextExtractor } from '../interface/text-extractor.interface';
import { ExtractedText } from '../contracts/extracted-text';
import createError from 'http-errors';
import config from '../../../../config';
import { ImagePreprocessor } from '../../../utility/image-processing/implementation/image-preprocessor';
import { IImagePreprocessor } from '../../../utility/image-processing/interface/image-preprocessor.interface';

export class TextExtractor implements ITextExtractor {
  private preprocessor: IImagePreprocessor;

  constructor(preprocessor?: IImagePreprocessor) {
    this.preprocessor = preprocessor || new ImagePreprocessor();
  }

  async extract(buffer: Buffer): Promise<ExtractedText> {
    // Preprocess the image for better OCR results
    const processedBuffer = await this.preprocessor.preprocessForOCR(buffer);
    const worker = await createWorker(config.ocr.language);

    try {
      // Set Tesseract parameters optimized for bottle labels
      // PSM 11: Sparse text - finds scattered text without assuming order (best for product labels)
      // OEM 1: LSTM Neural Net mode (most accurate for modern use)
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        tessedit_ocr_engine_mode: '1', // LSTM only
        preserve_interword_spaces: '1',
      });

      // Enable blocks output to get word-level bounding boxes (required in v6+)
      const { data } = await worker.recognize(processedBuffer, {}, { blocks: true });

      // Check if any text was extracted
      if (!data.text || data.text.trim().length === 0) {
        throw createError(422, 'No text could be extracted from the image. Please ensure the image is clear, well-lit, and contains readable text.');
      }

      // Check minimum text length
      if (data.text.trim().length < config.ocr.minTextLength) {
        throw createError(422, `Insufficient text extracted from image (${data.text.trim().length} characters). The image may be too blurry, too small, or poorly lit. Please upload a higher quality image with clearly visible text.`);
      }

      // Check OCR confidence
      if (data.confidence < config.ocr.minConfidence) {
        throw createError(422, `Image quality too low for accurate text recognition (confidence: ${data.confidence.toFixed(1)}%). Please upload a clearer, higher resolution image with better lighting and focus. Tips: Ensure the label is well-lit, in focus, and fills most of the frame.`);
      }

      const normalized = this.normalizeText(data.text);

      // Additional check: warn if confidence is moderate
      if (data.confidence < config.ocr.warningConfidenceThreshold) {
        console.warn(
          `OCR confidence is moderate (${data.confidence.toFixed(1)}%). ` +
          'Results may not be fully accurate. Consider using a higher quality image.'
        );
      }

      // Extract word-level bounding boxes from blocks structure (Tesseract v6+)
      const words = (data as any).blocks
        ?.flatMap((block: any) => block.paragraphs || [])
        .flatMap((paragraph: any) => paragraph.lines || [])
        .flatMap((line: any) => line.words || [])
        .map((word: any) => ({
          text: word.text,
          bbox: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0,
          },
          confidence: word.confidence,
        })) || [];

      return {
        raw: data.text,
        normalized,
        confidence: data.confidence,
        words,
      };
    } catch (error) {
      if (createError.isHttpError(error)) {
        throw error;
      }
      throw createError(422, `OCR processing failed: ${(error as Error).message}`);
    } finally {
      await worker.terminate();
    }
  }

  private normalizeText(text: string): string {
    return this.collapseWhitespace(text.toUpperCase().trim());
  }

  private collapseWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}