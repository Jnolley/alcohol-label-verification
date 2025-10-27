import { ITextExtractor } from '../interface/text-extractor.interface';
import { ExtractedText } from '../contracts/extracted-text';
import { DetectedWord } from '../contracts/detected-word';
import createError from 'http-errors';
import config from '../../../../config';
import { ImagePreprocessor } from '../../../utility/image-processing/implementation/image-preprocessor';
import { IImagePreprocessor } from '../../../utility/image-processing/interface/image-preprocessor.interface';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export class TextExtractor implements ITextExtractor {
  private preprocessor: IImagePreprocessor;
  private visionClient: ImageAnnotatorClient;

  constructor(preprocessor?: IImagePreprocessor) {
    this.preprocessor = preprocessor || new ImagePreprocessor();

    // Support both local (GOOGLE_APPLICATION_CREDENTIALS) and Vercel (JSON in env var)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      // Vercel: Parse JSON from environment variable
      // Fix escaped newlines in private_key field (Vercel often escapes \n as \\n)
      let credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

      try {
        const credentials = JSON.parse(credentialsJson);

        // Replace literal \n strings with actual newlines in private_key
        if (credentials.private_key && typeof credentials.private_key === 'string') {
          credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }

        this.visionClient = new ImageAnnotatorClient({ credentials });
      } catch (error) {
        throw new Error(
          `Failed to parse Google Cloud credentials JSON: ${(error as Error).message}\n` +
          'Make sure GOOGLE_APPLICATION_CREDENTIALS_JSON contains valid JSON'
        );
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      this.visionClient = new ImageAnnotatorClient();
    } else {
      throw new Error(
        'Missing Google Cloud credentials. Set either:\n' +
        '  - GOOGLE_APPLICATION_CREDENTIALS (path to JSON key file) for local dev\n' +
        '  - GOOGLE_APPLICATION_CREDENTIALS_JSON (JSON string) for Vercel'
      );
    }
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

    try {
      // Use Google Cloud Vision API with official client library
      const [result] = await this.visionClient.documentTextDetection({
        image: { content: processedBuffer },
      });

      if (!result.fullTextAnnotation) {
        throw createError(422, 'No text could be extracted from the image. Please ensure the image is clear, well-lit, and contains readable text.');
      }

      const fullText = result.fullTextAnnotation;
      const extractedText = fullText.text || '';

      if (!extractedText || extractedText.trim().length === 0) {
        throw createError(422, 'No text could be extracted from the image. Please ensure the image is clear, well-lit, and contains readable text.');
      }

      if (extractedText.trim().length < config.ocr.minTextLength) {
        throw createError(422, `Insufficient text extracted from image (${extractedText.trim().length} characters). The image may be too blurry, too small, or poorly lit. Please upload a higher quality image with clearly visible text.`);
      }

      // Extract word-level data with confidence and bounding boxes
      const words: DetectedWord[] = [];
      let totalConfidence = 0;
      let wordCount = 0;

      if (fullText.pages && fullText.pages.length > 0) {
        for (const page of fullText.pages) {
          for (const block of page.blocks || []) {
            for (const paragraph of block.paragraphs || []) {
              for (const word of paragraph.words || []) {
                const wordText = word.symbols
                  ?.map((symbol) => symbol.text)
                  .join('') || '';

                const vertices = word.boundingBox?.vertices || [];
                if (vertices.length === 4 && wordText) {
                  const x = Math.min(...vertices.map((v) => v.x || 0));
                  const y = Math.min(...vertices.map((v) => v.y || 0));
                  const maxX = Math.max(...vertices.map((v) => v.x || 0));
                  const maxY = Math.max(...vertices.map((v) => v.y || 0));

                  const wordConfidence = word.confidence || 0;
                  totalConfidence += wordConfidence;
                  wordCount++;

                  words.push({
                    text: wordText,
                    bbox: {
                      x,
                      y,
                      width: maxX - x,
                      height: maxY - y,
                    },
                    confidence: Math.round(wordConfidence * 100), // Convert to percentage
                  });
                }
              }
            }
          }
        }
      }

      // Calculate average confidence (Google returns 0-1, convert to percentage)
      const avgConfidence = wordCount > 0
        ? Math.round((totalConfidence / wordCount) * 100)
        : 85;

      if (avgConfidence < config.ocr.minConfidence) {
        throw createError(422, `Image quality too low for accurate text recognition (confidence: ${avgConfidence}%). Please upload a clearer, higher resolution image with better lighting and focus.`);
      }

      const normalizedText = this.normalizeText(extractedText);

      return {
        raw: extractedText,
        normalized: normalizedText,
        confidence: avgConfidence,
        words,
        imageDimensions: {
          original: { width: originalWidth, height: originalHeight },
          processed: { width: processedWidth, height: processedHeight },
        },
        processedImageBuffer: processedBuffer,
      };
    } catch (error) {
      if (createError.isHttpError(error)) {
        throw error;
      }
      throw createError(422, `OCR processing failed: ${(error as Error).message}`);
    }
  }

  async extractFromMultiple(buffers: Buffer[]): Promise<ExtractedText> {
    if (buffers.length === 0) {
      throw createError(400, 'At least one image buffer is required');
    }

    if (buffers.length === 1) {
      const result = await this.extract(buffers[0]);
      // Set imageIndex to 0 for single image
      result.words = result.words.map(word => ({ ...word, imageIndex: 0 }));
      return result;
    }

    // Extract text from each image
    const results: ExtractedText[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const result = await this.extract(buffers[i]);
      // Tag each word with its image index
      result.words = result.words.map(word => ({ ...word, imageIndex: i }));
      results.push(result);
    }

    // Combine results
    const combinedRaw = results.map((r, i) =>
      i === 0 ? r.raw : `\n\n--- SECONDARY LABEL ---\n\n${r.raw}`
    ).join('');

    // Combine normalized text (join with space for matching, but include separator in raw)
    const combinedNormalized = results.map(r => r.normalized).join(' ');

    // Average confidence
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = Math.round(totalConfidence / results.length);

    // Merge words arrays (now with imageIndex set for each word)
    const combinedWords = results.flatMap(r => r.words);

    // Use first image's dimensions
    const imageDimensions = results[0].imageDimensions;

    // Collect all processed image buffers
    const processedImageBuffers = results
      .map(r => r.processedImageBuffer)
      .filter((buf): buf is Buffer => buf !== undefined);

    return {
      raw: combinedRaw,
      normalized: combinedNormalized,
      confidence: avgConfidence,
      words: combinedWords,
      imageDimensions,
      processedImageBuffers: processedImageBuffers.length > 0 ? processedImageBuffers : undefined,
    };
  }

  private normalizeText(text: string): string {
    return this.collapseWhitespace(text.toUpperCase().trim());
  }

  private collapseWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}