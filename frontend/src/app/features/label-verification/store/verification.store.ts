import { signalStore, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { produce } from 'immer';
import { verificationEvents } from './verification.events';
import { VerificationStoreState } from './verification-store-state.model';

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
  withReducer(
    on(verificationEvents.verifyLabelOnLoading, (_event, state) =>
      produce(state, (draft) => {
        draft.verifyLabelLoading = true;
        draft.verifyLabelError = null;
        draft.verificationResult = null;
      })
    ),
    on(verificationEvents.verifyLabelOnSuccess, ({ payload }, state) =>
      produce(state, (draft) => {
        draft.verificationResult = payload;
        draft.verifyLabelLoading = false;
        draft.verifyLabelError = null;
      })
    ),
    on(verificationEvents.verifyLabelOnFailure, ({ payload }, state) =>
      produce(state, (draft) => {
        draft.verifyLabelLoading = false;
        draft.verifyLabelError = payload.message || 'Verification failed';
        draft.verificationResult = null;
      })
    ),
    on(verificationEvents.resetVerification, (_event, _state) =>
      produce(initialState, () => {})
    ),
    on(verificationEvents.clearResults, (_event, state) =>
      produce(state, (draft) => {
        draft.verificationResult = null;
        draft.verifyLabelError = null;
      })
    )
  )
);