// Standardized error response utility
export const createErrorResponse = (message, code = 'GENERAL_ERROR', statusCode = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    }
  };
};

// Standardized success response utility
export const createSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Common error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SCRAPING_FAILED: 'SCRAPING_FAILED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_PLATFORM: 'INVALID_PLATFORM'
};