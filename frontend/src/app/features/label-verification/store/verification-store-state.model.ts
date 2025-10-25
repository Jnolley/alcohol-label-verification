import { LabelFormData } from '../../../shared/models/label-form-data.model';
import { VerificationResult } from '../../../shared/models/verification-result.model';

export type VerificationStoreState = {
  formData: LabelFormData | null;
  imageFile: File | null;

  verifyLabelLoading: boolean;
  verifyLabelError: string | null;
  verificationResult: VerificationResult | null;
};