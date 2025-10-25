import { FieldType } from '../enums/field-type';
import { MatchStatus } from '../enums/match-status';

export interface FieldCheck {
  fieldType: FieldType;
  status: MatchStatus;
  message: string;
  expected?: string;
  found?: string;
}