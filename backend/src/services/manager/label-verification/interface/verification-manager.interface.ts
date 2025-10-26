import { FormData } from '../../../../common/contracts/form-data';
import { VerificationResult } from '../../../../common/contracts/verification-result';

export interface IVerificationManager {
  processVerification(formData: FormData, imageBuffer: Buffer, filename: string): Promise<VerificationResult>;
}