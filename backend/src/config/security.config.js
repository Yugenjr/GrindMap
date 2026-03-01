/**
 * Security Configuration and Constants
 * Centralized security settings for the application
 */

// Security constants
export const SECURITY_CONFIG = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    BCRYPT_ROUNDS: 12, // Higher = more secure but slower
  },

  // JWT settings
  JWT: {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    ALGORITHM: 'HS256',
    ISSUER: 'grindmap-api',
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    SKIP_SUCCESSFUL_REQUESTS: false,
    SKIP_FAILED_REQUESTS: false,
  },

  // Rate limiting for authentication endpoints
  AUTH_RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5, // Stricter for login attempts
  },

  // Rate limiting for scraping endpoints
  SCRAPING_RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10,
  },

  // Request body size limits
  BODY_LIMIT: {
    JSON: '10mb',
    URL_ENCODED: '10mb',
    RAW: '5mb',
  },

  // CORS settings
  CORS: {
    MAX_AGE: 86400, // 24 hours
    CREDENTIALS: true,
  },

  // Session settings
  SESSION: {
    SECRET_MIN_LENGTH: 32,
    COOKIE_SECURE: process.env.NODE_ENV === 'production',
    COOKIE_HTTP_ONLY: true,
    COOKIE_SAME_SITE: 'strict',
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Input validation
  INPUT: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
    EMAIL_MAX_LENGTH: 254,
    NAME_MAX_LENGTH: 100,
    BIO_MAX_LENGTH: 500,
  },

  // Security headers
  HEADERS: {
    HSTS_MAX_AGE: 31536000, // 1 year
    CSP_DIRECTIVES: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // File upload (if applicable)
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  },

  // IP blocking
  IP_BLOCKING: {
    MAX_FAILED_ATTEMPTS: 5,
    BLOCK_DURATION: 15 * 60 * 1000, // 15 minutes
  },

  // Query complexity
  QUERY: {
    MAX_DEPTH: 5,
    MAX_COMPLEXITY: 100,
  },
};

// Dangerous patterns to detect in inputs
export const SECURITY_PATTERNS = {
  // SQL Injection patterns
  SQL_INJECTION: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|\;|\/\*|\*\/|xp_|sp_)/gi,
    /('|"|\b(OR|AND)\b\s*\d+\s*=\s*\d+)/gi,
  ],

  // NoSQL Injection patterns
  NOSQL_INJECTION: [
    /\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists/gi,
    /\{\s*\$[a-zA-Z]+\s*:/gi,
  ],

  // XSS patterns
  XSS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ],

  // Command Injection patterns
  COMMAND_INJECTION: [
    /[;&|`$()]/g,
    /\.\.\//g,
  ],

  // Path Traversal patterns
  PATH_TRAVERSAL: [
    /\.\.[\/\\]/g,
    /%2e%2e[\/\\]/gi,
  ],
};

// Sensitive data patterns (for logging redaction)
export const SENSITIVE_PATTERNS = {
  PASSWORD: /password/gi,
  TOKEN: /token|jwt|bearer/gi,
  API_KEY: /api[_-]?key|apikey/gi,
  CREDIT_CARD: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
};

// Whitelisted IPs (if needed)
export const WHITELISTED_IPS = [
  '127.0.0.1',
  '::1',
  // Add trusted IPs here
];

// Blacklisted IPs (can be populated dynamically)
export const BLACKLISTED_IPS = new Set();

// Security event types for monitoring
export const SECURITY_EVENTS = {
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  SUSPICIOUS_INPUT: 'suspicious_input',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt',
  NOSQL_INJECTION_ATTEMPT: 'nosql_injection_attempt',
  PATH_TRAVERSAL_ATTEMPT: 'path_traversal_attempt',
  COMMAND_INJECTION_ATTEMPT: 'command_injection_attempt',
};

// HTTP Security Headers
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS protection (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  
  // Remove server information
  'X-Powered-By': '', // Remove this header
};

// Allowed origins for CORS (should be configured via env)
export const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  // Default allowed origins for development
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost:3000', 'http://localhost:3001', ...origins];
  }
  
  return origins;
};

// Check if origin is allowed
export const isOriginAllowed = (origin) => {
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
};

export default SECURITY_CONFIG;
