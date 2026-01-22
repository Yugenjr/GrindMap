import { AppError, ERROR_CODES } from './appError.js';
import Logger from './logger.js';

class ScraperErrorHandler {
  /**
   * Handle and standardize scraper errors
   */
  static handleScraperError(error, platform, username, context = {}) {
    const errorContext = {
      platform,
      username,
      timestamp: new Date().toISOString(),
      ...context
    };

    // Determine error type for metrics
    let errorType = this.getErrorType(error);

    // Log the original error for debugging
    Logger.error(`Scraper error for ${platform}:${username}`, {
      error: error.message,
      stack: error.stack,
      errorType,
      ...errorContext
    });

    // Determine error type and create standardized response
    if (error instanceof AppError) {
      // Already a standardized error, just re-throw
      throw error;
    }

    // Network and timeout errors
    if (this.isNetworkError(error)) {
      throw new AppError(
        `Network error while fetching ${platform} data. Please try again later.`,
        503,
        ERROR_CODES.NETWORK_ERROR,
        { ...errorContext, errorType }
      );
    }

    // Rate limiting errors
    if (this.isRateLimitError(error)) {
      throw new AppError(
        `Rate limit exceeded for ${platform}. Please wait before trying again.`,
        429,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        { ...errorContext, errorType }
      );
    }

    // Authentication/Authorization errors
    if (this.isAuthError(error)) {
      throw new AppError(
        `Authentication failed for ${platform}. Please check your credentials.`,
        401,
        ERROR_CODES.AUTHENTICATION_ERROR,
        { ...errorContext, errorType }
      );
    }

    // User not found errors
    if (this.isUserNotFoundError(error)) {
      throw new AppError(
        `User '${username}' not found on ${platform}. Please check the username.`,
        404,
        ERROR_CODES.USER_NOT_FOUND,
        { ...errorContext, errorType }
      );
    }

    // API/Server errors
    if (this.isServerError(error)) {
      throw new AppError(
        `${platform} service is temporarily unavailable. Please try again later.`,
        502,
        ERROR_CODES.EXTERNAL_API_ERROR,
        { ...errorContext, errorType }
      );
    }

    // Parsing/Data format errors
    if (this.isParsingError(error)) {
      throw new AppError(
        `Invalid data format received from ${platform}. The service may be experiencing issues.`,
        502,
        ERROR_CODES.DATA_PARSING_ERROR,
        { ...errorContext, errorType }
      );
    }

    // Timeout errors
    if (this.isTimeoutError(error)) {
      throw new AppError(
        `Request to ${platform} timed out. Please try again later.`,
        504,
        ERROR_CODES.TIMEOUT_ERROR,
        { ...errorContext, errorType }
      );
    }

    // Generic fallback error
    throw new AppError(
      `Failed to fetch data from ${platform}. Please try again later.`,
      500,
      ERROR_CODES.SCRAPING_ERROR,
      { ...errorContext, originalError: error.message, errorType }
    );
  }

  /**
   * Check if error is network-related
   */
  static isNetworkError(error) {
    const networkCodes = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'NETWORK_ERROR'];
    const networkMessages = ['network error', 'connection refused', 'dns lookup failed'];
    
    return networkCodes.includes(error.code) ||
           networkMessages.some(msg => error.message?.toLowerCase().includes(msg));
  }

  /**
   * Check if error is rate limiting
   */
  static isRateLimitError(error) {
    const status = error.response?.status;
    const message = error.message?.toLowerCase();
    
    return status === 429 ||
           error.code === 'RATE_LIMITED' ||
           message?.includes('rate limit') ||
           message?.includes('too many requests');
  }

  /**
   * Check if error is authentication-related
   */
  static isAuthError(error) {
    const status = error.response?.status;
    const message = error.message?.toLowerCase();
    
    return status === 401 ||
           status === 403 ||
           message?.includes('unauthorized') ||
           message?.includes('forbidden') ||
           message?.includes('authentication');
  }

  /**
   * Check if error indicates user not found
   */
  static isUserNotFoundError(error) {
    const status = error.response?.status;
    const message = error.message?.toLowerCase();
    
    return status === 404 ||
           message?.includes('user not found') ||
           message?.includes('profile not found') ||
           message?.includes('does not exist');
  }

  /**
   * Check if error is server-related
   */
  static isServerError(error) {
    const status = error.response?.status;
    
    return (status >= 500 && status < 600) ||
           error.code === 'SERVER_ERROR';
  }

  /**
   * Check if error is parsing-related
   */
  static isParsingError(error) {
    const message = error.message?.toLowerCase();
    
    return message?.includes('json') ||
           message?.includes('parse') ||
           message?.includes('invalid response') ||
           message?.includes('malformed');
  }

  /**
   * Check if error is timeout-related
   */
  static isTimeoutError(error) {
    const message = error.message?.toLowerCase();

    return error.code === 'ETIMEDOUT' ||
           message?.includes('timeout') ||
           message?.includes('timed out');
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
   * Create standardized success response
   */
  static createSuccessResponse(platform, username, data, metadata = {}) {
    return {
      success: true,
      platform,
      username,
      data: data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'scraper',
        ...metadata
      }
    };
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(platform, username, error, metadata = {}) {
    return {
      success: false,
      platform,
      username,
      error: {
        message: error.message,
        code: error.code || ERROR_CODES.SCRAPING_ERROR,
        statusCode: error.statusCode || 500
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'scraper',
        ...metadata
      }
    };
  }

  /**
   * Validate scraper response format
   */
  static validateScraperResponse(response, platform) {
    if (!response) {
      throw new AppError(
        `Empty response from ${platform} scraper`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }

    if (typeof response !== 'object') {
      throw new AppError(
        `Invalid response format from ${platform} scraper`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }

    // Check required fields
    const requiredFields = ['platform', 'username'];
    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new AppError(
          `Missing required field '${field}' in ${platform} scraper response`,
          500,
          ERROR_CODES.SCRAPING_ERROR
        );
      }
    }

    return true;
  }

  /**
   * Handle circuit breaker errors
   */
  static handleCircuitBreakerError(error, platform) {
    if (error.message?.includes('Circuit breaker') && error.message?.includes('OPEN')) {
      throw new AppError(
        `${platform} service is temporarily unavailable due to repeated failures. Please try again in a few minutes.`,
        503,
        ERROR_CODES.SERVICE_UNAVAILABLE,
        { circuitBreakerOpen: true }
      );
    }
    
    return false;
  }

  /**
   * Retry logic with exponential backoff
   */
  static async withRetry(operation, platform, username, context = {}, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          Logger.warn(`Retrying ${platform} request for ${username} (attempt ${attempt + 1}/${maxRetries + 1})`, {
            delay: `${delay}ms`,
            error: error.message,
            ...context
          });

          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  static calculateBackoffDelay(attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Sleep utility
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  /**
   * Get cached fallback data
   */
  static async getCachedFallback(platform, username) {
    try {
      // Import cache manager dynamically to avoid circular dependencies
      const { default: cacheManager } = await import('./cacheManager.js');

      const cacheKey = `${platform.toLowerCase()}:${username}`;
      const cached = await cacheManager.get(cacheKey);

      if (cached && cached.data) {
        // Check if cache is not too old (allow up to 24 hours for fallback)
        const cacheAge = Date.now() - (cached.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < maxAge) {
          return cached.data;
        }
      }
    } catch (error) {
      Logger.warn(`Failed to retrieve cached fallback for ${platform}:${username}`, {
        error: error.message
      });
    }

    return null;
  }

  /**
   * Log scraper performance metrics
   */
  static async logPerformanceMetrics(platform, username, startTime, success, fromCache = false, fromFallback = false, errorType = null) {
    const duration = Date.now() - startTime;

    Logger.info(`Scraper performance: ${platform}`, {
      username,
      duration: `${duration}ms`,
      success,
      fromCache,
      fromFallback,
      errorType,
      timestamp: new Date().toISOString()
    });

    // Log warning for slow requests
    if (duration > 10000 && !fromCache) {
      Logger.warn(`Slow scraper response: ${platform}`, {
        username,
        duration: `${duration}ms`
      });
    }

    // Record metrics
    try {
      const { default: MetricsCollector } = await import('./metricsCollector.js');
      MetricsCollector.recordScraperMetrics(platform, username, success, duration, errorType, fromCache, fromFallback);
    } catch (metricsError) {
      Logger.warn('Failed to record scraper metrics', { error: metricsError.message });
    }
  }
}

export default ScraperErrorHandler;