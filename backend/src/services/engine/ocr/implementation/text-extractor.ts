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
    const sharp = (await import('sharp')).default;
    const originalMetadata = await sharp(buffer).metadata();
    const originalWidth = originalMetadata.width || 0;
    const originalHeight = originalMetadata.height || 0;

    const processedBuffer = await this.preprocessor.preprocessForOCR(buffer);

    const processedMetadata = await sharp(processedBuffer).metadata();
    const processedWidth = processedMetadata.width || 0;
    const processedHeight = processedMetadata.height || 0;

    const worker = await createWorker(config.ocr.language, 1, {
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5',
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    });

    try {
      // Set Tesseract parameters optimized for bottle labels
      // PSM 11: Sparse text - finds scattered text without assuming order (best for product labels)
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1',
      });

      // Enable blocks output to get word-level bounding boxes (required in v6+)
      const { data } = await worker.recognize(processedBuffer, {}, { blocks: true });

      if (!data.text || data.text.trim().length === 0) {
        throw createError(422, 'No text could be extracted from the image. Please ensure the image is clear, well-lit, and contains readable text.');
      }

      if (data.text.trim().length < config.ocr.minTextLength) {
        throw createError(422, `Insufficient text extracted from image (${data.text.trim().length} characters). The image may be too blurry, too small, or poorly lit. Please upload a higher quality image with clearly visible text.`);
      }

      if (data.confidence < config.ocr.minConfidence) {
        throw createError(422, `Image quality too low for accurate text recognition (confidence: ${data.confidence.toFixed(1)}%). Please upload a clearer, higher resolution image with better lighting and focus. Tips: Ensure the label is well-lit, in focus, and fills most of the frame.`);
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

      // Reconstruct text from blocks structure, preserving line breaks and filtering junk
      let reconstructedText = '';
      if (data.blocks) {
        for (const block of data.blocks) {
          for (const paragraph of block.paragraphs || []) {
            for (const line of paragraph.lines || []) {
              const lineWords = (line.words || [])
                .filter((word: any) => {
                  // Filter out very low confidence words and single characters (likely OCR noise)
                  if (word.confidence < 30) return false;
                  if (word.text.length === 1 && word.confidence < 70) return false;
                  return true;
                })
                .map((word: any) => word.text);

              if (lineWords.length > 0) {
                reconstructedText += lineWords.join(' ') + '\n';
              }
            }
            reconstructedText += '\n'; // Extra line break between paragraphs
          }
        }
      }

      // Use Tesseract's original text as base, supplement with reconstructed if longer/better
      const finalText = reconstructedText.trim().length > data.text.trim().length
        ? reconstructedText.trim()
        : data.text;
      const normalizedFinal = this.normalizeText(finalText);

      return {
        raw: finalText,
        normalized: normalizedFinal,
        confidence: data.confidence,
        words,
        imageDimensions: {
          original: { width: originalWidth, height: originalHeight },
          processed: { width: processedWidth, height: processedHeight },
        },
        processedImageBuffer: processedBuffer, // Return preprocessed image for admin display
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