import { createWorker } from 'tesseract.js';
import { ITextExtractor } from '../interface/text-extractor.interface';
import { ExtractedText } from '../contracts/extracted-text';
import { OCRException } from '../../../../common/exceptions';

export class TextExtractor implements ITextExtractor {
  async extract(buffer: Buffer): Promise<ExtractedText> {
    const worker = await createWorker('eng');

    try {
      const { data } = await worker.recognize(buffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new OCRException('No text could be extracted from the image');
      }

      if (data.confidence < 30) {
        throw new OCRException(
          `OCR confidence too low (${data.confidence.toFixed(1)}%). Please upload a clearer image`
        );
      }

      const normalized = this.normalizeText(data.text);

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
    return text
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
}