import ErrorClassifier from './errorClassifier.js';

describe('ErrorClassifier', () => {
  describe('isNetworkError', () => {
    test('should return true for network error codes', () => {
      const error = { code: 'ECONNRESET' };
      expect(ErrorClassifier.isNetworkError(error)).toBe(true);
    });

    test('should return true for network error messages', () => {
      const error = { message: 'Network error occurred' };
      expect(ErrorClassifier.isNetworkError(error)).toBe(true);
    });

    test('should return false for non-network errors', () => {
      const error = { message: 'Server error' };
      expect(ErrorClassifier.isNetworkError(error)).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    test('should return true for 429 status', () => {
      const error = { response: { status: 429 } };
      expect(ErrorClassifier.isRateLimitError(error)).toBe(true);
    });

    test('should return true for rate limit messages', () => {
      const error = { message: 'Rate limit exceeded' };
      expect(ErrorClassifier.isRateLimitError(error)).toBe(true);
    });

    test('should return false for non-rate limit errors', () => {
      const error = { message: 'Server error' };
      expect(ErrorClassifier.isRateLimitError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    test('should return true for 401 status', () => {
      const error = { response: { status: 401 } };
      expect(ErrorClassifier.isAuthError(error)).toBe(true);
    });

    test('should return true for 403 status', () => {
      const error = { response: { status: 403 } };
      expect(ErrorClassifier.isAuthError(error)).toBe(true);
    });

    test('should return true for auth messages', () => {
      const error = { message: 'Unauthorized access' };
      expect(ErrorClassifier.isAuthError(error)).toBe(true);
    });

    test('should return false for non-auth errors', () => {
      const error = { message: 'Server error' };
      expect(ErrorClassifier.isAuthError(error)).toBe(false);
    });
  });

  describe('isUserNotFoundError', () => {
    test('should return true for 404 status', () => {
      const error = { response: { status: 404 } };
      expect(ErrorClassifier.isUserNotFoundError(error)).toBe(true);
    });

    test('should return true for user not found messages', () => {
      const error = { message: 'User not found' };
      expect(ErrorClassifier.isUserNotFoundError(error)).toBe(true);
    });

    test('should return false for non-404 errors', () => {
      const error = { response: { status: 500 } };
      expect(ErrorClassifier.isUserNotFoundError(error)).toBe(false);
    });
  });

  describe('isServerError', () => {
    test('should return true for 5xx status codes', () => {
      const error = { response: { status: 500 } };
      expect(ErrorClassifier.isServerError(error)).toBe(true);
    });

    test('should return true for SERVER_ERROR code', () => {
      const error = { code: 'SERVER_ERROR' };
      expect(ErrorClassifier.isServerError(error)).toBe(true);
    });

    test('should return false for 4xx status codes', () => {
      const error = { response: { status: 404 } };
      expect(ErrorClassifier.isServerError(error)).toBe(false);
    });
  });

  describe('isParsingError', () => {
    test('should return true for parsing messages', () => {
      const error = { message: 'JSON parse error' };
      expect(ErrorClassifier.isParsingError(error)).toBe(true);
    });

    test('should return false for non-parsing errors', () => {
      const error = { message: 'Server error' };
      expect(ErrorClassifier.isParsingError(error)).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    test('should return true for ETIMEDOUT code', () => {
      const error = { code: 'ETIMEDOUT' };
      expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
    });

    test('should return true for timeout messages', () => {
      const error = { message: 'Request timed out' };
      expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
    });

    test('should return false for non-timeout errors', () => {
      const error = { message: 'Server error' };
      expect(ErrorClassifier.isTimeoutError(error)).toBe(false);
    });
  });

  describe('getErrorType', () => {
    test('should return correct error types', () => {
      expect(ErrorClassifier.getErrorType({ code: 'ECONNRESET' })).toBe('network');
      expect(ErrorClassifier.getErrorType({ response: { status: 429 } })).toBe('rate_limit');
      expect(ErrorClassifier.getErrorType({ response: { status: 401 } })).toBe('auth');
      expect(ErrorClassifier.getErrorType({ response: { status: 404 } })).toBe('user_not_found');
      expect(ErrorClassifier.getErrorType({ response: { status: 500 } })).toBe('server');
      expect(ErrorClassifier.getErrorType({ message: 'JSON parse error' })).toBe('parsing');
      expect(ErrorClassifier.getErrorType({ code: 'ETIMEDOUT' })).toBe('timeout');
      expect(ErrorClassifier.getErrorType({ message: 'Unknown error' })).toBe('unknown');
    });
  });

  describe('isNonRetryableError', () => {
    test('should return true for 4xx errors except 429', () => {
      expect(ErrorClassifier.isNonRetryableError({ response: { status: 404 } })).toBe(true);
      expect(ErrorClassifier.isNonRetryableError({ response: { status: 429 } })).toBe(false);
    });

    test('should return true for auth and user not found errors', () => {
      expect(ErrorClassifier.isNonRetryableError({ response: { status: 401 } })).toBe(true);
      expect(ErrorClassifier.isNonRetryableError({ response: { status: 404 } })).toBe(true);
    });

    test('should return false for retryable errors', () => {
      expect(ErrorClassifier.isNonRetryableError({ response: { status: 500 } })).toBe(false);
      expect(ErrorClassifier.isNonRetryableError({ code: 'ECONNRESET' })).toBe(false);
    });
  });
});
