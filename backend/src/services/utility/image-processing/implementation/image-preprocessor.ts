import sharp from 'sharp';
import { IImagePreprocessor } from '../interface/image-preprocessor.interface';

export class ImagePreprocessor implements IImagePreprocessor {
  async preprocessForOCR(buffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(buffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const hasAlpha = metadata.channels === 4;

      const minDimension = 1000;
      let resizeWidth: number | undefined;
      let resizeHeight: number | undefined;

      if (width < minDimension && height < minDimension) {
        // Scale up smaller dimension to minDimension while maintaining aspect ratio
        const scale = minDimension / Math.min(width, height);
        resizeWidth = Math.round(width * scale);
        resizeHeight = Math.round(height * scale);
      }

      let pipeline = sharp(buffer);

      // Handle transparent backgrounds - flatten to white
      if (hasAlpha) {
        pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
      }

      if (resizeWidth && resizeHeight) {
        pipeline = pipeline.resize(resizeWidth, resizeHeight, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill',
        });
      }

      // Apply minimal preprocessing to preserve quality
      // Only normalize contrast - let Tesseract handle the rest
      let finalPipeline = pipeline.normalise(); // Normalize to spread histogram (auto-adjusts for local contrast)

      // Output as high-quality PNG to preserve quality for OCR
      // Always use PNG regardless of input format to avoid lossy compression
      const processed = await finalPipeline
        .png({
          compressionLevel: 0, // No compression
          quality: 100,
        })
        .toBuffer();

      return processed;
    } catch (error) {
      throw new Error(`Image preprocessing failed: ${(error as Error).message}`);
    }
  }
}