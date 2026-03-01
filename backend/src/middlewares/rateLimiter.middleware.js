import DistributedRateLimiter from '../utils/distributedRateLimiter.js';
import { RATE_LIMITS, HTTP_STATUS } from '../constants/app.constants.js';

/**
 * General API rate limiter using distributed Redis storage
 */
const generalLimiter = DistributedRateLimiter.createMiddleware({
  windowMs: RATE_LIMITS.GENERAL_WINDOW_MS,
  max: RATE_LIMITS.GENERAL_MAX_REQUESTS,
  keyGenerator: (req) => req.ip,
  message: 'Too many requests, please try again later'
});

/**
 * Strict rate limiter for resource-intensive scraping endpoints
 */
const scrapingLimiter = DistributedRateLimiter.createMiddleware({
  windowMs: RATE_LIMITS.SCRAPING_WINDOW_MS,
  max: RATE_LIMITS.SCRAPING_MAX_REQUESTS,
  keyGenerator: (req) => `${req.ip}:${req.params.username || 'anonymous'}`,
  message: 'Rate limit exceeded for scraping endpoints'
});

/**
 * Login rate limiter with user-specific tracking
 */
const loginLimiter = DistributedRateLimiter.createMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  keyGenerator: (req) => `login:${req.ip}:${req.body.email || 'anonymous'}`,
  message: 'Too many login attempts, please try again after 15 minutes'
});

export { generalLimiter, scrapingLimiter, loginLimiter };