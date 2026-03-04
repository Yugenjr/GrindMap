import InputValidator from '../../utils/inputValidator.js';
import ScraperErrorHandler from '../../utils/scraperErrorHandler.js';
import Logger from '../../utils/logger.js';

/**
 * Base scraper class that encapsulates common scraping workflow
 * Platform-specific scrapers should extend this class and implement abstract methods
 */
class BaseScraper {
  constructor(platform, options = {}) {
    this.platform = platform.toUpperCase();
    this.options = {
      enableRetry: true,
      enableFallback: true,
      cacheTTL: 300, // 5 minutes default
      ...options
    };
  }

  /**
   * Main scraping method that implements the common workflow
   */
  async scrape(username) {
    const startTime = Date.now();
    let validatedUsername;

    try {
      // Validate and sanitize username
      validatedUsername = InputValidator.validateUsername(username, this.platform);

      Logger.debug(`Starting ${this.platform} scrape for user: ${validatedUsername}`);

      // Execute the platform-specific scraping logic
      const response = await this._executeScrape(validatedUsername);

      // Validate the response
      this._validateResponse(response.data);

      // Sanitize response data
      const sanitizedData = InputValidator.sanitizeResponse(response.data);

      // Create success response
      const result = ScraperErrorHandler.createSuccessResponse(
        this.platform,
        validatedUsername,
        sanitizedData,
        {
          fromCache: response.fromCache,
          fromFallback: response.fromFallback,
          responseTime: Date.now() - startTime,
          ...response.metadata
        }
      );

      // Log performance metrics
      ScraperErrorHandler.logPerformanceMetrics(
        this.platform,
        validatedUsername,
        startTime,
        true,
        response.fromCache
      );

      return result;

    } catch (error) {
      return await this._handleError(error, validatedUsername || username, startTime);
    }
  }

  /**
   * Execute the platform-specific scraping logic
   * Should be implemented by subclasses
   */
  async _executeScrape(validatedUsername) {
    throw new Error('_executeScrape must be implemented by subclass');
  }

  /**
   * Validate the platform-specific response
   * Should be implemented by subclasses
   */
  _validateResponse(data) {
    throw new Error('_validateResponse must be implemented by subclass');
  }

  /**
   * Handle errors with fallback logic
   */
  async _handleError(error, username, startTime) {
    // Handle circuit breaker errors first
    if (ScraperErrorHandler.handleCircuitBreakerError(error, this.platform)) {
      return;
    }

    // Try to get cached fallback data if enabled
    if (this.options.enableFallback) {
      try {
        const cachedData = await ScraperErrorHandler.getCachedFallback(this.platform, username);
        if (cachedData) {
          Logger.info(`Using cached fallback data for ${this.platform}:${username}`);

          const result = ScraperErrorHandler.createSuccessResponse(
            this.platform,
            username,
            cachedData,
            {
              fromCache: true,
              fromFallback: true,
              responseTime: Date.now() - startTime
            }
          );

          // Log performance metrics for fallback success
          try {
            ScraperErrorHandler.logPerformanceMetrics(
              this.platform,
              username,
              startTime,
              true,
              false,
              true
            );
          } catch (metricsError) {
            Logger.warn('Failed to log performance metrics for fallback success', {
              error: metricsError.message,
              platform: this.platform,
              username
            });
          }

          return result;
        }
      } catch (cacheError) {
        Logger.warn(`Cache fallback failed for ${this.platform}:${username}`, {
          error: cacheError.message
        });
      }
    }

    // Log performance metrics for failed requests
    ScraperErrorHandler.logPerformanceMetrics(
      this.platform,
      username,
      startTime,
      false
    );

    // Handle and standardize the error
    ScraperErrorHandler.handleScraperError(error, this.platform, username, this._getErrorContext());
  }

  /**
   * Get platform-specific error context
   * Can be overridden by subclasses
   */
  _getErrorContext() {
    return {};
  }

  /**
   * Create cache key for the platform
   */
  _getCacheKey(username) {
    return `${this.platform.toLowerCase()}:${username}`;
  }

  /**
   * Execute operation with retry logic if enabled
   */
  async _withRetry(operation, username, context = {}) {
    if (this.options.enableRetry) {
      return await ScraperErrorHandler.withRetry(
        operation,
        this.platform,
        username,
        context
      );
    } else {
      return await operation();
    }
  }
}

export default BaseScraper;
