import { getCacheStats, resetCacheStats, invalidateCache } from '../middlewares/cache.middleware.js';
import { sendSuccess } from '../utils/response.helper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import config from '../config/env.js';

class CacheController {
  /**
   * Get cache statistics
   * @route GET /api/cache/stats
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = getCacheStats();
    sendSuccess(res, stats, 'Cache statistics retrieved');
  });

  /**
   * Reset cache statistics
   * @route POST /api/cache/reset-stats
   */
  resetStats = asyncHandler(async (req, res) => {
    resetCacheStats();
    sendSuccess(res, null, 'Cache statistics reset');
  });

  /**
   * Invalidate platform cache
   * @route DELETE /api/cache/platform/:platform/:username
   */
  invalidatePlatform = asyncHandler(async (req, res) => {
    const { platform, username } = req.params;
    await invalidateCache.platform(platform, username);
    sendSuccess(res, null, `Cache invalidated for ${platform}:${username}`);
  });

  /**
   * Invalidate user cache
   * @route DELETE /api/cache/user/:username
   */
  invalidateUser = asyncHandler(async (req, res) => {
    const { username } = req.params;
    await invalidateCache.user(username);
    sendSuccess(res, null, `Cache invalidated for user: ${username}`);
  });

  /**
   * Clear all cache
   * @route DELETE /api/cache/all
   */
  clearAll = asyncHandler(async (req, res) => {
    await invalidateCache.all();
    sendSuccess(res, null, 'All cache cleared');
  });

  /**
   * Get cache health status
   * @route GET /api/cache/health
   */
  getHealth = asyncHandler(async (req, res) => {
    const stats = getCacheStats();
    const health = {
      status: stats.isConnected ? 'healthy' : 'unhealthy',
      redis: {
        connected: stats.isConnected,
        hitRate: stats.hitRate,
        totalRequests: stats.total,
        hits: stats.hits,
        misses: stats.misses,
        errors: stats.errors
      },
      performance: {
        cacheEnabled: config.CACHE_ENABLED,
        platformTTL: `${config.CACHE_PLATFORM_TTL}s`,
        userTTL: `${config.CACHE_USER_TTL}s`
      }
    };
    
    sendSuccess(res, health, 'Cache health status retrieved');
  });
}

export default new CacheController();