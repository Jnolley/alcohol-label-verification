import { eventGroup } from '@ngrx/signals/events';
import { type } from '@ngrx/signals';
import { VerificationResult } from '../../../shared/models/verification-result.model';
import { HttpErrorResponse } from '@angular/common/http';

export const verificationEvents = eventGroup({
  source: 'Verification',
  events: {
    verifyLabelOnLoading: type<void>(),
    verifyLabelOnSuccess: type<VerificationResult>(),
    verifyLabelOnFailure: type<HttpErrorResponse>(),

    resetVerification: type<void>(),
    clearResults: type<void>(),
  }
});
