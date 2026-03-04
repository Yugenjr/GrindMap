import OptimizedCacheManager from '../utils/optimizedCache.js';

// Smart cache middleware for platform data
export const smartPlatformCache = (ttl = 900) => {
  return async (req, res, next) => {
    const { platform, username } = req.params;
    const cacheKey = OptimizedCacheManager.platformKey(platform, username);
    
    try {
      const cached = await OptimizedCacheManager.get(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          fromCache: true,
          cacheKey
        });
      }
    } catch (error) {
      console.warn('Cache read failed, proceeding without cache');
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      if (res.statusCode === 200 && data.success !== false) {
        OptimizedCacheManager.set(cacheKey, data, ttl);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Cache invalidation middleware
export const cacheInvalidation = async (req, res, next) => {
  const { username } = req.params;
  
  // Store original json method
  const originalJson = res.json;
  
  res.json = function(data) {
    // Invalidate cache after successful update
    if (res.statusCode === 200 && username) {
      OptimizedCacheManager.invalidateUser(username);
    }
    return originalJson.call(this, data);
  };
  
  next();
};