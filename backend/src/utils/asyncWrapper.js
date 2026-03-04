import Logger from './logger.js';
import { AppError } from './appError.js';

/**
 * Async error wrapper for middleware functions
 * Catches async errors and passes them to error handler
 */
export const asyncMiddleware = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Timeout wrapper for async operations
 */
export const withTimeout = (fn, timeoutMs = 30000) => {
  return async (req, res, next) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    try {
      await Promise.race([
        Promise.resolve(fn(req, res, next)),
        timeoutPromise
      ]);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Generic async error wrapper for any async function
 * Provides consistent error handling, logging, and error transformation
 * @param {Function} fn - The async function to wrap
 * @param {Object} options - Configuration options
 * @param {string} options.context - Context for logging (e.g., 'cacheManager.get')
 * @param {boolean} options.logErrors - Whether to log errors (default: true)
 * @param {Function} options.errorTransformer - Function to transform errors before re-throwing
 * @param {boolean} options.returnNullOnError - Return null instead of throwing on error
 * @returns {Function} Wrapped async function
 */
export const asyncWrapper = (fn, options = {}) => {
  const {
    context = 'asyncWrapper',
    logErrors = true,
    errorTransformer = null,
    returnNullOnError = false
  } = options;

  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (logErrors) {
        Logger.error(`Async operation failed in ${context}`, {
          error: error.message,
          stack: error.stack,
          args: args.length > 0 ? JSON.stringify(args).substring(0, 500) : undefined
        });
      }

      if (returnNullOnError) {
        return null;
      }

      if (errorTransformer) {
        throw errorTransformer(error);
      }

      // If it's already an AppError, re-throw as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unknown errors in AppError for consistency
      throw new AppError(
        `Operation failed: ${error.message}`,
        500,
        'ASYNC_OPERATION_ERROR',
        { originalError: error.message, context }
      );
    }
  };
};

/**
 * Async retry wrapper with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {string} options.context - Context for logging
 * @returns {Function} Wrapped async function with retry logic
 */
export const withRetry = (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    context = 'withRetry'
  } = options;

  return async (...args) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          Logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} failed in ${context}, retrying in ${delay}ms`, {
            error: error.message
          });

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    Logger.error(`All retry attempts failed in ${context}`, {
      error: lastError.message,
      attempts: maxRetries + 1
    });

    throw lastError;
  };
};

/**
 * Circuit breaker wrapper for async operations
 * @param {Function} fn - The async function to protect
 * @param {Object} options - Circuit breaker options
 * @param {string} options.context - Context for logging
 * @param {number} options.failureThreshold - Failures before opening circuit (default: 5)
 * @param {number} options.recoveryTimeout - Time in ms to wait before trying again (default: 60000)
 * @returns {Function} Wrapped async function with circuit breaker
 */
export const withCircuitBreaker = (fn, options = {}) => {
  const {
    context = 'circuitBreaker',
    failureThreshold = 5,
    recoveryTimeout = 60000
  } = options;

  let failures = 0;
  let lastFailureTime = 0;
  let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

  return async (...args) => {
    const now = Date.now();

    if (state === 'OPEN') {
      if (now - lastFailureTime < recoveryTimeout) {
        throw new AppError(
          `Circuit breaker is OPEN for ${context}`,
          503,
          'CIRCUIT_BREAKER_OPEN'
        );
      }
      state = 'HALF_OPEN';
    }

    try {
      const result = await fn(...args);

      if (state === 'HALF_OPEN') {
        state = 'CLOSED';
        failures = 0;
        Logger.info(`Circuit breaker CLOSED for ${context}`);
      }

      return result;
    } catch (error) {
      failures++;
      lastFailureTime = now;

      if (failures >= failureThreshold) {
        state = 'OPEN';
        Logger.warn(`Circuit breaker OPENED for ${context} after ${failures} failures`);
      }

      throw error;
    }
  };
};
