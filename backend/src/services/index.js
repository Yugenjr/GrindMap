import BatchProcessingService from './batchProcessing.service.js';
import CacheWarmingService from './cacheWarmingService.js';
import RobustJobQueue from '../utils/robustJobQueue.js';
import CronScheduler from './cronScheduler.service.js';
import ReliableJobHandlers from './reliableJobHandlers.service.js';
import HealthMonitor from '../utils/healthMonitor.js';

export const initializeServices = () => {
  // Initialize services after database connection
  BatchProcessingService.startScheduler();
  CacheWarmingService.startDefaultSchedules();

  // Register job handlers
  RobustJobQueue.registerHandler('scraping', ReliableJobHandlers.handleScraping);
  RobustJobQueue.registerHandler('cache_warmup', ReliableJobHandlers.handleCacheWarmup);
  RobustJobQueue.registerHandler('analytics', ReliableJobHandlers.handleAnalytics);
  RobustJobQueue.registerHandler('notification', ReliableJobHandlers.handleNotification);
  RobustJobQueue.registerHandler('cleanup', ReliableJobHandlers.handleCleanup);
  RobustJobQueue.registerHandler('export', ReliableJobHandlers.handleExport);

  // Start job processing
  RobustJobQueue.startProcessing({ concurrency: 3, types: [] });

  CronScheduler.start();
  HealthMonitor.startMonitoring(30000);
};
