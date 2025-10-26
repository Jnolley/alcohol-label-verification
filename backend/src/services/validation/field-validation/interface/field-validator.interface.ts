import { FormData } from '../../../../common/contracts/form-data';

export interface IFieldValidator {
  validate(formData: FormData): void;
}