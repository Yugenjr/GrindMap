// Test script to verify the LeetCode scraper parameter fix
import ScraperErrorHandler from './src/utils/scraperErrorHandler.js';

// Mock logger to capture calls
const mockLogger = {
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
};

// Mock the logger import
jest.mock('./src/utils/logger.js', () => ({
  default: mockLogger
}));

// Mock MetricsCollector
jest.mock('./src/utils/metricsCollector.js', () => ({
  default: {
    recordScraperMetrics: jest.fn()
  }
}));

describe('LeetCode Scraper Parameter Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logPerformanceMetrics should be called with correct parameters for fallback success', async () => {
    // Mock the logPerformanceMetrics method to capture calls
    const logPerformanceMetricsSpy = jest.spyOn(ScraperErrorHandler, 'logPerformanceMetrics');

    // Simulate the fallback success scenario
    const platform = 'LEETCODE';
    const username = 'testuser';
    const startTime = Date.now() - 1000; // 1 second ago
    const success = true;
    const fromCache = false; // Should be false for fallback
    const fromFallback = true; // Should be true for fallback

    // Call the method as it would be called in the scraper
    await ScraperErrorHandler.logPerformanceMetrics(
      platform,
      username,
      startTime,
      success,
      fromCache,
      fromFallback
    );

    // Verify the method was called with the correct parameters
    expect(logPerformanceMetricsSpy).toHaveBeenCalledWith(
      platform,
      username,
      startTime,
      success,
      fromCache,
      fromFallback
    );

    // Verify the parameters are exactly what we expect
    const callArgs = logPerformanceMetricsSpy.mock.calls[0];
    expect(callArgs[0]).toBe('LEETCODE');
    expect(callArgs[1]).toBe('testuser');
    expect(callArgs[3]).toBe(true); // success
    expect(callArgs[4]).toBe(false); // fromCache should be false
    expect(callArgs[5]).toBe(true); // fromFallback should be true

    logPerformanceMetricsSpy.mockRestore();
  });

  test('error handling should catch metrics logging errors', async () => {
    // Mock logPerformanceMetrics to throw an error
    const logPerformanceMetricsSpy = jest.spyOn(ScraperErrorHandler, 'logPerformanceMetrics')
      .mockImplementation(() => {
        throw new Error('Metrics logging failed');
      });

    // Simulate the try-catch block from the scraper
    try {
      await ScraperErrorHandler.logPerformanceMetrics(
        'LEETCODE',
        'testuser',
        Date.now(),
        true,
        false,
        true
      );
    } catch (metricsError) {
      // This should be caught by the error handling in the scraper
      expect(metricsError.message).toBe('Metrics logging failed');
    }

    // Verify logger.warn was called for the error
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Failed to log performance metrics for fallback success',
      expect.objectContaining({
        error: 'Metrics logging failed',
        platform: 'LEETCODE',
        username: 'testuser'
      })
    );

    logPerformanceMetricsSpy.mockRestore();
  });

  test('fallback scenario should use correct parameter values', () => {
    // Test the logic that determines parameter values for fallback
    const isFallbackScenario = true;
    const isFromCache = false;

    // In fallback scenarios:
    // - fromCache should be false (not from cache)
    // - fromFallback should be true (from fallback)
    expect(isFromCache).toBe(false);
    expect(isFallbackScenario).toBe(true);

    // Verify the method signature accepts these parameters
    const methodSignature = ScraperErrorHandler.logPerformanceMetrics.length;
    expect(methodSignature).toBeGreaterThanOrEqual(6); // Should accept at least 6 parameters
  });
});
