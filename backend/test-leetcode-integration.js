// Comprehensive integration test for LeetCode scraper
import { scrapeLeetCode } from './src/services/scraping/leetcode.scraper.js';
import ScraperErrorHandler from './src/utils/scraperErrorHandler.js';

// Mock external dependencies
jest.mock('./src/utils/apiClient.js', () => ({
  default: {
    createLeetCodeClient: () => ({
      get: jest.fn(),
      getCircuitBreakerState: jest.fn(() => ({ failures: 0, state: 'CLOSED' }))
    })
  }
}));

jest.mock('./src/utils/inputValidator.js', () => ({
  default: {
    validateUsername: jest.fn((username) => username),
    validateApiResponse: jest.fn(),
    sanitizeResponse: jest.fn((data) => data)
  }
}));

jest.mock('./src/utils/logger.js', () => ({
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('./src/utils/scraperErrorHandler.js', () => ({
  default: {
    withRetry: jest.fn(),
    createSuccessResponse: jest.fn((platform, username, data, metadata) => ({
      success: true,
      platform,
      username,
      data,
      metadata: { timestamp: new Date().toISOString(), ...metadata }
    })),
    logPerformanceMetrics: jest.fn(),
    handleCircuitBreakerError: jest.fn(() => false),
    getCachedFallback: jest.fn(),
    handleScraperError: jest.fn()
  }
}));

describe('LeetCode Scraper Integration Tests', () => {
  let mockApiClient;
  let mockInputValidator;
  let mockScraperErrorHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mock instances
    mockApiClient = require('./src/utils/apiClient.js').default.createLeetCodeClient();
    mockInputValidator = require('./src/utils/inputValidator.js').default;
    mockScraperErrorHandler = require('./src/utils/scraperErrorHandler.js').default;
  });

  describe('Successful API Response', () => {
    test('should return successful response with correct data structure', async () => {
      // Mock successful API response
      const mockResponse = {
        data: {
          totalSolved: 150,
          totalQuestions: 2000,
          easySolved: 50,
          mediumSolved: 80,
          hardSolved: 20
        },
        fromCache: false,
        fromFallback: false
      };

      mockScraperErrorHandler.withRetry.mockResolvedValue(mockResponse);
      mockScraperErrorHandler.createSuccessResponse.mockReturnValue({
        success: true,
        platform: 'LEETCODE',
        username: 'testuser',
        data: mockResponse.data,
        metadata: {
          timestamp: new Date().toISOString(),
          fromCache: false,
          fromFallback: false,
          responseTime: 500
        }
      });

      const result = await scrapeLeetCode('testuser');

      expect(result.success).toBe(true);
      expect(result.platform).toBe('LEETCODE');
      expect(result.username).toBe('testuser');
      expect(result.data.totalSolved).toBe(150);
      expect(mockScraperErrorHandler.logPerformanceMetrics).toHaveBeenCalledWith(
        'LEETCODE',
        'testuser',
        expect.any(Number),
        true,
        false
      );
    });

    test('should handle cached response correctly', async () => {
      const mockResponse = {
        data: {
          totalSolved: 100,
          totalQuestions: 2000
        },
        fromCache: true,
        fromFallback: false
      };

      mockScraperErrorHandler.withRetry.mockResolvedValue(mockResponse);

      await scrapeLeetCode('testuser');

      expect(mockScraperErrorHandler.logPerformanceMetrics).toHaveBeenCalledWith(
        'LEETCODE',
        'testuser',
        expect.any(Number),
        true,
        true // fromCache should be true
      );
    });
  });

  describe('Fallback Mechanism', () => {
    test('should use cached fallback when API fails', async () => {
      // Mock API failure
      mockScraperErrorHandler.withRetry.mockRejectedValue(new Error('API Error'));

      // Mock successful fallback
      const fallbackData = {
        totalSolved: 80,
        totalQuestions: 2000
      };
      mockScraperErrorHandler.getCachedFallback.mockResolvedValue(fallbackData);

      const result = await scrapeLeetCode('testuser');

      expect(mockScraperErrorHandler.getCachedFallback).toHaveBeenCalledWith('LEETCODE', 'testuser');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(fallbackData);
      expect(result.metadata.fromCache).toBe(true);
      expect(result.metadata.fromFallback).toBe(true);

      // Verify the fixed parameter passing
      expect(mockScraperErrorHandler.logPerformanceMetrics).toHaveBeenCalledWith(
        'LEETCODE',
        'testuser',
        expect.any(Number),
        true,
        false, // fromCache should be false for fallback
        true  // fromFallback should be true for fallback
      );
    });

    test('should handle fallback failure gracefully', async () => {
      mockScraperErrorHandler.withRetry.mockRejectedValue(new Error('API Error'));
      mockScraperErrorHandler.getCachedFallback.mockResolvedValue(null); // No fallback available

      await scrapeLeetCode('testuser');

      expect(mockScraperErrorHandler.handleScraperError).toHaveBeenCalled();
      expect(mockScraperErrorHandler.logPerformanceMetrics).toHaveBeenCalledWith(
        'LEETCODE',
        'testuser',
        expect.any(Number),
        false
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle circuit breaker errors', async () => {
      const circuitBreakerError = new Error('Circuit breaker OPEN');
      mockScraperErrorHandler.withRetry.mockRejectedValue(circuitBreakerError);
      mockScraperErrorHandler.handleCircuitBreakerError.mockReturnValue(true);

      const result = await scrapeLeetCode('testuser');

      expect(result).toBeUndefined(); // Circuit breaker returns undefined
      expect(mockScraperErrorHandler.handleCircuitBreakerError).toHaveBeenCalledWith(
        circuitBreakerError,
        'LEETCODE'
      );
    });

    test('should handle user not found errors', async () => {
      const mockResponse = {
        data: { message: 'User not found' }
      };
      mockScraperErrorHandler.withRetry.mockResolvedValue(mockResponse);

      await scrapeLeetCode('nonexistentuser');

      expect(mockScraperErrorHandler.handleScraperError).toHaveBeenCalled();
    });

    test('should handle invalid API response structure', async () => {
      const mockResponse = {
        data: null // Invalid response
      };
      mockScraperErrorHandler.withRetry.mockResolvedValue(mockResponse);

      await scrapeLeetCode('testuser');

      expect(mockScraperErrorHandler.handleScraperError).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    test('should validate username before processing', async () => {
      mockInputValidator.validateUsername.mockImplementation((username) => {
        if (username === 'invalid') {
          throw new Error('Invalid username');
        }
        return username;
      });

      await expect(scrapeLeetCode('invalid')).rejects.toThrow('Invalid username');

      expect(mockInputValidator.validateUsername).toHaveBeenCalledWith('invalid', 'LEETCODE');
    });

    test('should sanitize API response data', async () => {
      const rawData = {
        totalSolved: 150,
        totalQuestions: 2000,
        maliciousField: '<script>alert("xss")</script>'
      };
      const sanitizedData = {
        totalSolved: 150,
        totalQuestions: 2000
      };

      const mockResponse = { data: rawData };
      mockScraperErrorHandler.withRetry.mockResolvedValue(mockResponse);
      mockInputValidator.sanitizeResponse.mockReturnValue(sanitizedData);

      await scrapeLeetCode('testuser');

      expect(mockInputValidator.sanitizeResponse).toHaveBeenCalledWith(rawData);
      expect(mockInputValidator.validateApiResponse).toHaveBeenCalledWith(
        rawData,
        'LEETCODE',
        ['totalSolved', 'totalQuestions']
      );
    });
  });

  describe('Performance Metrics', () => {
    test('should log performance metrics for successful requests', async () => {
      const mockResponse = {
        data: { totalSolved: 100, totalQuestions: 2000 },
        fromCache: false
      };
      mockScraperErrorHandler.withRetry.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      await scrapeLeetCode('testuser');

      expect(mockScraperErrorHandler.logPerformanceMetrics).toHaveBeenCalledWith(
        'LEETCODE',
        'testuser',
        expect.any(Number),
        true,
        false
      );
    });

    test('should log performance metrics for failed requests', async () => {
      mockScraperErrorHandler.withRetry.mockRejectedValue(new Error('API Error'));
      mockScraperErrorHandler.getCachedFallback.mockResolvedValue(null);

      await scrapeLeetCode('testuser');

      expect(mockScraperErrorHandler.logPerformanceMetrics).toHaveBeenCalledWith(
        'LEETCODE',
        'testuser',
        expect.any(Number),
        false
      );
    });
  });
});
