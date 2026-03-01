import AdvancedCacheManager from './advancedCacheManager.js';
import Logger from './logger.js';

class CacheInvalidationEngine {
  constructor() {
    this.strategies = new Map();
    this.setupDefaultStrategies();
  }

  setupDefaultStrategies() {
    // Platform data invalidation
    this.addStrategy('platform_update', {
      pattern: 'platform:*:{{username}}',
      cascade: true,
      delay: 0
    });

    // User profile invalidation
    this.addStrategy('user_update', {
      pattern: 'user:{{userId}}:*',
      cascade: true,
      delay: 0
    });

    // Time-based invalidation
    this.addStrategy('daily_cleanup', {
      pattern: 'daily:*',
      cascade: false,
      delay: 0,
      schedule: '0 0 * * *' // Daily at midnight
    });

    // Analytics invalidation
    this.addStrategy('analytics_update', {
      tags: ['analytics', 'stats'],
      cascade: true,
      delay: 300000 // 5 minutes delay
    });
  }

  addStrategy(name, config) {
    this.strategies.set(name, {
      ...config,
      lastTriggered: null,
      triggerCount: 0
    });
  }

  async trigger(strategyName, context = {}) {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      Logger.warn('Unknown invalidation strategy', { strategy: strategyName });
      return 0;
    }

    // Apply delay if configured
    if (strategy.delay > 0) {
      setTimeout(() => this.executeStrategy(strategy, context), strategy.delay);
      Logger.info('Scheduled delayed cache invalidation', { 
        strategy: strategyName, 
        delay: strategy.delay 
      });
      return 0;
    }

    return this.executeStrategy(strategy, context);
  }

  async executeStrategy(strategy, context) {
    let invalidated = 0;

    try {
      if (strategy.pattern) {
        // Pattern-based invalidation
        const pattern = this.interpolatePattern(strategy.pattern, context);
        invalidated = await AdvancedCacheManager.invalidateByPattern(pattern, strategy.cascade);
      } else if (strategy.tags) {
        // Tag-based invalidation
        for (const tag of strategy.tags) {
          const count = await AdvancedCacheManager.invalidateByTag(tag, strategy.cascade);
          invalidated += count;
        }
      }

      // Update strategy stats
      strategy.lastTriggered = Date.now();
      strategy.triggerCount++;

      Logger.info('Cache invalidation strategy executed', {
        strategy: strategy.name,
        invalidated,
        context
      });

    } catch (error) {
      Logger.error('Cache invalidation strategy failed', {
        strategy: strategy.name,
        error: error.message,
        context
      });
    }

    return invalidated;
  }

  interpolatePattern(pattern, context) {
    let result = pattern;
    
    for (const [key, value] of Object.entries(context)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    return result;
  }

  // Smart invalidation based on data changes
  async smartInvalidate(changeType, data) {
    const strategies = [];

    switch (changeType) {
      case 'platform_data_updated':
        strategies.push({
          name: 'platform_update',
          context: { username: data.username, platform: data.platform }
        });
        break;

      case 'user_profile_updated':
        strategies.push({
          name: 'user_update',
          context: { userId: data.userId }
        });
        break;

      case 'new_submission':
        strategies.push({
          name: 'platform_update',
          context: { username: data.username, platform: data.platform }
        });
        strategies.push({
          name: 'analytics_update',
          context: { userId: data.userId }
        });
        break;

      case 'daily_reset':
        strategies.push({
          name: 'daily_cleanup',
          context: {}
        });
        break;
    }

    let totalInvalidated = 0;
    for (const { name, context } of strategies) {
      const count = await this.trigger(name, context);
      totalInvalidated += count;
    }

    return totalInvalidated;
  }

  getStrategies() {
    const result = {};
    for (const [name, strategy] of this.strategies) {
      result[name] = {
        pattern: strategy.pattern,
        tags: strategy.tags,
        cascade: strategy.cascade,
        delay: strategy.delay,
        lastTriggered: strategy.lastTriggered,
        triggerCount: strategy.triggerCount
      };
    }
    return result;
  }
}

export default new CacheInvalidationEngine();