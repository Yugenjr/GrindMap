import rateLimit from 'express-rate-limit';
import redis from '../config/redis.js';

// Memory store fallback when Redis fails
const memoryStore = new Map();

// Advanced rate limiter with bypass protection
export const advancedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  
  // Generate key using multiple factors to prevent bypass
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    const forwarded = req.get('X-Forwarded-For') || '';
    
    // Combine IP, User-Agent hash, and forwarded IPs
    return `${ip}:${Buffer.from(userAgent).toString('base64').slice(0, 10)}:${forwarded.split(',')[0]}`;
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for scraping endpoints
export const scrapingRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // only 10 scraping requests per 5 minutes
  
  keyGenerator: (req) => {
    const ip = req.ip;
    const userId = req.user?.id || 'anonymous';
    return `scraping:${ip}:${userId}`;
  },
  
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Scraping rate limit exceeded',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});