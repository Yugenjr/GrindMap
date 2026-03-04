import Redis from 'ioredis';
import { HTTP_STATUS } from '../constants/app.constants.js';

class DistributedRateLimiter {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    
    this.isConnected = false;
    
    this.redis.on('connect', () => {
      this.isConnected = true;
    });
    
    this.redis.on('error', () => {
      this.isConnected = false;
    });
  }

  /**
   * Check rate limit using sliding window algorithm
   */
  async checkLimit(key, limit, windowMs) {
    if (!this.isConnected) {
      return { allowed: true, remaining: limit }; // Fallback when Redis unavailable
    }

    try {
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const redisKey = `rate_limit:${key}:${window}`;

      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results[0][1];

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);

      return {
        allowed,
        remaining,
        resetTime: (window + 1) * windowMs
      };
    } catch (error) {
      // Fallback on Redis error
      return { allowed: true, remaining: limit };
    }
  }

  /**
   * Distributed rate limiting middleware
   */
  createMiddleware(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100,
      keyGenerator = (req) => req.ip,
      message = 'Too many requests'
    } = options;

    return async (req, res, next) => {
      try {
        const key = keyGenerator(req);
        const result = await this.checkLimit(key, max, windowMs);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

        if (!result.allowed) {
          return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            message,
            errorCode: 'RATE_LIMIT_EXCEEDED',
            correlationId: req.correlationId
          });
        }

        next();
      } catch (error) {
        // Continue on error (fail open)
        next();
      }
    };
  }
}

export default new DistributedRateLimiter();