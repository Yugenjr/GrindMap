import { ERROR_CODES } from './appError.js';
import { AppError } from './appError.js';
import Logger from './logger.js';

/**
 * ScraperResponseBuilder - Handles creating standardized responses and validation
 * Follows Single Responsibility Principle for response building operations
 */
class ScraperResponseBuilder {
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
}

export default ScraperResponseBuilder;
