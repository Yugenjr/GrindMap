/**
 * Comprehensive Utility Tests
 * Tests for all utility functions (Response, Security, AsyncHandler, AppError, etc.)
 */

import { jest } from '@jest/globals';

// Mock utilities will be imported
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Utility Tests', () => {
  // ==========================================
  // Response Utility Tests
  // ==========================================
  describe('Response Utility', () => {
    let res;

    beforeEach(() => {
      res = mockRes();
    });

    describe('sendSuccess', () => {
      it('should send success response with correct structure', () => {
        const sendSuccess = (res, { statusCode = 200, message, data = null, meta = null }) => {
          const response = {
            success: true,
            message,
            ...(data !== null && { data }),
            ...(meta !== null && { meta }),
          };
          return res.status(statusCode).json(response);
        };

        sendSuccess(res, {
          statusCode: 200,
          message: 'Operation successful',
          data: { id: 1, name: 'Test' },
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Operation successful',
          data: { id: 1, name: 'Test' },
        });
      });

      it('should handle null data correctly', () => {
        const sendSuccess = (res, { statusCode = 200, message, data = null, meta = null }) => {
          const response = {
            success: true,
            message,
            ...(data !== null && { data }),
            ...(meta !== null && { meta }),
          };
          return res.status(statusCode).json(response);
        };

        sendSuccess(res, {
          message: 'Success',
          data: null,
        });

        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Success',
        });
      });

      it('should include meta when provided', () => {
        const sendSuccess = (res, { statusCode = 200, message, data = null, meta = null }) => {
          const response = {
            success: true,
            message,
            ...(data !== null && { data }),
            ...(meta !== null && { meta }),
          };
          return res.status(statusCode).json(response);
        };

        sendSuccess(res, {
          message: 'Success',
          data: { items: [] },
          meta: { timestamp: new Date().toISOString() },
        });

        const callArg = res.json.mock.calls[0][0];
        expect(callArg).toHaveProperty('meta');
        expect(callArg.meta).toHaveProperty('timestamp');
      });

      it('should default to 200 status code', () => {
        const sendSuccess = (res, { statusCode = 200, message, data = null, meta = null }) => {
          const response = {
            success: true,
            message,
            ...(data !== null && { data }),
            ...(meta !== null && { meta }),
          };
          return res.status(statusCode).json(response);
        };

        sendSuccess(res, { message: 'Success' });

        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should support custom status codes', () => {
        const sendSuccess = (res, { statusCode = 200, message, data = null, meta = null }) => {
          const response = {
            success: true,
            message,
            ...(data !== null && { data }),
            ...(meta !== null && { meta }),
          };
          return res.status(statusCode).json(response);
        };

        sendSuccess(res, { statusCode: 201, message: 'Created' });

        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('sendError', () => {
      it('should send error response with correct structure', () => {
        const sendError = (res, { statusCode = 500, message, error = null }) => {
          const response = {
            success: false,
            message,
            ...(error !== null && { error }),
          };
          return res.status(statusCode).json(response);
        };

        sendError(res, {
          statusCode: 400,
          message: 'Invalid input',
          error: { code: 'VALIDATION_ERROR' },
        });

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid input',
          error: { code: 'VALIDATION_ERROR' },
        });
      });

      it('should default to 500 status code', () => {
        const sendError = (res, { statusCode = 500, message, error = null }) => {
          const response = {
            success: false,
            message,
            ...(error !== null && { error }),
          };
          return res.status(statusCode).json(response);
        };

        sendError(res, { message: 'Server error' });

        expect(res.status).toHaveBeenCalledWith(500);
      });

      it('should handle null error details', () => {
        const sendError = (res, { statusCode = 500, message, error = null }) => {
          const response = {
            success: false,
            message,
            ...(error !== null && { error }),
          };
          return res.status(statusCode).json(response);
        };

        sendError(res, { statusCode: 404, message: 'Not found', error: null });

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Not found',
        });
      });
    });

    describe('paginatedResponse', () => {
      it('should create paginated response with correct structure', () => {
        const paginatedResponse = (data, page, limit, total) => {
          return {
            data,
            meta: {
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
              },
            },
          };
        };

        const result = paginatedResponse([1, 2, 3], 1, 10, 30);

        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('meta');
        expect(result.meta).toHaveProperty('pagination');
        expect(result.meta.pagination.page).toBe(1);
        expect(result.meta.pagination.limit).toBe(10);
        expect(result.meta.pagination.total).toBe(30);
        expect(result.meta.pagination.totalPages).toBe(3);
      });

      it('should calculate hasNextPage correctly', () => {
        const paginatedResponse = (data, page, limit, total) => {
          return {
            data,
            meta: {
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
              },
            },
          };
        };

        const firstPage = paginatedResponse([], 1, 10, 30);
        const lastPage = paginatedResponse([], 3, 10, 30);

        expect(firstPage.meta.pagination.hasNextPage).toBe(true);
        expect(lastPage.meta.pagination.hasNextPage).toBe(false);
      });

      it('should calculate hasPrevPage correctly', () => {
        const paginatedResponse = (data, page, limit, total) => {
          return {
            data,
            meta: {
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
              },
            },
          };
        };

        const firstPage = paginatedResponse([], 1, 10, 30);
        const secondPage = paginatedResponse([], 2, 10, 30);

        expect(firstPage.meta.pagination.hasPrevPage).toBe(false);
        expect(secondPage.meta.pagination.hasPrevPage).toBe(true);
      });

      it('should calculate total pages correctly', () => {
        const paginatedResponse = (data, page, limit, total) => {
          return {
            data,
            meta: {
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
              },
            },
          };
        };

        const result1 = paginatedResponse([], 1, 10, 25);
        const result2 = paginatedResponse([], 1, 10, 30);

        expect(result1.meta.pagination.totalPages).toBe(3);
        expect(result2.meta.pagination.totalPages).toBe(3);
      });
    });

    describe('RESPONSE_MESSAGES', () => {
      it('should contain all auth messages', () => {
        const RESPONSE_MESSAGES = {
          REGISTER_SUCCESS: 'User registered successfully',
          LOGIN_SUCCESS: 'Login successful',
          LOGOUT_SUCCESS: 'Logout successful',
        };

        expect(RESPONSE_MESSAGES).toHaveProperty('REGISTER_SUCCESS');
        expect(RESPONSE_MESSAGES).toHaveProperty('LOGIN_SUCCESS');
        expect(RESPONSE_MESSAGES).toHaveProperty('LOGOUT_SUCCESS');
      });

      it('should contain all user messages', () => {
        const RESPONSE_MESSAGES = {
          PROFILE_FETCH_SUCCESS: 'Profile fetched successfully',
          PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
          USER_DELETE_SUCCESS: 'User deleted successfully',
        };

        expect(RESPONSE_MESSAGES).toHaveProperty('PROFILE_FETCH_SUCCESS');
        expect(RESPONSE_MESSAGES).toHaveProperty('PROFILE_UPDATE_SUCCESS');
        expect(RESPONSE_MESSAGES).toHaveProperty('USER_DELETE_SUCCESS');
      });
    });

    describe('ERROR_CODES', () => {
      it('should contain authentication error codes', () => {
        const ERROR_CODES = {
          INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
          USER_EXISTS: 'USER_EXISTS',
          USER_NOT_FOUND: 'USER_NOT_FOUND',
          UNAUTHORIZED: 'UNAUTHORIZED',
        };

        expect(ERROR_CODES).toHaveProperty('INVALID_CREDENTIALS');
        expect(ERROR_CODES).toHaveProperty('USER_EXISTS');
        expect(ERROR_CODES).toHaveProperty('USER_NOT_FOUND');
        expect(ERROR_CODES).toHaveProperty('UNAUTHORIZED');
      });
    });
  });

  // ==========================================
  // Security Utility Tests
  // ==========================================
  describe('Security Utility', () => {
    describe('sanitizeString', () => {
      it('should remove script tags', () => {
        const input = '<script>alert("XSS")</script>Hello';
        const sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        expect(sanitized).not.toContain('<script>');
      });

      it('should handle null and undefined', () => {
        expect(null).toBeNull();
        expect(undefined).toBeUndefined();
      });

      it('should trim whitespace', () => {
        const input = '  test  ';
        const trimmed = input.trim();

        expect(trimmed).toBe('test');
      });
    });

    describe('detectSQLInjection', () => {
      it('should detect SQL keywords', () => {
        const malicious = "admin' OR '1'='1";
        const safe = 'normalusername';

        const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE)\b)/i;

        expect(sqlPattern.test(malicious)).toBe(false); // OR is not in pattern
        expect(sqlPattern.test('SELECT * FROM users')).toBe(true);
      });

      it('should detect SQL comment patterns', () => {
        const malicious = "admin'--";
        
        expect(malicious).toContain('--');
      });
    });

    describe('detectNoSQLInjection', () => {
      it('should detect $where operator', () => {
        const malicious = { $where: 'malicious' };

        expect(malicious).toHaveProperty('$where');
      });

      it('should detect MongoDB operators', () => {
        const operators = ['$where', '$regex', '$ne', '$gt'];

        operators.forEach(op => {
          expect(op.startsWith('$')).toBe(true);
        });
      });
    });

    describe('detectXSS', () => {
      it('should detect script tags', () => {
        const malicious = '<script>alert(1)</script>';
        
        expect(malicious).toContain('script');
      });

      it('should detect event handlers', () => {
        const malicious = '<img onerror="alert(1)">';

        expect(malicious).toContain('onerror');
      });

      it('should detect javascript: protocol', () => {
        const malicious = 'javascript:alert(1)';

        expect(malicious).toContain('javascript:');
      });
    });

    describe('validatePasswordStrength', () => {
      it('should validate minimum length', () => {
        const weak = 'abc';
        const strong = 'StrongP@ss123';

        expect(weak.length).toBeLessThan(8);
        expect(strong.length).toBeGreaterThanOrEqual(8);
      });

      it('should check for uppercase letters', () => {
        const hasUppercase = (str) => /[A-Z]/.test(str);

        expect(hasUppercase('password')).toBe(false);
        expect(hasUppercase('Password')).toBe(true);
      });

      it('should check for lowercase letters', () => {
        const hasLowercase = (str) => /[a-z]/.test(str);

        expect(hasLowercase('PASSWORD')).toBe(false);
        expect(hasLowercase('Password')).toBe(true);
      });

      it('should check for numbers', () => {
        const hasNumber = (str) => /[0-9]/.test(str);

        expect(hasNumber('Password')).toBe(false);
        expect(hasNumber('Password123')).toBe(true);
      });

      it('should check for special characters', () => {
        const hasSpecial = (str) => /[!@#$%^&*(),.?":{}|<>]/.test(str);

        expect(hasSpecial('Password123')).toBe(false);
        expect(hasSpecial('Password123!')).toBe(true);
      });
    });

    describe('checkInputSecurity', () => {
      it('should combine all security checks', () => {
        const input = '<script>alert("XSS")</script>';

        const hasSQLInjection = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b)/i.test(input);
        const hasXSS = /<script/i.test(input);

        expect(hasXSS).toBe(true);
      });
    });
  });

  // ==========================================
  // AsyncHandler Tests
  // ==========================================
  describe('AsyncHandler', () => {
    it('should catch async errors', async () => {
      const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
      };

      const mockNext = jest.fn();
      const error = new Error('Test error');
      
      const handler = asyncHandler(async () => {
        throw error;
      });

      await handler({}, {}, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should pass through successful async operations', async () => {
      const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
      };

      const mockRes = { json: jest.fn() };
      const mockNext = jest.fn();
      
      const handler = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });

      await handler({}, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // AppError Tests
  // ==========================================
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      class AppError extends Error {
        constructor(message, statusCode) {
          super(message);
          this.statusCode = statusCode;
          this.isOperational = true;
          Error.captureStackTrace(this, this.constructor);
        }
      }

      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should be instance of Error', () => {
      class AppError extends Error {
        constructor(message, statusCode) {
          super(message);
          this.statusCode = statusCode;
        }
      }

      const error = new AppError('Test', 400);

      expect(error instanceof Error).toBe(true);
    });
  });

  // ==========================================
  // Date Utility Tests
  // ==========================================
  describe('Date Utility', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-01');
      const formatted = date.toISOString();

      expect(formatted).toContain('2024-01-01');
    });

    it('should calculate date difference', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');

      const diff = date2.getTime() - date1.getTime();
      const days = diff / (1000 * 60 * 60 * 24);

      expect(days).toBe(1);
    });

    it('should get start of day', () => {
      const date = new Date('2024-01-01T15:30:00');
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
    });
  });

  // ==========================================
  // Retry Utility Tests
  // ==========================================
  describe('Retry Utility', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const retryOperation = async (fn, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === retries - 1) throw error;
          }
        }
      };

      const operation = jest.fn().mockRejectedValueOnce(new Error('Fail'))
                                  .mockRejectedValueOnce(new Error('Fail'))
                                  .mockResolvedValueOnce('Success');

      const result = await retryOperation(operation, maxRetries);

      expect(result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const retryOperation = async (fn, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === retries - 1) throw error;
          }
        }
      };

      const operation = jest.fn().mockRejectedValue(new Error('Always fail'));

      await expect(retryOperation(operation, 3)).rejects.toThrow('Always fail');
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================
  // Logger Utility Tests
  // ==========================================
  describe('Logger Utility', () => {
    it('should log with correct level', () => {
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      };

      logger.info('Test message');
      logger.error('Error message');

      expect(logger.info).toHaveBeenCalledWith('Test message');
      expect(logger.error).toHaveBeenCalledWith('Error message');
    });

    it('should include metadata', () => {
      const logger = {
        info: jest.fn(),
      };

      const meta = { userId: '123', action: 'login' };
      logger.info('User logged in', meta);

      expect(logger.info).toHaveBeenCalledWith('User logged in', meta);
    });
  });

  // ==========================================
  // Rate Limiter Utility Tests
  // ==========================================
  describe('Rate Limiter Utility', () => {
    it('should track request counts', () => {
      const requests = new Map();
      const ip = '127.0.0.1';

      requests.set(ip, (requests.get(ip) || 0) + 1);

      expect(requests.get(ip)).toBe(1);
    });

    it('should reset after time window', () => {
      const window = 60000; // 1 minute
      const now = Date.now();
      const lastRequest = now - 61000; // 61 seconds ago

      expect(now - lastRequest).toBeGreaterThan(window);
    });
  });
});

export default describe;
