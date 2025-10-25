import { IImageValidator } from '../interface/image-validator.interface';
import createError from 'http-errors';
import config from '../../../../config';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';

export class ImageValidator implements IImageValidator {
  async validate(buffer: Buffer, filename: string): Promise<void> {
    const maxFileSizeBytes = config.image.maxFileSizeMB * 1024 * 1024;

    // Check file size
    if (buffer.length > maxFileSizeBytes) {
      throw createError(422, `File size exceeds maximum allowed size of ${config.image.maxFileSizeMB}MB`);
    }

    // Check if buffer is empty
    if (buffer.length === 0) {
      throw createError(422, 'Image file is empty');
    }

    // Use file-type package for robust file type detection
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      throw createError(422, 'Unable to determine file type. Please upload a valid image file');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType.mime)) {
      throw createError(422, `Invalid image format: ${fileType.mime}. Only JPEG, PNG, and WebP are allowed`);
    }
  }
}