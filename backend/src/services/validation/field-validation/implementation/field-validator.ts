import { IFieldValidator } from '../interface/field-validator.interface';
import { FormData } from '../../../../common';
import createError from 'http-errors';
import { formDataSchema } from '../../schemas/form-data.schema';

export class FieldValidator implements IFieldValidator {
  validate(formData: FormData): void {
    const result = formDataSchema.safeParse(formData);

    if (!result.success) {
      const firstError = result.error.issues[0];
      throw createError(400, firstError.message);
    }
  }
}
