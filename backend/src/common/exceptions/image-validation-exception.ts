import { BaseException } from './base-exception';

export class ImageValidationException extends BaseException {
  constructor(message: string) {
    super(message, 'INVALID_IMAGE', 422);
  }
}