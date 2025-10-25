import { signalStore, withState, patchState, withMethods, withComputed } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { VerificationStoreState } from './verification-store-state.model';
import { VerificationResult } from '../../../shared/models/verification-result.model';
import { LabelFormData } from '../../../shared/models/label-form-data.model';
import { VerificationService } from '../services/verification.service';
import { ToastService } from '../../../core/services/toast.service';

const initialState: VerificationStoreState = {
  formData: null,
  imageFile: null,
  isSubmitting: false,
  verificationResult: null,
  error: null,
};

export const VerificationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    canSubmit: computed(() => store.formData() !== null && store.imageFile() !== null),
    hasResults: computed(() => store.verificationResult() !== null),
  })),
  withMethods((store, verificationService = inject(VerificationService), toastService = inject(ToastService)) => ({
    setFormData(formData: LabelFormData) {
      patchState(store, { formData });
    },
    setImage(imageFile: File) {
      patchState(store, { imageFile });
    },
    submitVerification(onSuccess?: () => void) {
      const formData = store.formData();
      const imageFile = store.imageFile();

      if (!formData || !imageFile) {
        return;
      }

      patchState(store, {
        isSubmitting: true,
        error: null,
        verificationResult: null,
      });

      verificationService.verifyLabel({ formData, imageFile }).subscribe({
        next: (result: VerificationResult) => {
          patchState(store, {
            verificationResult: result,
            isSubmitting: false,
            error: null,
          });

          if (result.success) {
            toastService.showSuccess('Label verification successful! All fields match.');
          } else {
            toastService.showWarning('Label verification completed with discrepancies. Check results in the modal.');
          }

          onSuccess?.();
        },
        error: (error: any) => {
          const errorMessage = error.error?.error?.message || error.message || 'Verification failed';
          patchState(store, {
            isSubmitting: false,
            error: errorMessage,
            verificationResult: null,
          });
          toastService.showError(errorMessage);
        }
      });
    },
    reset() {
      patchState(store, initialState);
    },
  }))
);