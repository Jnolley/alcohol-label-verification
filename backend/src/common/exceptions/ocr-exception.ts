import { BaseException } from './base-exception';

export class OCRException extends BaseException {
  constructor(message: string) {
    super(message, 'OCR_FAILED', 422);
  }
}