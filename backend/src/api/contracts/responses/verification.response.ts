import { FieldCheck } from '../../../common';

export interface VerificationResponse {
  success: boolean;
  message: string;
  fieldChecks: FieldCheck[];
}