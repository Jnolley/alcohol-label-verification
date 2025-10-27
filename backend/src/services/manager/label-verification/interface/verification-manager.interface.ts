import { FormData } from '../../../../common/contracts/form-data';
import { VerificationResult } from '../../../../common/contracts/verification-result';
import { ExtendedVerificationResult } from '../contracts/extended-verification-result';

export interface IVerificationManager {
  processVerification(formData: FormData, imageBuffer: Buffer, filename: string): Promise<VerificationResult>;
  processVerificationExtended(formData: FormData, imageBuffer: Buffer, filename: string): Promise<ExtendedVerificationResult>;
}