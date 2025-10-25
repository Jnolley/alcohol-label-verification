import { FormData, VerificationResult } from '../../../../common';

export interface IVerificationManager {
  processVerification(formData: FormData, imageBuffer: Buffer, filename: string): Promise<VerificationResult>;
}