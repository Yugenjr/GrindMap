import rateLimit from 'express-rate-limit';
import MongoStore from 'rate-limit-mongo';
import { HTTP_STATUS } from '../constants/app.constants.js';

/**
 * Brute force protection for login attempts
 */
export const loginLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/grindmap',
    collectionName: 'loginAttempts',
    expireTimeMs: 15 * 60 * 1000, // 15 minutes
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Use IP + email combination for more granular limiting
    return `${req.ip}:${req.body.email || 'anonymous'}`;
  },
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
    errorCode: 'LOGIN_RATE_LIMIT_EXCEEDED',
    retryAfter: 900, // 15 minutes in seconds
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Account creation rate limiter
 */
export const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per hour per IP
  message: {
    success: false,
    message: 'Too many accounts created, please try again after 1 hour',
    errorCode: 'ACCOUNT_CREATION_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600, // 1 hour in seconds
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset rate limiter
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  keyGenerator: (req) => {
    return `${req.ip}:${req.body.email || 'anonymous'}`;
  },
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour',
    errorCode: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: {
    success: false,
    message: 'Rate limit exceeded for sensitive operation',
    errorCode: 'STRICT_RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});