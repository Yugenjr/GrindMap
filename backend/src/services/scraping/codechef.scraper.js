import { puppeteerPool } from '../../utils/puppeteerPool.js';
import CircuitBreaker from '../../utils/circuitBreaker.js';
import RetryManager from '../../utils/retryManager.js';
import InputValidator from '../../utils/inputValidator.js';
import ScraperErrorHandler from '../../utils/scraperErrorHandler.js';
import Logger from '../../utils/logger.js';
import redis from '../../config/redis.js';
import PuppeteerManager from '../../utils/puppeteerManager.js';

// Create circuit breaker for CodeChef scraping
const codechefCircuitBreaker = new CircuitBreaker({
  name: 'CodeChef',
  failureThreshold: 3,
  resetTimeout: 120000 // 2 minutes for puppeteer
});

const retryManager = new RetryManager({
  maxRetries: 2,
  baseDelay: 2000,
  maxDelay: 10000
});

export async function fetchCodeChefStats(username) {
  const startTime = Date.now();
  let validatedUsername;
  
  try {
    // Validate and sanitize username
    validatedUsername = InputValidator.validateUsername(username, 'CODECHEF');
    
    Logger.debug(`Starting CodeChef scrape for user: ${validatedUsername}`);
    
    const cacheKey = `codechef:${validatedUsername}`;
    
    // Check cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        Logger.debug(`Cache hit for CodeChef user ${validatedUsername}`);
        const cachedResult = JSON.parse(cached);
        
        // Log performance metrics for cache hit
        ScraperErrorHandler.logPerformanceMetrics(
          'CodeChef',
          validatedUsername,
          startTime,
          true,
          true
        );
        
        return { ...cachedResult, fromCache: true };
      }
    } catch (error) {
      Logger.warn('Cache read error for CodeChef', { error: error.message });
    }
    
    const scrapeData = async () => {
      let page;
      let browser;
      
      try {
        browser = await puppeteerPool.getBrowser();
        page = await puppeteerPool.createPage(browser);
        
        await page.goto(`https://www.codechef.com/users/${validatedUsername}`, {
          waitUntil: 'networkidle2',
          timeout: 20000
        });
        
        // Check if user exists
        const userExists = await page.evaluate(() => {
          return !document.querySelector('.error-message, .not-found, .user-not-found');
        });
        
        if (!userExists) {
          throw new Error('User not found');
        }
        
        const stats = await Promise.race([
          page.evaluate(() => {
            const ratingElement = document.querySelector('.rating-number, .rating');
            const problemsElement = document.querySelector('.problems-solved, .problem-solved-count');
            
            return {
              rating: ratingElement ? parseInt(ratingElement.textContent) || 0 : 0,
              problemsSolved: problemsElement ? parseInt(problemsElement.textContent) || 0 : 0
            };
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Page evaluation timeout')), 15000)
          )
        ]);
        
        // Validate scraped data
        if (typeof stats.rating !== 'number' || typeof stats.problemsSolved !== 'number') {
          throw new Error('Invalid data format scraped from page');
        }
        
        return InputValidator.sanitizeResponse(stats);
      } finally {
        if (page) {
          await puppeteerPool.closePage(page);
        }
      }
    };
    
    const data = await codechefCircuitBreaker.execute(async () => {
      return await retryManager.execute(scrapeData, {
        platform: 'CodeChef',
        username: validatedUsername
      });
    });
    
    const result = ScraperErrorHandler.createSuccessResponse(
      'CODECHEF',
      validatedUsername,
      data,
      {
        responseTime: Date.now() - startTime,
        source: 'puppeteer'
      }
    );
    
    // Cache successful result
    try {
      await redis.set(cacheKey, JSON.stringify(result), 600); // 10 minutes
      // Also store as fallback with longer TTL
      await redis.set(`fallback:${cacheKey}`, JSON.stringify(result), 3600); // 1 hour
    } catch (error) {
      Logger.warn('Cache write error for CodeChef', { error: error.message });
    }
    
    // Log performance metrics
    ScraperErrorHandler.logPerformanceMetrics(
      'CodeChef',
      validatedUsername,
      startTime,
      true,
      false
    );
    
    return result;
    
  } catch (error) {
    // Handle circuit breaker errors first
    if (ScraperErrorHandler.handleCircuitBreakerError(error, 'CodeChef')) {
      return;
    }
    
    // Log performance metrics for failed requests
    ScraperErrorHandler.logPerformanceMetrics(
      'CodeChef',
      validatedUsername || username,
      startTime,
      false
    );
    
    // Try to return fallback data
    const cacheKey = `codechef:${validatedUsername || username}`;
    try {
      const fallback = await redis.get(`fallback:${cacheKey}`);
      if (fallback) {
        Logger.info(`Returning fallback data for CodeChef user ${validatedUsername}`);
        return { ...JSON.parse(fallback), fromFallback: true };
      }
    } catch (fallbackError) {
      Logger.warn('Fallback data read error', { error: fallbackError.message });
    }
    
    // Handle and standardize the error
    ScraperErrorHandler.handleScraperError(error, 'CodeChef', validatedUsername || username, {
      scrapeMethod: 'puppeteer',
      circuitBreakerState: codechefCircuitBreaker.getState()
    });
  }
}