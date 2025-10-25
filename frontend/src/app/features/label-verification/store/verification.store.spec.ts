import { TestBed } from '@angular/core/testing';
import { VerificationStore } from './verification.store';
import { VerificationResult } from '../../../shared/models/verification-result.model';
import { MatchStatus } from '../../../shared/enums/match-status.enum';
import { FieldType } from '../../../shared/enums/field-type.enum';

describe('VerificationStore', () => {
  let store: InstanceType<typeof VerificationStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VerificationStore]
    });
    store = TestBed.inject(VerificationStore);
  });

  describe('initial state', () => {
    it('should have null formData', () => {
      expect(store.formData()).toBeNull();
    });

    it('should have null imageFile', () => {
      expect(store.imageFile()).toBeNull();
    });

    it('should have loading as false', () => {
      expect(store.verifyLabelLoading()).toBe(false);
    });

    it('should have null error', () => {
      expect(store.verifyLabelError()).toBeNull();
    });

    it('should have null verificationResult', () => {
      expect(store.verificationResult()).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      store.setLoading();
      expect(store.verifyLabelLoading()).toBe(true);
    });

    it('should clear error when setting loading', () => {
      store.setError('Previous error');
      store.setLoading();
      expect(store.verifyLabelError()).toBeNull();
    });

    it('should clear verification result when setting loading', () => {
      const mockResult: VerificationResult = {
        success: true,
        message: 'Success',
        fieldChecks: []
      };
      store.setSuccess(mockResult);
      store.setLoading();
      expect(store.verificationResult()).toBeNull();
    });
  });

  describe('setSuccess', () => {
    it('should set verification result', () => {
      const mockResult: VerificationResult = {
        success: true,
        message: 'Label matches form data',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.Match,
            message: 'Brand name found',
            expected: 'Test',
            found: 'Test'
          }
        ]
      };

      store.setSuccess(mockResult);
      expect(store.verificationResult()).toEqual(mockResult);
    });

    it('should set loading to false', () => {
      store.setLoading();
      const mockResult: VerificationResult = {
        success: true,
        message: 'Success',
        fieldChecks: []
      };
      store.setSuccess(mockResult);
      expect(store.verifyLabelLoading()).toBe(false);
    });

    it('should clear error', () => {
      store.setError('Previous error');
      const mockResult: VerificationResult = {
        success: true,
        message: 'Success',
        fieldChecks: []
      };
      store.setSuccess(mockResult);
      expect(store.verifyLabelError()).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Something went wrong';
      store.setError(errorMessage);
      expect(store.verifyLabelError()).toBe(errorMessage);
    });

    it('should set loading to false', () => {
      store.setLoading();
      store.setError('Error occurred');
      expect(store.verifyLabelLoading()).toBe(false);
    });

    it('should clear verification result', () => {
      const mockResult: VerificationResult = {
        success: true,
        message: 'Success',
        fieldChecks: []
      };
      store.setSuccess(mockResult);
      store.setError('Error occurred');
      expect(store.verificationResult()).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set some state
      store.setLoading();
      store.setSuccess({
        success: true,
        message: 'Success',
        fieldChecks: []
      });
      store.setError('Error');

      // Reset
      store.reset();

      // Verify all state is reset
      expect(store.formData()).toBeNull();
      expect(store.imageFile()).toBeNull();
      expect(store.verifyLabelLoading()).toBe(false);
      expect(store.verifyLabelError()).toBeNull();
      expect(store.verificationResult()).toBeNull();
    });
  });

  describe('state transitions', () => {
    it('should handle loading -> success transition', () => {
      store.setLoading();
      expect(store.verifyLabelLoading()).toBe(true);
      expect(store.verificationResult()).toBeNull();

      const result: VerificationResult = {
        success: true,
        message: 'Success',
        fieldChecks: []
      };
      store.setSuccess(result);
      expect(store.verifyLabelLoading()).toBe(false);
      expect(store.verificationResult()).toEqual(result);
    });

    it('should handle loading -> error transition', () => {
      store.setLoading();
      expect(store.verifyLabelLoading()).toBe(true);
      expect(store.verifyLabelError()).toBeNull();

      store.setError('Failed to verify');
      expect(store.verifyLabelLoading()).toBe(false);
      expect(store.verifyLabelError()).toBe('Failed to verify');
    });

    it('should handle multiple sequential verifications', () => {
      // First verification
      store.setLoading();
      store.setSuccess({ success: true, message: 'First', fieldChecks: [] });

      // Second verification
      store.setLoading();
      expect(store.verificationResult()).toBeNull();
      store.setSuccess({ success: false, message: 'Second', fieldChecks: [] });

      expect(store.verificationResult()?.message).toBe('Second');
    });
  });
});
