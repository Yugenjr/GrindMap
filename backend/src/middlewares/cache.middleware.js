import redis from '../config/redis.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

// Cache metrics
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0
};

/**
 * Cache middleware for API responses
 */
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = config.CACHE_PLATFORM_TTL,
    keyGenerator = (req) => `api:${req.method}:${req.originalUrl}`,
    skipCache = () => false
  } = options;

  return async (req, res, next) => {
    // Skip if caching disabled or condition met
    if (!config.CACHE_ENABLED || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const startTime = Date.now();

    try {
      // Try to get from cache
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        // Cache hit
        cacheStats.hits++;
        const responseTime = Date.now() - startTime;
        
        logger.info('Cache HIT', {
          key: cacheKey,
          responseTime: `${responseTime}ms`
        });

        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(JSON.parse(cachedData));
      }

      // Cache miss - continue to actual handler
      cacheStats.misses++;
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.set(cacheKey, JSON.stringify(data), ttl)
            .then(() => {
              logger.info('Response cached', {
                key: cacheKey,
                ttl: `${ttl}s`
              });
            })
            .catch(err => {
              cacheStats.errors++;
              logger.warn('Cache SET failed:', err.message);
            });
        }
        
        return originalJson.call(this, data);
      };

      next();

    } catch (error) {
      cacheStats.errors++;
      logger.warn('Cache middleware error:', error.message);
      next(); // Continue without caching
    }
  };
};

/**
 * Platform-specific cache middleware
 */
export const platformCache = cacheMiddleware({
  ttl: config.CACHE_PLATFORM_TTL,
  keyGenerator: (req) => `platform:${req.params.platform}:${req.params.username}`,
});

/**
 * User-specific cache middleware  
 */
export const userCache = cacheMiddleware({
  ttl: config.CACHE_USER_TTL,
  keyGenerator: (req) => `user:${req.params.username || req.user?.id}`,
});

/**
 * Cache invalidation helper
 */
export const invalidateCache = {
  platform: (platform, username) => {
    const pattern = `platform:${platform}:${username}`;
    return redis.del(pattern);
  },
  
  user: (username) => {
    const pattern = `user:${username}*`;
    return redis.flushPattern(pattern);
  },
  
  all: () => {
    return redis.flushPattern('*');
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) : 0;
  
  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    total,
    isConnected: redis.isConnected
  };
};

/**
 * Reset cache statistics
 */
export const resetCacheStats = () => {
  cacheStats = { hits: 0, misses: 0, errors: 0 };
};