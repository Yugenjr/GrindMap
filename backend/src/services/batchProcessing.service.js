import Analytics from '../models/analytics.model.js';
import User from '../models/user.model.js';
import AnalyticsService from './analytics.service.js';
import Logger from '../utils/logger.js';
import redis from '../config/redis.js';

class BatchProcessingService {
  constructor() {
    this.isProcessing = false;
    this.batchSize = 100;
  }

  /**
   * Process historical data for all users
   */
  async processHistoricalData() {
    if (this.isProcessing) {
      Logger.warn('Batch processing already in progress');
      return;
    }

    this.isProcessing = true;
    Logger.info('Starting historical data processing');

    try {
      const users = await User.find({}, '_id').lean();
      const batches = this.createBatches(users, this.batchSize);

      for (let i = 0; i < batches.length; i++) {
        Logger.info(`Processing batch ${i + 1}/${batches.length}`);
        await this.processBatch(batches[i]);
        
        // Small delay between batches to prevent overwhelming the system
        await this.sleep(1000);
      }

      Logger.info('Historical data processing completed');
    } catch (error) {
      Logger.error('Historical data processing failed', { error: error.message });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a batch of users
   */
  async processBatch(userBatch) {
    const promises = userBatch.map(user => this.processUserData(user._id));
    await Promise.allSettled(promises);
  }

  /**
   * Process analytics for a single user
   */
  async processUserData(userId) {
    try {
      // Pre-calculate and cache analytics for different time periods
      const periods = [7, 30, 90, 365];
      
      for (const days of periods) {
        await Promise.all([
          AnalyticsService.getUserTrends(userId, days),
          AnalyticsService.getPlatformComparison(userId, days),
          AnalyticsService.getPerformanceMetrics(userId, days)
        ]);
      }

      // Calculate streak analytics
      await AnalyticsService.getStreakAnalytics(userId);

      Logger.debug(`Processed analytics for user ${userId}`);
    } catch (error) {
      Logger.error(`Failed to process user ${userId}`, { error: error.message });
    }
  }

  /**
   * Warm up analytics caches
   */
  async warmupCaches() {
    Logger.info('Starting cache warmup');

    try {
      // Warm up global leaderboard
      await AnalyticsService.getGlobalLeaderboard();
      
      // Warm up platform-specific leaderboards
      const platforms = ['LEETCODE', 'CODEFORCES', 'CODECHEF', 'ATCODER', 'GITHUB', 'SKILLRACK'];
      for (const platform of platforms) {
        await AnalyticsService.getGlobalLeaderboard(platform);
      }

      // Get active users and warm up their caches
      const activeUsers = await this.getActiveUsers(30);
      
      for (const userId of activeUsers) {
        await this.processUserData(userId);
      }

      Logger.info('Cache warmup completed');
    } catch (error) {
      Logger.error('Cache warmup failed', { error: error.message });
    }
  }

  /**
   * Get active users in the last N days
   */
  async getActiveUsers(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activeUsers = await Analytics.distinct('userId', {
      date: { $gte: startDate },
      'dailyChange.problemsSolved': { $gt: 0 }
    });

    return activeUsers;
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldData(retentionDays = 365) {
    Logger.info(`Cleaning up analytics data older than ${retentionDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await Analytics.deleteMany({
        date: { $lt: cutoffDate }
      });

      Logger.info(`Cleaned up ${result.deletedCount} old analytics records`);
    } catch (error) {
      Logger.error('Failed to cleanup old data', { error: error.message });
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport() {
    Logger.info('Generating analytics report');

    try {
      const report = {
        timestamp: new Date().toISOString(),
        totalUsers: await User.countDocuments(),
        activeUsers: {
          last7Days: (await this.getActiveUsers(7)).length,
          last30Days: (await this.getActiveUsers(30)).length,
          last90Days: (await this.getActiveUsers(90)).length
        },
        totalAnalyticsRecords: await Analytics.countDocuments(),
        platformDistribution: await this.getPlatformDistribution(),
        topPerformers: await AnalyticsService.getGlobalLeaderboard(null, 10)
      };

      // Store report in Redis with 24-hour expiry
      await redis.set('analytics:report:latest', JSON.stringify(report), 86400);

      Logger.info('Analytics report generated successfully');
      return report;
    } catch (error) {
      Logger.error('Failed to generate report', { error: error.message });
      throw error;
    }
  }

  /**
   * Get platform distribution statistics
   */
  async getPlatformDistribution() {
    const pipeline = [
      {
        $group: {
          _id: '$platform',
          totalRecords: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          avgProblems: { $avg: '$metrics.problemsSolved' }
        }
      },
      {
        $addFields: {
          platform: '$_id',
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $project: {
          _id: 0,
          platform: 1,
          totalRecords: 1,
          uniqueUserCount: 1,
          avgProblems: { $round: ['$avgProblems', 2] }
        }
      },
      { $sort: { uniqueUserCount: -1 } }
    ];

    return await Analytics.aggregate(pipeline);
  }

  /**
   * Schedule batch processing
   */
  startScheduler() {
    // Run every 4 hours
    setInterval(() => {
      this.warmupCaches();
    }, 4 * 60 * 60 * 1000);

    // Run daily cleanup at 2 AM
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        this.cleanupOldData();
        this.generateReport();
      }
    }, 60 * 1000);

    Logger.info('Batch processing scheduler started');
  }

  /**
   * Utility functions
   */
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new BatchProcessingService();