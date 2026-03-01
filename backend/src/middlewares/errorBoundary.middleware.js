import Logger from '../utils/logger.js';

// Global error boundary for unhandled async operations
export const globalErrorBoundary = () => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
    
    // Don't exit in development, log and continue
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });
    
    // Always exit on uncaught exceptions
    process.exit(1);
  });

  // Handle async operation warnings
  process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning') {
      Logger.warn('Memory leak detected', {
        name: warning.name,
        message: warning.message
      });
    }
  });
};

// Database operation wrapper with error handling
export const dbOperation = async (operation, context = '') => {
  try {
    return await operation();
  } catch (error) {
    Logger.error('Database operation failed', {
      context,
      error: error.message,
      stack: error.stack
    });
    
    // Return null instead of throwing to prevent crashes
    return null;
  }
};

// API operation wrapper with timeout and retry
export const apiOperation = async (operation, options = {}) => {
  const { timeout = 30000, retries = 2, context = '' } = options;
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ]);
    } catch (error) {
      Logger.warn('API operation failed', {
        context,
        attempt,
        error: error.message,
        willRetry: attempt <= retries
      });
      
      if (attempt > retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};