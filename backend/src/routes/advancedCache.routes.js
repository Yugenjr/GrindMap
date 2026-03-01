import express from 'express';
import AdvancedCacheManager from '../utils/advancedCacheManager.js';
import CacheInvalidationEngine from '../utils/cacheInvalidationEngine.js';
import CacheWarmingService from '../utils/cacheWarmingService.js';
import { verifyJWT } from '../middlewares/jwtManager.middleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Get cache statistics
router.get('/stats', (req, res) => {
  try {
    const stats = AdvancedCacheManager.getStats();
    const warmupSchedules = CacheWarmingService.getSchedules();
    const invalidationStrategies = CacheInvalidationEngine.getStrategies();
    
    res.json({
      success: true,
      data: {
        cache: stats,
        warmup: warmupSchedules,
        invalidation: invalidationStrategies,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    Logger.error('Cache stats failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats'
    });
  }
});

// Manual cache invalidation
router.post('/invalidate', verifyJWT, async (req, res) => {
  try {
    const { pattern, tag, strategy, context = {} } = req.body;
    
    let invalidated = 0;
    
    if (strategy) {
      // Use invalidation strategy
      invalidated = await CacheInvalidationEngine.trigger(strategy, context);
    } else if (tag) {
      // Tag-based invalidation
      invalidated = await AdvancedCacheManager.invalidateByTag(tag);
    } else if (pattern) {
      // Pattern-based invalidation
      invalidated = await AdvancedCacheManager.invalidateByPattern(pattern);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Must provide pattern, tag, or strategy'
      });
    }
    
    res.json({
      success: true,
      invalidated,
      message: `Invalidated ${invalidated} cache entries`
    });
  } catch (error) {
    Logger.error('Cache invalidation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Cache invalidation failed'
    });
  }
});

// Manual cache warming
router.post('/warmup', verifyJWT, async (req, res) => {
  try {
    const { platforms = ['leetcode', 'codeforces'], usernames = [], priority = 'normal' } = req.body;
    
    if (usernames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Must provide usernames array'
      });
    }
    
    const result = await AdvancedCacheManager.preload({
      platforms,
      usernames,
      priority
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Cache warmup initiated'
    });
  } catch (error) {
    Logger.error('Cache warmup failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Cache warmup failed'
    });
  }
});

// Get cache entry
router.get('/entry/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { useMemory = true, useRedis = true } = req.query;
    
    const data = await AdvancedCacheManager.get(key, {
      useMemory: useMemory === 'true',
      useRedis: useRedis === 'true'
    });
    
    if (data) {
      res.json({
        success: true,
        data,
        cached: true
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cache entry not found',
        cached: false
      });
    }
  } catch (error) {
    Logger.error('Cache get failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get cache entry'
    });
  }
});

// Set cache entry
router.post('/entry/:key', verifyJWT, async (req, res) => {
  try {
    const { key } = req.params;
    const { data, ttl = 900, tags = [], useMemory = true, useRedis = true } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }
    
    await AdvancedCacheManager.set(key, data, ttl, {
      useMemory,
      useRedis,
      tags
    });
    
    res.json({
      success: true,
      message: 'Cache entry set successfully'
    });
  } catch (error) {
    Logger.error('Cache set failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to set cache entry'
    });
  }
});

// Trigger smart invalidation
router.post('/smart-invalidate', verifyJWT, async (req, res) => {
  try {
    const { changeType, data } = req.body;
    
    if (!changeType) {
      return res.status(400).json({
        success: false,
        error: 'changeType is required'
      });
    }
    
    const invalidated = await CacheInvalidationEngine.smartInvalidate(changeType, data || {});
    
    res.json({
      success: true,
      invalidated,
      message: `Smart invalidation completed: ${invalidated} entries`
    });
  } catch (error) {
    Logger.error('Smart invalidation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Smart invalidation failed'
    });
  }
});

// Start popular users warmup
router.post('/warmup/popular', verifyJWT, async (req, res) => {
  try {
    const result = await CacheWarmingService.warmPopularUsers();
    
    res.json({
      success: true,
      data: result,
      message: 'Popular users warmup initiated'
    });
  } catch (error) {
    Logger.error('Popular users warmup failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Popular users warmup failed'
    });
  }
});

// Cache health check
router.get('/health', (req, res) => {
  try {
    const stats = AdvancedCacheManager.getStats();
    const isHealthy = stats.memorySize < 10000; // Arbitrary health threshold
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      health: isHealthy ? 'healthy' : 'degraded',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      health: 'unhealthy',
      error: error.message
    });
  }
});

export default router;