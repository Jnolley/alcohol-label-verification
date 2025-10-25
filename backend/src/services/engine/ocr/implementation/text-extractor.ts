import { createWorker } from 'tesseract.js';
import { ITextExtractor } from '../interface/text-extractor.interface';
import { ExtractedText } from '../contracts/extracted-text';
import { OCRException } from '../../../../common/exceptions';
import config from '../../../../config';

export class TextExtractor implements ITextExtractor {
  async extract(buffer: Buffer): Promise<ExtractedText> {
    const worker = await createWorker(config.ocr.language);

    try {
      const { data } = await worker.recognize(buffer);

      // Check if any text was extracted
      if (!data.text || data.text.trim().length === 0) {
        throw new OCRException(
          'No text could be extracted from the image. ' +
          'Please ensure the image is clear, well-lit, and contains readable text.'
        );
      }

      // Check minimum text length
      if (data.text.trim().length < config.ocr.minTextLength) {
        throw new OCRException(
          `Insufficient text extracted from image (${data.text.trim().length} characters). ` +
          'The image may be too blurry, too small, or poorly lit. ' +
          'Please upload a higher quality image with clearly visible text.'
        );
      }

      // Check OCR confidence
      if (data.confidence < config.ocr.minConfidence) {
        throw new OCRException(
          `Image quality too low for accurate text recognition (confidence: ${data.confidence.toFixed(1)}%). ` +
          'Please upload a clearer, higher resolution image with better lighting and focus. ' +
          'Tips: Ensure the label is well-lit, in focus, and fills most of the frame.'
        );
      }

      const normalized = this.normalizeText(data.text);

      // Additional check: warn if confidence is moderate
      if (data.confidence < config.ocr.warningConfidenceThreshold) {
        console.warn(
          `OCR confidence is moderate (${data.confidence.toFixed(1)}%). ` +
          'Results may not be fully accurate. Consider using a higher quality image.'
        );
      }

      return {
        raw: data.text,
        normalized,
        confidence: data.confidence,
      };
    } catch (error) {
      if (error instanceof OCRException) {
        throw error;
      }
      throw new OCRException(`OCR processing failed: ${(error as Error).message}`);
    } finally {
      await worker.terminate();
    }
  }

  private normalizeText(text: string): string {
    return this.collapseWhitespace(text.toUpperCase().trim());
  }

  private collapseWhitespace(text: string): string {
    let result = '';
    let prevWasSpace = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isSpace = char === ' ' || char === '\t' || char === '\n' || char === '\r';

      if (isSpace) {
        if (!prevWasSpace) {
          result += ' ';
          prevWasSpace = true;
        }
      } else {
        result += char;
        prevWasSpace = false;
      }
    }

    return result.trim();
  }
}