// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Rate Limiting
export const RATE_LIMITS = {
  GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GENERAL_MAX_REQUESTS: 5, // Changed to 5
  SCRAPING_WINDOW_MS: 60 * 1000, // 1 minute
  SCRAPING_MAX_REQUESTS: 5, // Changed to 5
};

// Request Timeouts
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 seconds
  SCRAPING_REQUEST: 15000, // 15 seconds
};

// Validation Rules
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 1,
  USERNAME_MAX_LENGTH: 50,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

// Platforms
export const PLATFORMS = {
  LEETCODE: 'leetcode',
  CODEFORCES: 'codeforces',
  CODECHEF: 'codechef',
  GITHUB: 'github',
  ATCODER: 'atcoder',
  SKILLRACK: 'skillrack',
  HACKEREARTH: 'hackerearth',
  HACKERRANK: 'hackerrank',
};

// Response Messages
export const MESSAGES = {
  SUCCESS: 'Request completed successfully',
  USERNAME_REQUIRED: 'Username is required',
  INVALID_USERNAME: 'Invalid username format',
  USER_NOT_FOUND: 'User not found',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later',
  INTERNAL_ERROR: 'Internal server error',
  SCRAPING_FAILED: 'Failed to fetch data from platform',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  FORBIDDEN_ACCESS: 'Access forbidden',
  VALIDATION_FAILED: 'Validation failed',
};

// Environment
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
};

// Security Constants
export const SECURITY = {
  BCRYPT_ROUNDS: 12,
  JWT_EXPIRES_IN: '7d',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
};
