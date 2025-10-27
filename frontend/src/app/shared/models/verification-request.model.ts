import { LabelFormData } from './label-form-data.model';

/**
 * Request payload for verification API
 */
export interface VerificationRequest {
  /** Form data */
  formData: LabelFormData;

  /** Primary image file to verify */
  primaryImage: File | null;

  /** Optional secondary image file */
  secondaryImage?: File | null;
}