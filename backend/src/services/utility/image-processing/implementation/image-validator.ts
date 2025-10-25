import { IImageValidator } from '../interface/image-validator.interface';
import { ImageValidationException } from '../../../../common/exceptions';
import config from '../../../../config';

export class ImageValidator implements IImageValidator {
  async validate(buffer: Buffer, filename: string): Promise<void> {
    const maxFileSizeBytes = config.image.maxFileSizeMB * 1024 * 1024;

    // Check file size
    if (buffer.length > maxFileSizeBytes) {
      throw new ImageValidationException(
        `File size exceeds maximum allowed size of ${config.image.maxFileSizeMB}MB`
      );
    }

    // Check if buffer is empty
    if (buffer.length === 0) {
      throw new ImageValidationException('Image file is empty');
    }

    // Basic magic byte validation for common image formats
    const magicBytes = buffer.slice(0, 4).toString('hex');

    // JPEG: FF D8 FF
    const isJPEG = magicBytes.startsWith('ffd8ff');

    // PNG: 89 50 4E 47
    const isPNG = magicBytes.startsWith('89504e47');

    // WebP: RIFF....WEBP
    const isWebP = buffer.slice(0, 12).toString('hex').includes('57454250');

    if (!isJPEG && !isPNG && !isWebP) {
      throw new ImageValidationException(
        'Invalid image format. Only JPEG, PNG, and WebP are allowed'
      );
    }
  }
}