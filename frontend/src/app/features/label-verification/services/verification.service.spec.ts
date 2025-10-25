import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VerificationService } from './verification.service';
import { VerificationRequest } from '../../../shared/models/verification-request.model';
import { VerificationResult } from '../../../shared/models/verification-result.model';
import { MatchStatus } from '../../../shared/enums/match-status.enum';
import { FieldType } from '../../../shared/enums/field-type.enum';

describe('VerificationService', () => {
  let service: VerificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VerificationService]
    });
    service = TestBed.inject(VerificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('verifyLabel', () => {
    it('should send POST request with all form fields', () => {
      const mockFile = new File(['fake content'], 'test.jpg', { type: 'image/jpeg' });
      const request: VerificationRequest = {
        formData: {
          brandName: 'Old Tom Distillery',
          productType: 'Bourbon',
          alcoholContent: 45,
          netContentsValue: 750,
          netContentsUnit: 'ml'
        },
        imageFile: mockFile
      };

      const mockResponse: VerificationResult = {
        success: true,
        message: 'Label matches form data',
        fieldChecks: [
          {
            fieldType: FieldType.BrandName,
            status: MatchStatus.Match,
            message: 'Brand name found',
            expected: 'Old Tom Distillery',
            found: 'Old Tom Distillery'
          }
        ]
      };

      service.verifyLabel(request).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/verify');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;
      expect(formData.get('brandName')).toBe('Old Tom Distillery');
      expect(formData.get('productType')).toBe('Bourbon');
      expect(formData.get('alcoholContent')).toBe('45');
      expect(formData.get('netContentsValue')).toBe('750');
      expect(formData.get('netContentsUnit')).toBe('ml');

      req.flush(mockResponse);
    });

    it('should handle request without optional net contents', () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const request: VerificationRequest = {
        formData: {
          brandName: 'Test',
          productType: 'Bourbon',
          alcoholContent: 45
        },
        imageFile: mockFile
      };

      service.verifyLabel(request).subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/verify');
      const formData = req.request.body as FormData;

      expect(formData.has('netContentsValue')).toBe(false);
      expect(formData.has('netContentsUnit')).toBe(false);

      req.flush({});
    });

    it('should handle HTTP 400 error', () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const request: VerificationRequest = {
        formData: {
          brandName: 'Test',
          productType: 'Bourbon',
          alcoholContent: 45
        },
        imageFile: mockFile
      };

      service.verifyLabel(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/verify');
      req.flush({ error: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle HTTP 422 error', () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const request: VerificationRequest = {
        formData: {
          brandName: 'Test',
          productType: 'Bourbon',
          alcoholContent: 45
        },
        imageFile: mockFile
      };

      service.verifyLabel(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(422);
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/verify');
      req.flush({ error: 'Invalid image' }, { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should convert decimal alcohol content to string', () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const request: VerificationRequest = {
        formData: {
          brandName: 'Test',
          productType: 'Bourbon',
          alcoholContent: 45.5
        },
        imageFile: mockFile
      };

      service.verifyLabel(request).subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/verify');
      const formData = req.request.body as FormData;

      expect(formData.get('alcoholContent')).toBe('45.5');

      req.flush({});
    });
  });
});
