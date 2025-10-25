import { FieldType } from '../enums/field-type.enum';
import { MatchStatus } from '../enums/match-status.enum';

/**
 * Result of a single field verification check
 */
export interface FieldCheck {
  /** Type of field being checked */
  fieldType: FieldType;

  /** Match status */
  status: MatchStatus;

  /** Expected value from form */
  expected: string;

  /** Actual value found in image (if any) */
  found: string | null;

  /** Human-readable message about the check result */
  message: string;
}