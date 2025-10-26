import { Request, Response } from 'express';
import { AdminController } from '../admin.controller';
import { SubmissionStore } from '../../../storage/implementation/submission.store';
import { Submission, SubmissionStatus } from '../../../storage/contracts/submission';
import { MatchStatus } from '../../../common/enums/match-status';
import { FieldType } from '../../../common/enums/field-type';

describe('AdminController', () => {
  let controller: AdminController;
  let mockSubmissionStore: jest.Mocked<SubmissionStore>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockSubmission: Submission = {
    id: 'test-id-123',
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
          message: 'Brand name found on label',
          expected: 'Test Brand',
          found: 'Test Brand',
        },
      ],
    },
    status: SubmissionStatus.PENDING,
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    mockSubmissionStore = {
      getAll: jest.fn(),
      getById: jest.fn(),
      updateStatus: jest.fn(),
      save: jest.fn(),
      clear: jest.fn(),
    } as any;

    controller = new AdminController(mockSubmissionStore);

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should return success message when credentials are valid', async () => {
      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
      });
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('getSubmissions', () => {
    it('should return all submissions when no status filter is provided', async () => {
      const submissions = [mockSubmission];
      mockSubmissionStore.getAll.mockReturnValue(submissions);

      await controller.getSubmissions(mockRequest as Request, mockResponse as Response);

      expect(mockSubmissionStore.getAll).toHaveBeenCalledWith();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        count: 1,
        submissions,
      });
    });

    it('should return submissions filtered by status', async () => {
      mockRequest.query = { status: SubmissionStatus.APPROVED };
      const approvedSubmission = { ...mockSubmission, status: SubmissionStatus.APPROVED };
      mockSubmissionStore.getAll.mockReturnValue([approvedSubmission]);

      await controller.getSubmissions(mockRequest as Request, mockResponse as Response);

      expect(mockSubmissionStore.getAll).toHaveBeenCalledWith(SubmissionStatus.APPROVED);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        count: 1,
        submissions: [approvedSubmission],
      });
    });

    it('should ignore invalid status filter', async () => {
      mockRequest.query = { status: 'invalid-status' };
      const submissions = [mockSubmission];
      mockSubmissionStore.getAll.mockReturnValue(submissions);

      await controller.getSubmissions(mockRequest as Request, mockResponse as Response);

      expect(mockSubmissionStore.getAll).toHaveBeenCalledWith();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        count: 1,
        submissions,
      });
    });

    it('should sort submissions by timestamp, newest first', async () => {
      const oldSubmission = { ...mockSubmission, id: 'old', timestamp: new Date('2024-01-01') };
      const newSubmission = { ...mockSubmission, id: 'new', timestamp: new Date('2024-01-02') };
      mockSubmissionStore.getAll.mockReturnValue([oldSubmission, newSubmission]);

      await controller.getSubmissions(mockRequest as Request, mockResponse as Response);

      const returnedSubmissions = jsonMock.mock.calls[0][0].submissions;
      expect(returnedSubmissions[0].id).toBe('new');
      expect(returnedSubmissions[1].id).toBe('old');
    });

    it('should return empty array when no submissions exist', async () => {
      mockSubmissionStore.getAll.mockReturnValue([]);

      await controller.getSubmissions(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        count: 0,
        submissions: [],
      });
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Database error');
      mockSubmissionStore.getAll.mockImplementation(() => {
        throw error;
      });

      await controller.getSubmissions(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission when found', async () => {
      mockRequest.params = { id: 'test-id-123' };
      mockSubmissionStore.getById.mockReturnValue(mockSubmission);

      await controller.getSubmissionById(mockRequest as Request, mockResponse as Response);

      expect(mockSubmissionStore.getById).toHaveBeenCalledWith('test-id-123');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        submission: mockSubmission,
      });
    });

    it('should return 404 when submission not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockSubmissionStore.getById.mockReturnValue(undefined);

      await controller.getSubmissionById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'NotFoundError',
          message: 'Submission non-existent-id not found',
        },
      });
    });

    it('should handle unexpected errors', async () => {
      mockRequest.params = { id: 'test-id' };
      const error = new Error('Database error');
      mockSubmissionStore.getById.mockImplementation(() => {
        throw error;
      });

      await controller.getSubmissionById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });
  });

  describe('updateSubmissionStatus', () => {
    it('should update submission status successfully', async () => {
      mockRequest.params = { id: 'test-id-123' };
      mockRequest.body = {
        status: SubmissionStatus.APPROVED,
        adminNotes: 'Looks good',
        reviewedBy: 'admin',
      };

      const updatedSubmission = { ...mockSubmission, status: SubmissionStatus.APPROVED };
      mockSubmissionStore.updateStatus.mockReturnValue(updatedSubmission);

      await controller.updateSubmissionStatus(mockRequest as Request, mockResponse as Response);

      expect(mockSubmissionStore.updateStatus).toHaveBeenCalledWith(
        'test-id-123',
        SubmissionStatus.APPROVED,
        'Looks good',
        'admin'
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Submission approved',
        submission: updatedSubmission,
      });
    });

    it('should reject submission with admin notes', async () => {
      mockRequest.params = { id: 'test-id-123' };
      mockRequest.body = {
        status: SubmissionStatus.REJECTED,
        adminNotes: 'Label does not match',
        reviewedBy: 'admin',
      };

      const updatedSubmission = { ...mockSubmission, status: SubmissionStatus.REJECTED };
      mockSubmissionStore.updateStatus.mockReturnValue(updatedSubmission);

      await controller.updateSubmissionStatus(mockRequest as Request, mockResponse as Response);

      expect(mockSubmissionStore.updateStatus).toHaveBeenCalledWith(
        'test-id-123',
        SubmissionStatus.REJECTED,
        'Label does not match',
        'admin'
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Submission rejected',
        submission: updatedSubmission,
      });
    });

    it('should return 400 when status is missing', async () => {
      mockRequest.params = { id: 'test-id-123' };
      mockRequest.body = {};

      await controller.updateSubmissionStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'BadRequestError',
          message: 'Invalid status. Must be: pending, approved, or rejected',
        },
      });
      expect(mockSubmissionStore.updateStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when status is invalid', async () => {
      mockRequest.params = { id: 'test-id-123' };
      mockRequest.body = { status: 'invalid-status' };

      await controller.updateSubmissionStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'BadRequestError',
          message: 'Invalid status. Must be: pending, approved, or rejected',
        },
      });
      expect(mockSubmissionStore.updateStatus).not.toHaveBeenCalled();
    });

    it('should return 404 when submission not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.body = { status: SubmissionStatus.APPROVED };
      mockSubmissionStore.updateStatus.mockReturnValue(undefined);

      await controller.updateSubmissionStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'NotFoundError',
          message: 'Submission non-existent-id not found',
        },
      });
    });

    it('should handle optional adminNotes and reviewedBy', async () => {
      mockRequest.params = { id: 'test-id-123' };
      mockRequest.body = { status: SubmissionStatus.APPROVED };

      const updatedSubmission = { ...mockSubmission, status: SubmissionStatus.APPROVED };
      mockSubmissionStore.updateStatus.mockReturnValue(updatedSubmission);

      await controller.updateSubmissionStatus(mockRequest as Request, mockResponse as Response);

      expect(mockSubmissionStore.updateStatus).toHaveBeenCalledWith(
        'test-id-123',
        SubmissionStatus.APPROVED,
        undefined,
        undefined
      );
    });

    it('should handle unexpected errors', async () => {
      mockRequest.params = { id: 'test-id-123' };
      mockRequest.body = { status: SubmissionStatus.APPROVED };
      const error = new Error('Database error');
      mockSubmissionStore.updateStatus.mockImplementation(() => {
        throw error;
      });

      await controller.updateSubmissionStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });
  });
});