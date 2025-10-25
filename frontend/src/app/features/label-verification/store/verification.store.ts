import { signalStore, withState, patchState, withMethods } from '@ngrx/signals';
import { VerificationStoreState } from './verification-store-state.model';
import { VerificationResult } from '../../../shared/models/verification-result.model';

const initialState: VerificationStoreState = {
  formData: null,
  imageFile: null,

  verifyLabelLoading: false,
  verifyLabelError: null,
  verificationResult: null,
};

export const VerificationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setLoading() {
      patchState(store, {
        verifyLabelLoading: true,
        verifyLabelError: null,
        verificationResult: null,
      });
    },
    setSuccess(result: VerificationResult) {
      patchState(store, {
        verificationResult: result,
        verifyLabelLoading: false,
        verifyLabelError: null,
      });
    },
    setError(error: string) {
      patchState(store, {
        verifyLabelLoading: false,
        verifyLabelError: error,
        verificationResult: null,
      });
    },
    reset() {
      patchState(store, initialState);
    },
  }))
);