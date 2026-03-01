import { createClient } from 'redis';
import Logger from './logger.js';

class AdvancedCacheManager {
  constructor() {
    this.redis = null;
    this.redisConnected = false;
    this.memoryCache = new Map();
    this.cacheStats = new Map();
    this.invalidationRules = new Map();
    this.warmupQueue = new Set();
    
    this.init();
    this.startCleanupInterval();
  }

  async init() {
    try {
      this.redis = createClient({ 
        url: process.env.REDIS_URL,
        socket: { reconnectStrategy: false }
      });
      
      this.redis.on('connect', () => {
        this.redisConnected = true;
        Logger.info('Advanced cache manager connected to Redis');
      });
      
      this.redis.on('error', () => {
        this.redisConnected = false;
      });
      
      await this.redis.connect();
    } catch (error) {
      Logger.warn('Cache manager using memory-only mode');
      this.redisConnected = false;
    }
  }

  // Multi-level cache get
  async get(key, options = {}) {
    const { useMemory = true, useRedis = true } = options;
    
    // Level 1: Memory cache (fastest)
    if (useMemory && this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (!this.isExpired(cached)) {
        this.updateStats(key, 'memory_hit');
        return cached.data;
      } else {
        this.memoryCache.delete(key);
      }
    }
    
    // Level 2: Redis cache
    if (useRedis && this.redisConnected) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          
          // Promote to memory cache
          if (useMemory) {
            this.setMemoryCache(key, data, 300); // 5 min in memory
          }
          
          this.updateStats(key, 'redis_hit');
          return data;
        }
      } catch (error) {
        Logger.warn('Redis get failed', { key, error: error.message });
      }
    }
    
    this.updateStats(key, 'miss');
    return null;
  }

  // Multi-level cache set
  async set(key, data, ttl = 900, options = {}) {
    const { 
      useMemory = true, 
      useRedis = true, 
      memoryTtl = Math.min(ttl, 300),
      tags = []
    } = options;
    
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000,
      tags
    };
    
    // Set in memory cache
    if (useMemory) {
      this.setMemoryCache(key, data, memoryTtl);
    }
    
    // Set in Redis cache
    if (useRedis && this.redisConnected) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(data));
        
        // Store tags for invalidation
        if (tags.length > 0) {
          await this.storeTags(key, tags);
        }
      } catch (error) {
        Logger.warn('Redis set failed', { key, error: error.message });
      }
    }
    
    this.updateStats(key, 'set');
    return true;
  }

  // Smart cache invalidation
  async invalidate(pattern, options = {}) {
    const { byTag = false, cascade = true } = options;
    
    if (byTag) {
      return this.invalidateByTag(pattern, cascade);
    }
    
    return this.invalidateByPattern(pattern, cascade);
  }

  async invalidateByPattern(pattern, cascade = true) {
    let invalidated = 0;
    
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (this.matchesPattern(key, pattern)) {
        this.memoryCache.delete(key);
        invalidated++;
      }
    }
    
    // Invalidate Redis cache
    if (this.redisConnected) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          invalidated += keys.length;
        }
      } catch (error) {
        Logger.warn('Redis invalidation failed', { pattern, error: error.message });
      }
    }
    
    Logger.info('Cache invalidated by pattern', { pattern, count: invalidated });
    return invalidated;
  }

  async invalidateByTag(tag, cascade = true) {
    let invalidated = 0;
    
    if (!this.redisConnected) {
      Logger.warn('Tag-based invalidation requires Redis');
      return 0;
    }
    
    try {
      const taggedKeys = await this.redis.smembers(`tag:${tag}`);
      
      for (const key of taggedKeys) {
        // Remove from memory
        this.memoryCache.delete(key);
        
        // Remove from Redis
        await this.redis.del(key);
        invalidated++;
        
        // Cascade invalidation
        if (cascade) {
          const relatedTags = await this.redis.smembers(`key_tags:${key}`);
          for (const relatedTag of relatedTags) {
            if (relatedTag !== tag) {
              await this.redis.srem(`tag:${relatedTag}`, key);
            }
          }
          await this.redis.del(`key_tags:${key}`);
        }
      }
      
      // Clean up tag set
      await this.redis.del(`tag:${tag}`);
      
    } catch (error) {
      Logger.error('Tag-based invalidation failed', { tag, error: error.message });
    }
    
    Logger.info('Cache invalidated by tag', { tag, count: invalidated });
    return invalidated;
  }

  // Cache warming
  async warmup(keys, warmupFunction) {
    Logger.info('Starting cache warmup', { count: keys.length });
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    for (const key of keys) {
      try {
        // Skip if already cached
        const existing = await this.get(key);
        if (existing) {
          results.skipped++;
          continue;
        }
        
        // Warm up the cache
        const data = await warmupFunction(key);
        if (data) {
          await this.set(key, data, 900, { tags: ['warmup'] });
          results.success++;
        } else {
          results.failed++;
        }
        
        // Prevent overwhelming the system
        await this.delay(100);
        
      } catch (error) {
        Logger.warn('Cache warmup failed for key', { key, error: error.message });
        results.failed++;
      }
    }
    
    Logger.info('Cache warmup completed', results);
    return results;
  }

  // Preload popular data
  async preload(preloadConfig) {
    const { platforms, usernames, priority = 'normal' } = preloadConfig;
    
    const keys = [];
    for (const platform of platforms) {
      for (const username of usernames) {
        keys.push(`platform:${platform}:${username}`);
      }
    }
    
    if (priority === 'high') {
      // Immediate preload
      return this.warmup(keys, this.fetchPlatformData.bind(this));
    } else {
      // Queue for background preload
      keys.forEach(key => this.warmupQueue.add(key));
      this.processWarmupQueue();
      return { queued: keys.length };
    }
  }

  // Background warmup processing
  async processWarmupQueue() {
    if (this.warmupQueue.size === 0) return;
    
    const batch = Array.from(this.warmupQueue).slice(0, 10);
    this.warmupQueue.clear();
    
    setTimeout(async () => {
      await this.warmup(batch, this.fetchPlatformData.bind(this));
      
      // Continue processing if more items
      if (this.warmupQueue.size > 0) {
        this.processWarmupQueue();
      }
    }, 5000); // 5 second delay
  }

  // Cache dependency management
  addInvalidationRule(trigger, targets) {
    if (!this.invalidationRules.has(trigger)) {
      this.invalidationRules.set(trigger, new Set());
    }
    
    targets.forEach(target => {
      this.invalidationRules.get(trigger).add(target);
    });
  }

  async triggerInvalidation(trigger) {
    const targets = this.invalidationRules.get(trigger);
    if (!targets) return 0;
    
    let totalInvalidated = 0;
    for (const target of targets) {
      const count = await this.invalidate(target);
      totalInvalidated += count;
    }
    
    Logger.info('Triggered cache invalidation', { trigger, targets: targets.size, invalidated: totalInvalidated });
    return totalInvalidated;
  }

  // Helper methods
  setMemoryCache(key, data, ttl) {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000
    });
    
    // Limit memory cache size
    if (this.memoryCache.size > 1000) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
  }

  isExpired(cached) {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  matchesPattern(key, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  async storeTags(key, tags) {
    try {
      for (const tag of tags) {
        await this.redis.sadd(`tag:${tag}`, key);
        await this.redis.sadd(`key_tags:${key}`, tag);
      }
    } catch (error) {
      Logger.warn('Failed to store cache tags', { key, tags, error: error.message });
    }
  }

  updateStats(key, operation) {
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, sets: 0 };
    
    switch (operation) {
      case 'memory_hit':
      case 'redis_hit':
        stats.hits++;
        break;
      case 'miss':
        stats.misses++;
        break;
      case 'set':
        stats.sets++;
        break;
    }
    
    this.cacheStats.set(key, stats);
  }

  startCleanupInterval() {
    setInterval(() => {
      // Clean expired memory cache entries
      for (const [key, cached] of this.memoryCache.entries()) {
        if (this.isExpired(cached)) {
          this.memoryCache.delete(key);
        }
      }
      
      // Clean old stats
      if (this.cacheStats.size > 5000) {
        const keys = Array.from(this.cacheStats.keys()).slice(0, 1000);
        keys.forEach(key => this.cacheStats.delete(key));
      }
    }, 60000); // Every minute
  }

  async fetchPlatformData(key) {
    // Extract platform and username from key
    const [, platform, username] = key.split(':');
    
    // This would call the actual scraping service
    // For now, return null to indicate no data
    return null;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      memorySize: this.memoryCache.size,
      redisConnected: this.redisConnected,
      warmupQueueSize: this.warmupQueue.size,
      invalidationRules: this.invalidationRules.size,
      totalStats: this.cacheStats.size
    };
  }
}

export default new AdvancedCacheManager();