/**
 * Standard API Response Utility
 * Provides consistent response formatting across all endpoints
 */

/**
 * Send a standardized success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Optional metadata (pagination, timestamps, etc.)
 */
export const sendSuccess = (res, { statusCode = 200, message, data = null, meta = null }) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} error - Optional error details
 */
export const sendError = (res, { statusCode = 500, message, error = null }) => {
  const response = {
    success: false,
    message,
    ...(error !== null && { error }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Helper function for paginated responses
 * @param {Array} data - Array of data items
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 */
export const paginatedResponse = (data, page, limit, total) => {
  return {
    data,
    meta: {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    },
  };
};

/**
 * Response status messages
 */
export const RESPONSE_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  
  // User
  PROFILE_FETCH_SUCCESS: 'Profile fetched successfully',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
  USER_DELETE_SUCCESS: 'User deleted successfully',
  
  // Scraping
  SCRAPE_SUCCESS: 'Platform scraped successfully',
  SCRAPE_ALL_SUCCESS: 'All platforms scraped successfully',
  SCRAPE_STATUS_SUCCESS: 'Scrape status fetched successfully',
  
  // Generic
  OPERATION_SUCCESS: 'Operation completed successfully',
  FETCH_SUCCESS: 'Data fetched successfully',
  CREATE_SUCCESS: 'Resource created successfully',
  UPDATE_SUCCESS: 'Resource updated successfully',
  DELETE_SUCCESS: 'Resource deleted successfully',
};

/**
 * Error codes for consistent error handling
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Scraping
  SCRAPE_FAILED: 'SCRAPE_FAILED',
  PLATFORM_NOT_FOUND: 'PLATFORM_NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Generic
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
};
