import sharp from 'sharp';
import { IImagePreprocessor } from '../interface/image-preprocessor.interface';

export class ImagePreprocessor implements IImagePreprocessor {
  async preprocessForOCR(buffer: Buffer): Promise<Buffer> {
    try {
      // Get image metadata to understand dimensions
      const metadata = await sharp(buffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      // Calculate if we need to resize (ensure minimum resolution for OCR)
      const minDimension = 1000;
      let resizeWidth: number | undefined;
      let resizeHeight: number | undefined;

      if (width < minDimension && height < minDimension) {
        // Scale up smaller dimension to minDimension while maintaining aspect ratio
        const scale = minDimension / Math.min(width, height);
        resizeWidth = Math.round(width * scale);
        resizeHeight = Math.round(height * scale);
      }

      // Process the image for optimal OCR
      let pipeline = sharp(buffer);

      // Resize if needed
      if (resizeWidth && resizeHeight) {
        pipeline = pipeline.resize(resizeWidth, resizeHeight, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill',
        });
      }

      // Apply adaptive thresholding pipeline for better OCR
      // This approach handles shadows better than contrast/sharpening
      const processed = await pipeline
        .greyscale() // Convert to grayscale
        .normalise() // Normalize to spread histogram (auto-adjusts for local contrast)
        .threshold(128, { greyscale: false }) // Binary threshold - converts to pure B&W
        .toBuffer();

      return processed;
    } catch (error) {
      throw new Error(`Image preprocessing failed: ${(error as Error).message}`);
    }
  }
}