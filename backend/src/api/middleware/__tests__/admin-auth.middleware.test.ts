import { Request, Response, NextFunction } from 'express';
import { adminAuthMiddleware } from '../admin-auth.middleware';
import config from '../../../config';

describe('adminAuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      body: {},
    };

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Auth header validation', () => {
    it('should allow access with valid Basic Auth credentials', () => {
      const validCredentials = Buffer.from(`${config.admin.username}:${config.admin.password}`).toString('base64');
      mockRequest.headers = {
        authorization: `Basic ${validCredentials}`,
      };

      adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid Basic Auth username', () => {
      const invalidCredentials = Buffer.from(`wrong-user:${config.admin.password}`).toString('base64');
      mockRequest.headers = {
        authorization: `Basic ${invalidCredentials}`,
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid Basic Auth password', () => {
      const invalidCredentials = Buffer.from(`${config.admin.username}:wrong-password`).toString('base64');
      mockRequest.headers = {
        authorization: `Basic ${invalidCredentials}`,
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject malformed Basic Auth header', () => {
      mockRequest.headers = {
        authorization: 'Basic invalid-base64',
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-Basic Auth header', () => {
      mockRequest.headers = {
        authorization: 'Bearer some-token',
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Request body credentials validation', () => {
    it('should allow access with valid credentials in request body', () => {
      mockRequest.body = {
        username: config.admin.username,
        password: config.admin.password,
      };

      adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid username in request body', () => {
      mockRequest.body = {
        username: 'wrong-user',
        password: config.admin.password,
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid password in request body', () => {
      mockRequest.body = {
        username: config.admin.username,
        password: 'wrong-password',
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing credentials in request body', () => {
      mockRequest.body = {};

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Priority and fallback behavior', () => {
    it('should prioritize Basic Auth header over request body', () => {
      const validCredentials = Buffer.from(`${config.admin.username}:${config.admin.password}`).toString('base64');
      mockRequest.headers = {
        authorization: `Basic ${validCredentials}`,
      };
      // Body has invalid credentials, but header should take precedence
      mockRequest.body = {
        username: 'wrong-user',
        password: 'wrong-password',
      };

      adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fall back to body credentials when Basic Auth is invalid', () => {
      const invalidCredentials = Buffer.from('wrong:wrong').toString('base64');
      mockRequest.headers = {
        authorization: `Basic ${invalidCredentials}`,
      };
      mockRequest.body = {
        username: config.admin.username,
        password: config.admin.password,
      };

      adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when both header and body are invalid', () => {
      const invalidCredentials = Buffer.from('wrong:wrong').toString('base64');
      mockRequest.headers = {
        authorization: `Basic ${invalidCredentials}`,
      };
      mockRequest.body = {
        username: 'wrong-user',
        password: 'wrong-password',
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when no credentials are provided', () => {
      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle credentials with special characters', () => {
      const specialUsername = 'admin@test';
      const specialPassword = 'p@ssw0rd!#$';

      // Temporarily override config for this test
      const originalUsername = config.admin.username;
      const originalPassword = config.admin.password;
      (config.admin as any).username = specialUsername;
      (config.admin as any).password = specialPassword;

      const validCredentials = Buffer.from(`${specialUsername}:${specialPassword}`).toString('base64');
      mockRequest.headers = {
        authorization: `Basic ${validCredentials}`,
      };

      adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Restore original config
      (config.admin as any).username = originalUsername;
      (config.admin as any).password = originalPassword;
    });

    it('should handle credentials with colons in password', () => {
      const password = 'pass:word:123';

      const originalPassword = config.admin.password;
      (config.admin as any).password = password;

      const validCredentials = Buffer.from(`${config.admin.username}:${password}`).toString('base64');
      mockRequest.headers = {
        authorization: `Basic ${validCredentials}`,
      };

      adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Restore original config
      (config.admin as any).password = originalPassword;
    });

    it('should reject empty authorization header value', () => {
      mockRequest.headers = {
        authorization: '',
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject authorization header with only "Basic"', () => {
      mockRequest.headers = {
        authorization: 'Basic',
      };

      expect(() => {
        adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid admin credentials');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});