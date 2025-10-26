export interface IImagePreprocessor {
  /**
   * Preprocess an image buffer to optimize it for OCR text extraction
   * @param buffer - The input image buffer
   * @returns Promise<Buffer> - The processed image buffer optimized for OCR
   */
  preprocessForOCR(buffer: Buffer): Promise<Buffer>;
}