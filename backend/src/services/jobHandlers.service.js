import { scrapeLeetCode } from '../services/scraping/leetcode.scraper.js';
import { fetchCodeforcesStats } from '../services/scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from '../services/scraping/codechef.scraper.js';
import AdvancedCacheManager from '../utils/advancedCacheManager.js';
import Job from '../models/job.model.js';
import UserQuota from '../models/userQuota.model.js';
import Logger from '../utils/logger.js';
import IntegrityJob from '../jobs/integrity.job.js';

class JobHandlers {
  // Scraping job handler
  static async handleScraping(data, job) {
    const { platform, username, userId } = data;
    
    Logger.info('Processing scraping job', { platform, username, jobId: job.id });
    
    let scraper;
    switch (platform.toLowerCase()) {
      case 'leetcode':
        scraper = scrapeLeetCode;
        break;
      case 'codeforces':
        scraper = fetchCodeforcesStats;
        break;
      case 'codechef':
        scraper = fetchCodeChefStats;
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    const result = await scraper(username);
    
    // Cache the result
    const cacheKey = `platform:${platform}:${username}`;
    await AdvancedCacheManager.set(cacheKey, result, 900, {
      tags: ['platform', platform, username, 'background_job']
    });
    
    return {
      platform,
      username,
      data: result,
      cached: true,
      timestamp: new Date().toISOString()
    };
  }

  // Cache warmup job handler
  static async handleCacheWarmup(data, job) {
    const { type, usernames = [], platforms = ['leetcode', 'codeforces'], limit = 10 } = data;
    
    Logger.info('Processing cache warmup job', { type, jobId: job.id });
    
    const results = {
      processed: 0,
      cached: 0,
      failed: 0,
      errors: []
    };
    
    if (type === 'popular_users') {
      // Warmup cache for popular users
      const popularUsers = usernames.length > 0 ? usernames : [
        'tourist', 'jiangly', 'Benq', 'ecnerwala', // Popular competitive programmers
        'lee215', 'votrubac', 'awice'
      ];
      
      for (const username of popularUsers.slice(0, limit)) {
        for (const platform of platforms) {
          try {
            results.processed++;
            
            const cacheKey = `platform:${platform}:${username}`;
            const existing = await AdvancedCacheManager.get(cacheKey);
            
            if (!existing) {
              // Add scraping job for this user
              const scrapingJob = await Job.create({
                type: 'scraping',
                data: { platform, username },
                priority: 6, // Lower priority than user requests
                tags: ['cache_warmup', platform],
                metadata: {
                  source: 'cache_warmup_job',
                  parentJobId: job.id
                }
              });
              
              results.cached++;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (error) {
            results.failed++;
            results.errors.push({
              platform,
              username,
              error: error.message
            });
          }
        }
      }
    }
    
    return results;
  }

  // Analytics job handler
  static async handleAnalytics(data, job) {
    const { type } = data;
    
    Logger.info('Processing analytics job', { type, jobId: job.id });
    
    switch (type) {
      case 'aggregate_hourly':
        return this.aggregateHourlyStats();
      case 'daily_summary':
        return this.generateDailySummary();
      default:
        throw new Error(`Unknown analytics job type: ${type}`);
    }
  }

  // Notification job handler
  static async handleNotification(data, job) {
    const { type, userId, message, title } = data;
    
    Logger.info('Processing notification job', { type, userId, jobId: job.id });
    
    // This would integrate with your notification service
    // For now, just log the notification
    const result = {
      type,
      userId,
      title,
      message,
      sent: true,
      timestamp: new Date().toISOString()
    };
    
    return result;
  }

  // Cleanup job handler
  static async handleCleanup(data, job) {
    const { type, olderThan, tables = [] } = data;
    
    Logger.info('Processing cleanup job', { type, jobId: job.id });
    
    const results = {
      type,
      cleaned: 0,
      errors: []
    };
    
    try {
      switch (type) {
        case 'cache':
          // This would be handled by the cache manager
          results.cleaned = await this.cleanupCache(olderThan);
          break;
          
        case 'database':
          results.cleaned = await this.cleanupDatabase(tables, olderThan);
          break;
          
        case 'jobs':
          results.cleaned = await this.cleanupOldJobs(olderThan);
          break;
          
        default:
          throw new Error(`Unknown cleanup type: ${type}`);
      }
    } catch (error) {
      results.errors.push(error.message);
      throw error;
    }
    
    return results;
  }

  // Export job handler
  static async handleExport(data, job) {
    const { type, userId, format = 'json', filters = {} } = data;
    
    Logger.info('Processing export job', { type, userId, format, jobId: job.id });
    
    // This would generate exports for user data
    const result = {
      type,
      userId,
      format,
      recordCount: 0,
      fileSize: 0,
      downloadUrl: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    result.recordCount = Math.floor(Math.random() * 1000) + 100;
    result.fileSize = result.recordCount * 150; // Approximate size
    result.downloadUrl = `/api/exports/${job.id}/download`;
    
    return result;
  }

  // Helper methods
  static async aggregateHourlyStats() {
    // Aggregate user quota usage for the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const stats = await UserQuota.aggregate([
      {
        $match: {
          lastActivity: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: '$tier',
          activeUsers: { $sum: 1 },
          totalRequests: { $sum: '$quotas.daily.used' },
          avgRequests: { $avg: '$quotas.daily.used' }
        }
      }
    ]);
    
    return {
      period: 'hourly',
      timestamp: new Date().toISOString(),
      stats
    };
  }

  static async generateDailySummary() {
    // Generate daily summary statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalUsers = await UserQuota.countDocuments();
    const activeUsers = await UserQuota.countDocuments({
      lastActivity: { $gte: today }
    });
    
    const jobStats = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return {
      date: today.toISOString().split('T')[0],
      users: {
        total: totalUsers,
        active: activeUsers
      },
      jobs: jobStats,
      timestamp: new Date().toISOString()
    };
  }

  static async cleanupCache(olderThan) {
    // This would be implemented by the cache manager
    Logger.info('Cache cleanup requested', { olderThan });
    return 0; // Return number of items cleaned
  }

  static async cleanupDatabase(tables, olderThan) {
    let cleaned = 0;
    
    if (tables.includes('jobs')) {
      const cutoff = new Date(Date.now() - (olderThan || 7 * 24 * 60 * 60 * 1000));
      const result = await Job.deleteMany({
        status: { $in: ['completed', 'failed'] },
        updatedAt: { $lt: cutoff }
      });
      cleaned += result.deletedCount;
    }
    
    return cleaned;
  }

  static async cleanupOldJobs(olderThan) {
    const cutoff = new Date(Date.now() - (olderThan || 24 * 60 * 60 * 1000));
    const result = await Job.deleteMany({
      status: { $in: ['completed', 'failed'] },
      updatedAt: { $lt: cutoff }
    });
    
    return result.deletedCount;
  }

  // Integrity detection job handler
  static async handleIntegrity(data, job) {
    const { type, ...options } = data;
    
    Logger.info('Processing integrity job', { type, jobId: job.id });
    
    try {
      let result;
      
      switch (type) {
        case 'check_active_users':
          result = await IntegrityJob.runIntegrityCheck(options);
          break;
          
        case 'check_tournament':
          result = await IntegrityJob.runTournamentIntegrityCheck(options.tournamentId);
          break;
          
        case 'cleanup_expired':
          result = await IntegrityJob.cleanupExpiredReports();
          break;
          
        default:
          throw new Error(`Unknown integrity job type: ${type}`);
      }
      
      Logger.info('Integrity job completed', {
        type,
        jobId: job.id,
        result
      });
      
      return result;
    } catch (error) {
      Logger.error('Integrity job failed', {
        type,
        jobId: job.id,
        error: error.message
      });
      throw error;
    }
  }
}

export default JobHandlers;