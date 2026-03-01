import AdvancedCacheManager from './advancedCacheManager.js';
import { scrapeLeetCode } from '../services/scraping/leetcode.scraper.js';
import { fetchCodeforcesStats } from '../services/scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from '../services/scraping/codechef.scraper.js';
import Logger from './logger.js';

class CacheWarmingService {
  constructor() {
    this.warmupSchedules = new Map();
    this.popularUsers = new Set();
    this.platformScrapers = {
      leetcode: scrapeLeetCode,
      codeforces: fetchCodeforcesStats,
      codechef: fetchCodeChefStats
    };
  }

  // Schedule regular cache warming
  scheduleWarmup(name, config) {
    const { 
      platforms = ['leetcode', 'codeforces', 'codechef'],
      usernames = [],
      interval = 3600000, // 1 hour
      priority = 'normal',
      enabled = true
    } = config;

    this.warmupSchedules.set(name, {
      platforms,
      usernames,
      interval,
      priority,
      enabled,
      lastRun: null,
      nextRun: Date.now() + interval
    });

    if (enabled) {
      this.startSchedule(name);
    }

    Logger.info('Cache warmup scheduled', { name, platforms, usernames: usernames.length });
  }

  startSchedule(name) {
    const schedule = this.warmupSchedules.get(name);
    if (!schedule || !schedule.enabled) return;

    const timeUntilNext = Math.max(0, schedule.nextRun - Date.now());

    setTimeout(async () => {
      await this.executeWarmup(name);
      
      // Reschedule
      schedule.nextRun = Date.now() + schedule.interval;
      this.startSchedule(name);
    }, timeUntilNext);
  }

  async executeWarmup(name) {
    const schedule = this.warmupSchedules.get(name);
    if (!schedule) return;

    Logger.info('Executing cache warmup', { name });

    const results = {
      total: 0,
      success: 0,
      failed: 0,
      cached: 0
    };

    for (const platform of schedule.platforms) {
      for (const username of schedule.usernames) {
        results.total++;
        
        try {
          const key = `platform:${platform}:${username}`;
          
          // Check if already cached
          const existing = await AdvancedCacheManager.get(key);
          if (existing) {
            results.cached++;
            continue;
          }

          // Fetch fresh data
          const scraper = this.platformScrapers[platform];
          if (!scraper) {
            results.failed++;
            continue;
          }

          const data = await scraper(username);
          if (data) {
            await AdvancedCacheManager.set(key, data, 900, {
              tags: ['warmup', platform, 'popular']
            });
            results.success++;
          } else {
            results.failed++;
          }

          // Rate limiting
          await this.delay(200);

        } catch (error) {
          Logger.warn('Cache warmup failed for user', { 
            platform, 
            username, 
            error: error.message 
          });
          results.failed++;
        }
      }
    }

    schedule.lastRun = Date.now();
    
    Logger.info('Cache warmup completed', { name, ...results });
    return results;
  }

  // Warm cache for popular users
  async warmPopularUsers() {
    const popularUsernames = [
      'tourist', 'jiangly', 'Benq', 'ecnerwala', // Codeforces
      'lee215', 'votrubac', 'awice', 'StefanPochmann', // LeetCode
      'gennady.korotkevich', 'rajat1603', 'uwi' // CodeChef
    ];

    return AdvancedCacheManager.preload({
      platforms: ['leetcode', 'codeforces', 'codechef'],
      usernames: popularUsernames,
      priority: 'high'
    });
  }

  // Predictive cache warming based on usage patterns
  async predictiveWarmup(usageStats) {
    const predictions = this.analyzePredictions(usageStats);
    
    const warmupKeys = [];
    for (const prediction of predictions) {
      if (prediction.confidence > 0.7) {
        warmupKeys.push(prediction.key);
      }
    }

    if (warmupKeys.length > 0) {
      Logger.info('Starting predictive cache warmup', { count: warmupKeys.length });
      
      return AdvancedCacheManager.warmup(warmupKeys, async (key) => {
        const [, platform, username] = key.split(':');
        const scraper = this.platformScrapers[platform];
        
        if (scraper) {
          try {
            return await scraper(username);
          } catch (error) {
            Logger.warn('Predictive warmup failed', { key, error: error.message });
            return null;
          }
        }
        return null;
      });
    }

    return { success: 0, failed: 0, skipped: 0 };
  }

  analyzePredictions(usageStats) {
    const predictions = [];
    
    // Simple prediction based on access frequency and recency
    for (const [key, stats] of Object.entries(usageStats)) {
      const frequency = stats.hits / (stats.hits + stats.misses);
      const recency = Math.max(0, 1 - (Date.now() - stats.lastAccess) / 86400000); // 24h decay
      
      const confidence = (frequency * 0.7) + (recency * 0.3);
      
      if (confidence > 0.5) {
        predictions.push({ key, confidence });
      }
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  // Cache preheating for new users
  async preheatUserCache(userId, platforms = ['leetcode', 'codeforces', 'codechef']) {
    Logger.info('Preheating cache for new user', { userId, platforms });
    
    // This would typically get user's platform usernames from database
    // For now, we'll return a placeholder
    return { preheated: 0, message: 'User cache preheating not implemented' };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSchedules() {
    const result = {};
    for (const [name, schedule] of this.warmupSchedules) {
      result[name] = {
        platforms: schedule.platforms,
        usernames: schedule.usernames.length,
        interval: schedule.interval,
        enabled: schedule.enabled,
        lastRun: schedule.lastRun,
        nextRun: schedule.nextRun
      };
    }
    return result;
  }

  // Start default warming schedules
  startDefaultSchedules() {
    // Popular users warmup
    this.scheduleWarmup('popular_users', {
      platforms: ['leetcode', 'codeforces', 'codechef'],
      usernames: ['tourist', 'jiangly', 'lee215', 'votrubac'],
      interval: 1800000, // 30 minutes
      priority: 'high'
    });

    // General warmup
    this.scheduleWarmup('general', {
      platforms: ['leetcode', 'codeforces'],
      usernames: [], // Would be populated from database
      interval: 3600000, // 1 hour
      priority: 'normal'
    });
  }
}

export default new CacheWarmingService();