import { LabelFormData } from '../../../shared/models/label-form-data.model';
import { VerificationResult } from '../../../shared/models/verification-result.model';

export type VerificationStoreState = {
  formData: LabelFormData | null;
  primaryImage: File | null;
  secondaryImage: File | null;
  isSubmitting: boolean;
  verificationResult: VerificationResult | null;
  error: string | null;
};