import { FieldCheck } from './field-check';

export interface VerificationResult {
  success: boolean;
  message: string;
  fieldChecks: FieldCheck[];
}