import Logger from './logger.js';

/**
 * ErrorClassifier - Handles error type detection and classification
 * Follows Single Responsibility Principle for error classification logic
 */
class ErrorClassifier {
  /**
   * Private helper method to check error patterns based on configuration
   */
  static #checkErrorPattern(error, config) {
    const { statusCheck, errorCodes, messagePatterns } = config;
    const status = error.response?.status;

    if (statusCheck && statusCheck(status)) return true;
    if (errorCodes && errorCodes.includes(error.code)) return true;

    const message = error.message?.toLowerCase();
    if (messagePatterns && messagePatterns.some(pattern => message?.includes(pattern))) return true;

    return false;
  }

  /**
   * Check if error is network-related
   */
  static isNetworkError(error) {
    return this.#checkErrorPattern(error, {
      statusCheck: null,
      errorCodes: ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'NETWORK_ERROR'],
      messagePatterns: ['network error', 'connection refused', 'dns lookup failed']
    });
  }

  /**
   * Check if error is rate limiting
   */
  static isRateLimitError(error) {
    return this.#checkErrorPattern(error, {
      statusCheck: (status) => status === 429,
      errorCodes: ['RATE_LIMITED'],
      messagePatterns: ['rate limit', 'too many requests']
    });
  }

  /**
   * Check if error is authentication-related
   */
  static isAuthError(error) {
    return this.#checkErrorPattern(error, {
      statusCheck: (status) => status === 401 || status === 403,
      errorCodes: [],
      messagePatterns: ['unauthorized', 'forbidden', 'authentication']
    });
  }

  /**
   * Check if error indicates user not found
   */
  static isUserNotFoundError(error) {
    return this.#checkErrorPattern(error, {
      statusCheck: (status) => status === 404,
      errorCodes: [],
      messagePatterns: ['user not found', 'profile not found', 'does not exist']
    });
  }

  /**
   * Check if error is server-related
   */
  static isServerError(error) {
    return this.#checkErrorPattern(error, {
      statusCheck: (status) => status >= 500 && status < 600,
      errorCodes: ['SERVER_ERROR'],
      messagePatterns: []
    });
  }

  /**
   * Check if error is parsing-related
   */
  static isParsingError(error) {
    return this.#checkErrorPattern(error, {
      statusCheck: null,
      errorCodes: [],
      messagePatterns: ['json', 'parse', 'invalid response', 'malformed']
    });
  }

  /**
   * Check if error is timeout-related
   */
  static isTimeoutError(error) {
    return this.#checkErrorPattern(error, {
      statusCheck: null,
      errorCodes: ['ETIMEDOUT'],
      messagePatterns: ['timeout', 'timed out']
    });
  }

  /**
   * Get error type for metrics
   */
  static getErrorType(error) {
    if (this.isNetworkError(error)) return 'network';
    if (this.isRateLimitError(error)) return 'rate_limit';
    if (this.isAuthError(error)) return 'auth';
    if (this.isUserNotFoundError(error)) return 'user_not_found';
    if (this.isServerError(error)) return 'server';
    if (this.isParsingError(error)) return 'parsing';
    if (this.isTimeoutError(error)) return 'timeout';
    return 'unknown';
  }

  /**
   * Check if error should not be retried
   */
  static isNonRetryableError(error) {
    const status = error.response?.status;
    const message = error.message?.toLowerCase();

    // Don't retry on client errors (4xx) except rate limits
    if (status >= 400 && status < 500 && status !== 429) {
      return true;
    }

    // Don't retry on authentication errors
    if (this.isAuthError(error) || this.isUserNotFoundError(error)) {
      return true;
    }

    return false;
  }
}

export default ErrorClassifier;
