import APICache from '../utils/apiCache.js';

// Simple cache middleware for API responses
export const apiResponseCache = (ttl = 900) => {
  return (req, res, next) => {
    const { platform, username } = req.params;
    const cacheKey = APICache.platformKey(platform, username);
    
    // Check cache
    const cached = APICache.get(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        fromCache: true
      });
    }
    
    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200 && data.success !== false) {
        APICache.set(cacheKey, data, ttl);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};