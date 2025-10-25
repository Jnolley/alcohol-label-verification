import { LabelFormData } from './label-form-data.model';

/**
 * Request payload for verification API
 */
export interface VerificationRequest {
  /** Form data */
  formData: LabelFormData;

  /** Image file to verify */
  imageFile: File;
}