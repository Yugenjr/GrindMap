import Logger from './logger.js';
import ErrorClassifier from './errorClassifier.js';

/**
 * RetryManager - Handles retry logic with exponential backoff
 * Follows Single Responsibility Principle for retry operations
 */
class RetryManager {
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
        if (ErrorClassifier.isNonRetryableError(error)) {
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
}

export default RetryManager;
