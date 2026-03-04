import { AppError, ERROR_CODES } from './appError.js';
import Logger from './logger.js';
import ErrorClassifier from './errorClassifier.js';
import RetryManager from './retryManager.js';
import ScraperResponseBuilder from './scraperResponseBuilder.js';
import ScraperMetricsLogger from './scraperMetricsLogger.js';

class ScraperErrorHandler {
  /**
   * Get error type for metrics
   */
  static getErrorType(error) {
    return ErrorClassifier.getErrorType(error);
  }

  /**
   * Check if error should not be retried
   */
  static isNonRetryableError(error) {
    return ErrorClassifier.isNonRetryableError(error);
  }

  /**
   * Calculate backoff delay for retries
   */
  static calculateBackoffDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  /**
   * Handle error with retry logic
   */
  static async withRetry(operation, platform, username, context, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || this.isNonRetryableError(error)) {
          throw error;
        }

        const delay = this.calculateBackoffDelay(attempt);
        Logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} for ${platform}:${username} after ${delay}ms delay`, {
          error: error.message,
          platform,
          username
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

export default ScraperErrorHandler;
