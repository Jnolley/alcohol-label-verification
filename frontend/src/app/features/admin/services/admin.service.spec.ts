import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { Submission, SubmissionStatus } from '../../../shared/models/submission.model';
import { environment } from '../../../../environments/environment';
import { MatchStatus } from '../../../shared/enums/match-status.enum';
import { FieldType } from '../../../shared/enums/field-type.enum';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/admin`;

  const mockSubmission: Submission = {
    id: '1',
    status: SubmissionStatus.PENDING,
    formData: {
      brandName: 'Test Brand',
      productType: 'Bourbon',
      alcoholContent: 45,
      netContentsValue: 750,
      netContentsUnit: 'ml',
    },
    imageBase64: 'base64-encoded-image',
    ocrData: {
      raw: 'Test Brand Bourbon 45% 750ml',
      normalized: 'test brand bourbon 45% 750ml',
      confidence: 0.95,
      words: [],
    },
    verificationResult: {
      success: true,
      message: 'Label matches form data',
      fieldChecks: [
        {
          fieldType: FieldType.BrandName,
          status: MatchStatus.Match,
          message: 'Brand name found',
          expected: 'Test Brand',
          found: 'Test Brand',
        },
      ],
    },
    timestamp: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should send POST request with credentials in body and header', () => {
      const username = 'admin';
      const password = 'admin123';
      const mockResponse = { success: true, message: 'Login successful' };

      service.login(username, password).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username, password });

      const expectedAuthHeader = 'Basic ' + btoa(`${username}:${password}`);
      expect(req.request.headers.get('Authorization')).toBe(expectedAuthHeader);

      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      const username = 'admin';
      const password = 'wrong';

      service.login(username, password).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/login`);
      req.flush(
        { error: { message: 'Invalid credentials' } },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('getSubmissions', () => {
    it('should get all submissions without status filter', () => {
      const mockResponse = {
        success: true,
        count: 2,
        submissions: [
          { ...mockSubmission, id: '1', status: SubmissionStatus.PENDING },
          { ...mockSubmission, id: '2', status: SubmissionStatus.APPROVED },
        ],
      };

      localStorage.setItem('admin_credentials', btoa('admin:admin123'));

      service.getSubmissions().subscribe((result) => {
        expect(result).toEqual(mockResponse);
        expect(result.count).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/submissions`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toContain('Basic');

      req.flush(mockResponse);
    });

    it('should get submissions filtered by status', () => {
      const mockResponse = {
        success: true,
        count: 1,
        submissions: [{ ...mockSubmission, id: '1', status: SubmissionStatus.PENDING }],
      };

      localStorage.setItem('admin_credentials', btoa('admin:admin123'));

      service.getSubmissions(SubmissionStatus.PENDING).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/submissions?status=pending`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('status')).toBe('pending');

      req.flush(mockResponse);
    });

    it('should throw error when not authenticated', () => {
      expect(() => {
        service.getSubmissions().subscribe();
      }).toThrow('Not authenticated');
    });

    it('should handle HTTP errors', () => {
      localStorage.setItem('admin_credentials', btoa('admin:admin123'));

      service.getSubmissions().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/submissions`);
      req.flush(
        { error: { message: 'Unauthorized' } },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('getSubmission', () => {
    it('should get a specific submission by ID', () => {
      const mockResponse = {
        success: true,
        submission: { ...mockSubmission, id: 'test-id-123', status: SubmissionStatus.PENDING },
      };

      localStorage.setItem('admin_credentials', btoa('admin:admin123'));

      service.getSubmission('test-id-123').subscribe((result) => {
        expect(result).toEqual(mockResponse);
        expect(result.submission.id).toBe('test-id-123');
      });

      const req = httpMock.expectOne(`${baseUrl}/submissions/test-id-123`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toContain('Basic');

      req.flush(mockResponse);
    });

    it('should handle 404 when submission not found', () => {
      localStorage.setItem('admin_credentials', btoa('admin:admin123'));

      service.getSubmission('non-existent').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/submissions/non-existent`);
      req.flush(
        { error: { message: 'Submission not found' } },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should throw error when not authenticated', () => {
      expect(() => {
        service.getSubmission('test-id').subscribe();
      }).toThrow('Not authenticated');
    });
  });

  describe('updateSubmission', () => {
    it('should update submission status to approved', () => {
      const mockResponse = {
        success: true,
        message: 'Submission approved',
        submission: { ...mockSubmission, id: 'test-id-123', status: SubmissionStatus.APPROVED },
      };

      localStorage.setItem('admin_credentials', btoa('admin:admin123'));

      service.updateSubmission('test-id-123', SubmissionStatus.APPROVED).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/submissions/test-id-123`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({
        status: SubmissionStatus.APPROVED,
        reviewedBy: 'admin',
      });
      expect(req.request.headers.get('Authorization')).toContain('Basic');

      req.flush(mockResponse);
    });

    it('should update submission status to rejected with admin notes', () => {
      const mockResponse = {
        success: true,
        message: 'Submission rejected',
        submission: { ...mockSubmission, id: 'test-id-123', status: SubmissionStatus.REJECTED },
      };

      localStorage.setItem('admin_credentials', btoa('admin:admin123'));

      service
        .updateSubmission('test-id-123', SubmissionStatus.REJECTED, 'Label does not match')
        .subscribe((result) => {
          expect(result).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(`${baseUrl}/submissions/test-id-123`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({
        status: SubmissionStatus.REJECTED,
        adminNotes: 'Label does not match',
        reviewedBy: 'admin',
      });

      req.flush(mockResponse);
    });

    it('should handle update errors', () => {
      localStorage.setItem('admin_credentials', btoa('admin:admin123'));

      service.updateSubmission('test-id', SubmissionStatus.APPROVED).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/submissions/test-id`);
      req.flush(
        { error: { message: 'Submission not found' } },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should throw error when not authenticated', () => {
      expect(() => {
        service.updateSubmission('test-id', SubmissionStatus.APPROVED).subscribe();
      }).toThrow('Not authenticated');
    });
  });

  describe('getBasicAuthHeader', () => {
    it('should create correct Basic Auth header', () => {
      const username = 'admin';
      const password = 'admin123';

      // Access the private method through login which uses it
      service.login(username, password).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/login`);
      const authHeader = req.request.headers.get('Authorization');

      expect(authHeader).toBe('Basic ' + btoa(`${username}:${password}`));
      req.flush({ success: true, message: 'Login successful' });
    });
  });

  describe('getAuthHeaders', () => {
    it('should retrieve stored credentials from localStorage', () => {
      const credentials = btoa('admin:admin123');
      localStorage.setItem('admin_credentials', credentials);

      service.getSubmissions().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/submissions`);
      const authHeader = req.request.headers.get('Authorization');

      expect(authHeader).toBe(`Basic ${credentials}`);
      req.flush({ success: true, count: 0, submissions: [] });
    });
  });
});