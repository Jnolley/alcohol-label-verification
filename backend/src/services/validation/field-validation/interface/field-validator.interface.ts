import { FormData } from '../../../../common';

export interface IFieldValidator {
  validate(formData: FormData): void;
}