import { ImageValidator } from '../implementation/image-validator';
import { ImageValidationException } from '../../../../common/exceptions';

describe('ImageValidator', () => {
  let validator: ImageValidator;

  beforeEach(() => {
    validator = new ImageValidator();
  });

  describe('validate', () => {
    it('should pass validation for valid JPEG image', async () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

      await expect(validator.validate(jpegBuffer, 'test.jpg')).resolves.not.toThrow();
    });

    it('should pass validation for valid PNG image', async () => {
      // PNG magic bytes: 89 50 4E 47
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

      await expect(validator.validate(pngBuffer, 'test.png')).resolves.not.toThrow();
    });

    it('should pass validation for valid WebP image', async () => {
      // WebP magic bytes: RIFF....WEBP
      const webpBuffer = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'binary');

      await expect(validator.validate(webpBuffer, 'test.webp')).resolves.not.toThrow();
    });

    it('should throw error for empty buffer', async () => {
      const emptyBuffer = Buffer.from([]);

      await expect(validator.validate(emptyBuffer, 'test.jpg')).rejects.toThrow(ImageValidationException);
      await expect(validator.validate(emptyBuffer, 'test.jpg')).rejects.toThrow('Image file is empty');
    });

    it('should throw error for file exceeding max size', async () => {
      // Create a buffer larger than 10MB (default max size)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      // Add JPEG magic bytes
      largeBuffer[0] = 0xff;
      largeBuffer[1] = 0xd8;
      largeBuffer[2] = 0xff;

      await expect(validator.validate(largeBuffer, 'large.jpg')).rejects.toThrow(ImageValidationException);
      await expect(validator.validate(largeBuffer, 'large.jpg')).rejects.toThrow('File size exceeds maximum allowed size');
    });

    it('should pass validation for file at exactly max size', async () => {
      // Create a buffer exactly 10MB
      const maxBuffer = Buffer.alloc(10 * 1024 * 1024);
      // Add JPEG magic bytes
      maxBuffer[0] = 0xff;
      maxBuffer[1] = 0xd8;
      maxBuffer[2] = 0xff;

      await expect(validator.validate(maxBuffer, 'max.jpg')).resolves.not.toThrow();
    });

    it('should throw error for invalid image format (text file)', async () => {
      const textBuffer = Buffer.from('This is a text file, not an image');

      await expect(validator.validate(textBuffer, 'test.txt')).rejects.toThrow(ImageValidationException);
      await expect(validator.validate(textBuffer, 'test.txt')).rejects.toThrow('Invalid image format');
    });

    it('should throw error for invalid image format (PDF)', async () => {
      // PDF magic bytes: %PDF
      const pdfBuffer = Buffer.from('%PDF-1.4\n');

      await expect(validator.validate(pdfBuffer, 'test.pdf')).rejects.toThrow(ImageValidationException);
      await expect(validator.validate(pdfBuffer, 'test.pdf')).rejects.toThrow('Invalid image format');
    });

    it('should throw error for corrupted JPEG (incomplete magic bytes)', async () => {
      const corruptedBuffer = Buffer.from([0xff, 0xd8]); // Incomplete JPEG magic bytes

      await expect(validator.validate(corruptedBuffer, 'corrupted.jpg')).rejects.toThrow(ImageValidationException);
    });

    it('should handle various JPEG variants', async () => {
      // JPEG with JFIF marker
      const jfifBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      await expect(validator.validate(jfifBuffer, 'jfif.jpg')).resolves.not.toThrow();

      // JPEG with EXIF marker
      const exifBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe1]);
      await expect(validator.validate(exifBuffer, 'exif.jpg')).resolves.not.toThrow();
    });

    it('should validate file regardless of filename extension', async () => {
      // Valid JPEG with wrong extension
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      await expect(validator.validate(jpegBuffer, 'test.png')).resolves.not.toThrow();

      // Valid PNG with wrong extension
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      await expect(validator.validate(pngBuffer, 'test.jpg')).resolves.not.toThrow();
    });

    it('should throw error for very small invalid buffer', async () => {
      const tinyBuffer = Buffer.from([0x01]);

      await expect(validator.validate(tinyBuffer, 'tiny.jpg')).rejects.toThrow(ImageValidationException);
      await expect(validator.validate(tinyBuffer, 'tiny.jpg')).rejects.toThrow('Invalid image format');
    });

    it('should handle minimum valid buffer sizes', async () => {
      // Minimum JPEG
      const minJpeg = Buffer.from([0xff, 0xd8, 0xff]);
      await expect(validator.validate(minJpeg, 'min.jpg')).resolves.not.toThrow();

      // Minimum PNG
      const minPng = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      await expect(validator.validate(minPng, 'min.png')).resolves.not.toThrow();
    });

    it('should handle buffers with valid magic bytes followed by arbitrary data', async () => {
      const jpegWithData = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.from('arbitrary data'.repeat(100)),
      ]);

      await expect(validator.validate(jpegWithData, 'data.jpg')).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should throw error for buffer with null bytes', async () => {
      const nullBuffer = Buffer.alloc(100); // All zeros

      await expect(validator.validate(nullBuffer, 'null.jpg')).rejects.toThrow(ImageValidationException);
    });

    it('should validate multiple images in sequence', async () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const webpBuffer = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'binary');

      await expect(validator.validate(jpegBuffer, 'test1.jpg')).resolves.not.toThrow();
      await expect(validator.validate(pngBuffer, 'test2.png')).resolves.not.toThrow();
      await expect(validator.validate(webpBuffer, 'test3.webp')).resolves.not.toThrow();
    });

    it('should reject images that look like other formats', async () => {
      // GIF magic bytes (not supported)
      const gifBuffer = Buffer.from('GIF89a');
      await expect(validator.validate(gifBuffer, 'test.gif')).rejects.toThrow(ImageValidationException);

      // BMP magic bytes (not supported)
      const bmpBuffer = Buffer.from('BM');
      await expect(validator.validate(bmpBuffer, 'test.bmp')).rejects.toThrow(ImageValidationException);
    });
  });
});