import { FieldCheck } from './field-check.model';

/**
 * Complete verification result from backend
 */
export interface VerificationResult {
  /** Overall success - true if all fields match */
  success: boolean;

  /** Summary message */
  message: string;

  /** Individual field check results */
  fieldChecks: FieldCheck[];

  /**
   * NEW: Indicates if submission is under admin review
   * Only present when success=false and submission was auto-saved
   */
  underReview?: boolean;
}