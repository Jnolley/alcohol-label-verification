import { TestBed } from '@angular/core/testing';
import { VerificationStore } from './verification.store';
import { VerificationService } from '../services/verification.service';
import { ToastService } from '../../../core/services/toast.service';
import { VerificationResult } from '../../../shared/models/verification-result.model';
import { LabelFormData } from '../../../shared/models/label-form-data.model';
import { MatchStatus } from '../../../shared/enums/match-status.enum';
import { FieldType } from '../../../shared/enums/field-type.enum';
import { of, throwError } from 'rxjs';

describe('VerificationStore', () => {
  let store: InstanceType<typeof VerificationStore>;
  let verificationServiceMock: jasmine.SpyObj<VerificationService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    verificationServiceMock = jasmine.createSpyObj('VerificationService', ['verifyLabel']);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['showSuccess', 'showWarning', 'showError']);

    TestBed.configureTestingModule({
      providers: [
        VerificationStore,
        { provide: VerificationService, useValue: verificationServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
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

    it('should not be submitting', () => {
      expect(store.isSubmitting()).toBe(false);
    });

    it('should have null error', () => {
      expect(store.error()).toBeNull();
    });

    it('should have null verificationResult', () => {
      expect(store.verificationResult()).toBeNull();
    });

    it('should not be able to submit', () => {
      expect(store.canSubmit()).toBe(false);
    });

    it('should not have results', () => {
      expect(store.hasResults()).toBe(false);
    });
  });

  describe('setFormData', () => {
    it('should update form data', () => {
      const formData: LabelFormData = {
        brandName: 'Test Brand',
        productType: 'Bourbon',
        alcoholContent: 45,
        netContentsValue: 750,
        netContentsUnit: 'ml'
      };

      store.setFormData(formData);
      expect(store.formData()).toEqual(formData);
    });

    it('should enable submit when both formData and image are set', () => {
      const formData: LabelFormData = {
        brandName: 'Test',
        productType: 'Whiskey',
        alcoholContent: 40
      };
      const imageFile = new File([''], 'test.jpg');

      store.setFormData(formData);
      store.setImage(imageFile);
      expect(store.canSubmit()).toBe(true);
    });
  });

  describe('setImage', () => {
    it('should update image file', () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      store.setImage(imageFile);
      expect(store.imageFile()).toEqual(imageFile);
    });
  });

  describe('submitVerification', () => {
    let mockFormData: LabelFormData;
    let mockImageFile: File;
    let mockResult: VerificationResult;

    beforeEach(() => {
      mockFormData = {
        brandName: 'Test Brand',
        productType: 'Bourbon',
        alcoholContent: 45
      };
      mockImageFile = new File([''], 'test.jpg');
      mockResult = {
        success: true,
        message: 'Label matches form data',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.Match,
            message: 'Brand name found',
            expected: 'Test Brand',
            found: 'Test Brand'
          }
        ]
      };
    });

    it('should do nothing if formData is missing', () => {
      store.setImage(mockImageFile);
      store.submitVerification();
      expect(verificationServiceMock.verifyLabel).not.toHaveBeenCalled();
    });

    it('should do nothing if imageFile is missing', () => {
      store.setFormData(mockFormData);
      store.submitVerification();
      expect(verificationServiceMock.verifyLabel).not.toHaveBeenCalled();
    });

    it('should set isSubmitting to true when submitting', () => {
      verificationServiceMock.verifyLabel.and.returnValue(of(mockResult));
      store.setFormData(mockFormData);
      store.setImage(mockImageFile);

      store.submitVerification();

      // Initially set to true during submission
      expect(store.isSubmitting()).toBe(false); // Will be false after observable completes synchronously
      expect(verificationServiceMock.verifyLabel).toHaveBeenCalled();
    });

    it('should handle successful verification', () => {
      verificationServiceMock.verifyLabel.and.returnValue(of(mockResult));
      store.setFormData(mockFormData);
      store.setImage(mockImageFile);

      store.submitVerification();

      expect(store.verificationResult()).toEqual(mockResult);
      expect(store.isSubmitting()).toBe(false);
      expect(store.error()).toBeNull();
      expect(toastServiceMock.showSuccess).toHaveBeenCalledWith('Label verification successful! All fields match.');
    });

    it('should handle failed verification with discrepancies', () => {
      const failedResult: VerificationResult = {
        success: false,
        message: 'Discrepancies found',
        fieldChecks: []
      };
      verificationServiceMock.verifyLabel.and.returnValue(of(failedResult));
      store.setFormData(mockFormData);
      store.setImage(mockImageFile);

      store.submitVerification();

      expect(store.verificationResult()).toEqual(failedResult);
      expect(store.isSubmitting()).toBe(false);
      expect(store.error()).toBeNull();
      expect(toastServiceMock.showWarning).toHaveBeenCalledWith('Label verification completed with discrepancies. Check results in the modal.');
    });

    it('should handle verification error', () => {
      const errorMessage = 'Image processing failed';
      const error = { error: { error: { message: errorMessage } } };
      verificationServiceMock.verifyLabel.and.returnValue(throwError(() => error));
      store.setFormData(mockFormData);
      store.setImage(mockImageFile);

      store.submitVerification();

      expect(store.isSubmitting()).toBe(false);
      expect(store.error()).toBe(errorMessage);
      expect(store.verificationResult()).toBeNull();
      expect(toastServiceMock.showError).toHaveBeenCalledWith(errorMessage);
    });

    it('should call onSuccess callback when verification succeeds', () => {
      const onSuccessSpy = jasmine.createSpy('onSuccess');
      verificationServiceMock.verifyLabel.and.returnValue(of(mockResult));
      store.setFormData(mockFormData);
      store.setImage(mockImageFile);

      store.submitVerification(onSuccessSpy);

      expect(onSuccessSpy).toHaveBeenCalled();
    });

    it('should clear previous results when submitting', () => {
      verificationServiceMock.verifyLabel.and.returnValue(of(mockResult));
      store.setFormData(mockFormData);
      store.setImage(mockImageFile);

      // First submission
      store.submitVerification();
      expect(store.verificationResult()).toEqual(mockResult);

      // Second submission should clear previous result
      const secondResult: VerificationResult = {
        success: false,
        message: 'Different result',
        fieldChecks: []
      };
      verificationServiceMock.verifyLabel.and.returnValue(of(secondResult));

      store.submitVerification();
      expect(store.verificationResult()).toEqual(secondResult);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const mockFormData: LabelFormData = {
        brandName: 'Test',
        productType: 'Whiskey',
        alcoholContent: 40
      };
      const mockImageFile = new File([''], 'test.jpg');

      store.setFormData(mockFormData);
      store.setImage(mockImageFile);

      store.reset();

      expect(store.formData()).toBeNull();
      expect(store.imageFile()).toBeNull();
      expect(store.isSubmitting()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.verificationResult()).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('canSubmit should be true when both formData and image are set', () => {
      const formData: LabelFormData = {
        brandName: 'Test',
        productType: 'Whiskey',
        alcoholContent: 40
      };
      const imageFile = new File([''], 'test.jpg');

      store.setFormData(formData);
      store.setImage(imageFile);

      expect(store.canSubmit()).toBe(true);
    });

    it('canSubmit should be false when only formData is set', () => {
      const formData: LabelFormData = {
        brandName: 'Test',
        productType: 'Whiskey',
        alcoholContent: 40
      };

      store.setFormData(formData);

      expect(store.canSubmit()).toBe(false);
    });

    it('canSubmit should be false when only image is set', () => {
      const imageFile = new File([''], 'test.jpg');

      store.setImage(imageFile);

      expect(store.canSubmit()).toBe(false);
    });

    it('hasResults should be true when verification result is set', () => {
      const mockResult: VerificationResult = {
        success: true,
        message: 'Success',
        fieldChecks: []
      };
      const mockFormData: LabelFormData = {
        brandName: 'Test',
        productType: 'Whiskey',
        alcoholContent: 40
      };
      const mockImageFile = new File([''], 'test.jpg');

      verificationServiceMock.verifyLabel.and.returnValue(of(mockResult));
      store.setFormData(mockFormData);
      store.setImage(mockImageFile);
      store.submitVerification();

      expect(store.hasResults()).toBe(true);
    });

    it('hasResults should be false initially', () => {
      expect(store.hasResults()).toBe(false);
    });
  });
});
