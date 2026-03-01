import rateLimit from 'express-rate-limit';
import { SECURITY_CONFIG } from '../config/security.config.js';
import { logSecurityEvent } from '../utils/logger.util.js';
import { ERROR_CODES } from '../utils/response.util.js';

// Store for tracking rate limit violations
const rateLimitViolations = new Map();

/**
 * Custom key generator for rate limiting
 */
const customKeyGenerator = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user?.id || 'anonymous';
  return `${ip}:${userId}`;
};

/**
 * Handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  const key = customKeyGenerator(req);
  const violations = rateLimitViolations.get(key) || 0;
  rateLimitViolations.set(key, violations + 1);

  logSecurityEvent({
    type: 'RATE_LIMIT_EXCEEDED',
    ip: req.ip,
    userId: req.user?.id,
    url: req.originalUrl,
    violations: violations + 1,
    userAgent: req.get('user-agent'),
  });

  // Increase block time for repeated violations
  const blockMinutes = Math.min(15 * Math.pow(2, violations), 1440); // Max 24 hours

  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryAfter: `${blockMinutes} minutes`,
      violations: violations + 1,
    },
  });
};

/**
 * Skip rate limiting for successful requests (configurable)
 */
const skipSuccessfulRequests = (req, res) => {
  return res.statusCode < 400;
};

// General API rate limit - applies to most endpoints
const generalLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.AUTH_RATE_LIMIT.WINDOW_MS,
  max: SECURITY_CONFIG.AUTH_RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  handler: (req, res) => {
    logSecurityEvent({
      type: 'AUTH_RATE_LIMIT_EXCEEDED',
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('user-agent'),
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Your IP has been temporarily blocked.',
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        retryAfter: '15 minutes',
        note: 'Repeated violations may result in longer block times',
      },
    });
  },
  skipSuccessfulRequests: false, // Count all attempts for auth
});

// Strict rate limit for scraping endpoints
const scrapingLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.SCRAPING_RATE_LIMIT.WINDOW_MS,
  max: SECURITY_CONFIG.SCRAPING_RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: {
      message: 'Rate limit exceeded for scraping endpoints',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryAfter: '1 minute'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Combine IP and username for scraping
    const ip = req.ip || req.connection.remoteAddress;
    const username = req.params.username || 'unknown';
    return `${ip}:scrape:${username}`;
  },
  handler: (req, res) => {
    logSecurityEvent({
      type: 'SCRAPING_RATE_LIMIT_EXCEEDED',
      ip: req.ip,
      username: req.params.username,
      platform: req.params.platform || 'unknown',
      url: req.originalUrl,
    });

    res.status(429).json({
      success: false,
      message: 'Scraping rate limit exceeded',
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        retryAfter: '1 minute',
        note: 'Please wait before requesting more data',
      },
    });
  },
});

// Very strict rate limit for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 attempts per hour
  message: {
    success: false,
    error: {
      message: 'Too many password reset attempts',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryAfter: '1 hour'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  skipSuccessfulRequests: false,
});

// Rate limit for registration
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    success: false,
    error: {
      message: 'Too many accounts created from this IP',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryAfter: '1 hour'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Export individual limiters
export {
  generalLimiter,
  authLimiter,
  scrapingLimiter,
  passwordResetLimiter,
  registrationLimiter,
};

// Clean up old violations periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of rateLimitViolations.entries()) {
    if (now - timestamp > 24 * 60 * 60 * 1000) { // 24 hours
      rateLimitViolations.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour