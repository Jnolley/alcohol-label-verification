import { VerificationResult, BaseException } from '../../common';
import { VerificationResponse } from '../contracts/responses/verification.response';
import { ErrorResponse } from '../contracts/responses/error.response';
import { FieldValidationException } from '../../common';

export class ResponseMapper {
  static toVerificationResponse(result: VerificationResult): VerificationResponse {
    return {
      success: result.success,
      message: result.message,
      fieldChecks: result.fieldChecks,
    };
  }

  static toErrorResponse(error: Error): ErrorResponse {
    if (error instanceof BaseException) {
      return {
        error: {
          code: error.code,
          message: error.message,
          field: error instanceof FieldValidationException ? error.field : undefined,
        },
      };
    }

    return {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}