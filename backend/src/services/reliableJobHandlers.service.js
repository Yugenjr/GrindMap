import Logger from '../utils/logger.js';
import OptimizedCacheManager from '../utils/optimizedCache.js';

class ReliableJobHandlers {
  // Scraping job handler
  static async handleScraping(data) {
    const { platform, username, userId } = data;
    
    try {
      Logger.info('Starting scraping job', { platform, username });
      
      // Import platform service dynamically to avoid circular deps
      const { default: PlatformService } = await import('../services/platform.service.js');
      const platformService = new PlatformService();
      
      let result;
      switch (platform.toLowerCase()) {
        case 'leetcode':
          result = await platformService.fetchLeetCodeData(username, userId);
          break;
        case 'codeforces':
          result = await platformService.fetchCodeforcesData(username, userId);
          break;
        case 'codechef':
          result = await platformService.fetchCodeChefData(username, userId);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
      
      Logger.info('Scraping job completed', { platform, username, cached: result.fromCache });
      return result;
    } catch (error) {
      Logger.error('Scraping job failed', { platform, username, error: error.message });
      throw error;
    }
  }

  // Cache warmup job handler
  static async handleCacheWarmup(data) {
    const { keys, type } = data;
    
    try {
      Logger.info('Starting cache warmup job', { type, keyCount: keys?.length });
      
      if (type === 'platform' && keys) {
        for (const key of keys) {
          const { platform, username } = key;
          await this.handleScraping({ platform, username });
          
          // Small delay to prevent overwhelming external APIs
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      Logger.info('Cache warmup job completed', { type, keyCount: keys?.length });
    } catch (error) {
      Logger.error('Cache warmup job failed', { type, error: error.message });
      throw error;
    }
  }

  // Notification job handler
  static async handleNotification(data) {
    const { userId, type, title, message, metadata } = data;
    
    try {
      Logger.info('Starting notification job', { userId, type });
      
      // Import notification service dynamically
      const { default: NotificationService } = await import('../services/notification.service.js');
      
      await NotificationService.createNotification(userId, type, title, message, metadata);
      
      Logger.info('Notification job completed', { userId, type });
    } catch (error) {
      Logger.error('Notification job failed', { userId, type, error: error.message });
      throw error;
    }
  }

  // Analytics job handler
  static async handleAnalytics(data) {
    const { userId, event, properties } = data;
    
    try {
      Logger.info('Starting analytics job', { userId, event });
      
      // Import analytics service dynamically
      const { default: AnalyticsService } = await import('../services/analytics.service.js');
      
      await AnalyticsService.trackEvent(userId, event, properties);
      
      Logger.info('Analytics job completed', { userId, event });
    } catch (error) {
      Logger.error('Analytics job failed', { userId, event, error: error.message });
      throw error;
    }
  }

  // Cleanup job handler
  static async handleCleanup(data) {
    const { type, olderThan } = data;
    
    try {
      Logger.info('Starting cleanup job', { type, olderThan });
      
      if (type === 'cache') {
        await OptimizedCacheManager.invalidateByType('expired');
      }
      
      Logger.info('Cleanup job completed', { type });
    } catch (error) {
      Logger.error('Cleanup job failed', { type, error: error.message });
      throw error;
    }
  }
}

export default ReliableJobHandlers;