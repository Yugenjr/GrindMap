import Logger from './logger.js';

/**
 * ScraperMetricsLogger - Handles performance logging and metrics collection
 * Follows Single Responsibility Principle for metrics operations
 */
class ScraperMetricsLogger {
  /**
   * Log scraper performance metrics
   */
  static async logPerformanceMetrics(platform, username, startTime, success, fromCache = false, fromFallback = false, errorType = null) {
    const duration = Date.now() - startTime;

    Logger.info(`Scraper performance: ${platform}`, {
      username,
      duration: `${duration}ms`,
      success,
      fromCache,
      fromFallback,
      errorType,
      timestamp: new Date().toISOString()
    });

    // Log warning for slow requests
    if (duration > 10000 && !fromCache) {
      Logger.warn(`Slow scraper response: ${platform}`, {
        username,
        duration: `${duration}ms`
      });
    }

    // Record metrics
    try {
      const { default: MetricsCollector } = await import('./metricsCollector.js');
      MetricsCollector.recordScraperMetrics(platform, username, success, duration, errorType, fromCache, fromFallback);
    } catch (metricsError) {
      Logger.warn('Failed to record scraper metrics', { error: metricsError.message });
    }
  }
}

export default ScraperMetricsLogger;
