import { BaseException } from './base-exception';

export class FieldValidationException extends BaseException {
  constructor(message: string, public readonly field?: string) {
    super(message, 'FIELD_VALIDATION_FAILED', 400);
  }
}