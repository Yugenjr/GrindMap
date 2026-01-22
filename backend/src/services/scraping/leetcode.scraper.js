import ApiClient from '../../utils/apiClient.js';
import InputValidator from '../../utils/inputValidator.js';
import ScraperErrorHandler from '../../utils/scraperErrorHandler.js';
import Logger from '../../utils/logger.js';
import RequestManager from '../../utils/requestManager.js';

// Create LeetCode API client with circuit breaker
const leetcodeClient = ApiClient.createLeetCodeClient();

export async function scrapeLeetCode(username) {
  const startTime = Date.now();
  let validatedUsername;

  try {
    // Validate and sanitize username
    validatedUsername = InputValidator.validateUsername(username, 'LEETCODE');

    Logger.debug(`Starting LeetCode scrape for user: ${validatedUsername}`);

    // Use retry logic for the API call
    const response = await ScraperErrorHandler.withRetry(
      async () => {
        return await leetcodeClient.get(`https://leetcode-stats.tashif.codes/${validatedUsername}`, {
          cacheTTL: 300, // 5 minutes cache
          cacheKey: `leetcode:${validatedUsername}`
        });
      },
      'LeetCode',
      validatedUsername,
      { apiEndpoint: 'leetcode-stats.tashif.codes' }
    );

    // Validate API response
    InputValidator.validateApiResponse(response.data, 'LeetCode', ['totalSolved', 'totalQuestions']);

    // Sanitize response data
    const sanitizedData = InputValidator.sanitizeResponse(response.data);

    const result = ScraperErrorHandler.createSuccessResponse(
      'LEETCODE',
      validatedUsername,
      sanitizedData,
      {
        fromCache: response.fromCache,
        fromFallback: response.fromFallback,
        responseTime: Date.now() - startTime
      }
    );

    // Log performance metrics
    ScraperErrorHandler.logPerformanceMetrics(
      'LeetCode',
      validatedUsername,
      startTime,
      true,
      response.fromCache
    );

    return result;

  } catch (error) {
    // Handle circuit breaker errors first
    if (ScraperErrorHandler.handleCircuitBreakerError(error, 'LeetCode')) {
      return;
    }

    // Try to get cached data as fallback
    try {
      const cachedData = await ScraperErrorHandler.getCachedFallback('LEETCODE', validatedUsername || username);
      if (cachedData) {
        Logger.info(`Using cached fallback data for LeetCode:${validatedUsername || username}`);

        const result = ScraperErrorHandler.createSuccessResponse(
          'LEETCODE',
          validatedUsername || username,
          cachedData,
          {
            fromCache: true,
            fromFallback: true,
            responseTime: Date.now() - startTime
          }
        );

        // Log performance metrics for fallback success
        ScraperErrorHandler.logPerformanceMetrics(
          'LeetCode',
          validatedUsername || username,
          startTime,
          true,
          true
        );

        return result;
      }
    } catch (cacheError) {
      Logger.warn(`Cache fallback failed for LeetCode:${validatedUsername || username}`, {
        error: cacheError.message
      });
    }

    // Log performance metrics for failed requests
    ScraperErrorHandler.logPerformanceMetrics(
      'LeetCode',
      validatedUsername || username,
      startTime,
      false
    );

    // Handle and standardize the error
    ScraperErrorHandler.handleScraperError(error, 'LeetCode', validatedUsername || username, {
      apiEndpoint: 'leetcode-stats.tashif.codes',
      circuitBreakerState: leetcodeClient.getCircuitBreakerState()
    });
  }
}
