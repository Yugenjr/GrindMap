import Logger from './logger.js';

class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitter = options.jitter !== false;
    this.retryableErrors = options.retryableErrors || [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'NETWORK_ERROR',
      'RATE_LIMITED',
      'TIMEOUT',
      'NAVIGATION_TIMEOUT',
      'PROTOCOL_ERROR',
      'TARGET_CLOSED',
      'SESSION_CLOSED',
      'CAPTCHA_DETECTED',
      'BOT_DETECTED'
    ];
  }

  async execute(operation, context = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          Logger.info(`Operation succeeded on attempt ${attempt + 1}`, context);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries || !this.isRetryableError(error)) {
          Logger.error(`Operation failed after ${attempt + 1} attempts`, {
            ...context,
            error: error.message,
            retryable: this.isRetryableError(error)
          });
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        Logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries + 1})`, {
          ...context,
          error: error.message,
          errorCode: error.code
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  isRetryableError(error) {
    if (!error) return false;
    
    // Check error code
    if (error.code && this.retryableErrors.includes(error.code)) {
      return true;
    }
    
    // Check HTTP status codes
    if (error.response?.status) {
      const status = error.response.status;
      return status >= 500 || status === 429 || status === 408;
    }
    
    // Check error message
    const message = error.message?.toLowerCase() || '';
    return this.retryableErrors.some(retryableError => 
      message.includes(retryableError.toLowerCase())
    );
  }

  calculateDelay(attempt) {
    let delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt);
    delay = Math.min(delay, this.maxDelay);
    
    if (this.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return Math.max(delay, 0);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default RetryManager;