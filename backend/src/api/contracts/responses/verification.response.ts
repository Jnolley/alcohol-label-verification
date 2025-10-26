import { FieldCheck } from '../../../common/contracts/field-check';

export interface VerificationResponse {
  success: boolean;
  message: string;
  fieldChecks: FieldCheck[];
}