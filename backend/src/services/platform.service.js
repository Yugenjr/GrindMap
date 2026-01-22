import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '../utils/standardResponse.js';
import { scrapeLeetCode } from './scraping/leetcode.scraper.js';
import { fetchCodeforcesStats } from './scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from './scraping/codechef.scraper.js';
import { fetchAtCoderStats } from './scraping/atcoder.scraper.js';
import { scrapeGitHub } from './scraping/github.scraper.js';
import { fetchSkillRackStats } from './scraping/skillrack.scraper.js';
import { normalizeCodeforces } from './normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from './normalization/codechef.normalizer.js';
import { scrapeHackerRank } from './scraping/hackerrank.scraper.js';
import { normalizeHackerRank } from './normalization/hackerrank.normalizer.js';
import { PLATFORMS, MESSAGES } from '../constants/app.constants.js';
import { AppError, ERROR_CODES } from '../utils/appError.js';
import APICache from '../utils/apiCache.js';
import config from '../config/env.js';
import DataChangeEmitter from '../utils/dataChangeEmitter.js';
import NotificationService from './notification.service.js';

/**
 * Platform scraping service - handles all platform data fetching
 * NO DIRECT SERVICE DEPENDENCIES - uses DI container
 */
class PlatformService {
  constructor(container = null) {
    this.container = container;
  }

  /**
   * Fetch user data from LeetCode with caching and real-time updates
   */
  async fetchLeetCodeData(username, userId = null) {
    const cacheKey = APICache.platformKey('leetcode', username);
    
    // Check cache first
    const cached = APICache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const scraperResult = await scrapeLeetCode(username);
      const result = {
        platform: PLATFORMS.LEETCODE,
        username,
        ...scraperResult,
      };
      
      // Cache for 15 minutes
      APICache.set(cacheKey, result, 900);
      
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.LEETCODE, username, result, userId);
      }

      return result;
    } catch (error) {
      throw createErrorResponse(
        `Failed to fetch LeetCode data: ${error.message}`,
        ERROR_CODES.SCRAPING_FAILED,
        500
      );
    }
  }

  async fetchCodeforcesData(username, userId = null) {
    const cacheKey = APICache.platformKey('codeforces', username);
    
    const cached = APICache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const rawData = await fetchCodeforcesStats(username);
      const normalizedData = normalizeCodeforces({ ...rawData, username });

      const result = {
        platform: PLATFORMS.CODEFORCES,
        username,
        ...normalizedData,
      };
      
      APICache.set(cacheKey, result, 900);
      
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.CODEFORCES, username, result, userId);
      }

      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: Codeforces - ${error.message}`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  async fetchCodeChefData(username, userId = null) {
    const cacheKey = APICache.platformKey('codechef', username);
    
    const cached = APICache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const rawData = await fetchCodeChefStats(username);
      const normalizedData = normalizeCodeChef({ ...rawData, username });

      const result = {
        platform: PLATFORMS.CODECHEF,
        username,
        ...normalizedData,
      };
      
      APICache.set(cacheKey, result, 900);
      
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.CODECHEF, username, result, userId);
      }

      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: CodeChef - ${error.message}`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from AtCoder with caching and real-time updates
   */
  async fetchAtCoderData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.ATCODER}:${username}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const data = await fetchAtCoderStats(username);
      const result = {
        platform: PLATFORMS.ATCODER,
        username,
        ...data,
      };

      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);

      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.ATCODER, username, result, userId);
      }

      return result;
    } catch (error) {
      throw new AppError(`${MESSAGES.SCRAPING_FAILED}: AtCoder`, 500, ERROR_CODES.SCRAPING_ERROR);
    }
  }

  /**
   * Fetch user data from GitHub with caching and real-time updates
   */
  async fetchGitHubData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.GITHUB}:${username}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const data = await scrapeGitHub(username);
      const result = {
        platform: PLATFORMS.GITHUB,
        username,
        ...data,
      };

      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);

      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.GITHUB, username, result, userId);
      }

      return result;
    } catch (error) {
      throw new AppError(`${MESSAGES.SCRAPING_FAILED}: GitHub`, 500, ERROR_CODES.SCRAPING_ERROR);
    }
  }

  /**
   * Fetch user data from SkillRack with caching and real-time updates
   */
  async fetchSkillRackData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.SKILLRACK}:${username}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const data = await fetchSkillRackStats(username);
      const result = {
        platform: PLATFORMS.SKILLRACK,
        username,
        ...data,
      };

      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);

      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.SKILLRACK, username, result, userId);
      }

      return result;
    } catch (error) {
      throw new AppError(`${MESSAGES.SCRAPING_FAILED}: SkillRack`, 500, ERROR_CODES.SCRAPING_ERROR);
    }
  }

  /**
   * Fetch user data from HackerRank with caching and real-time updates
   */
  async fetchHackerRankData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.HACKERRANK || 'hackerrank'}:${username}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return { ...data, fromCache: true };
      }
    } catch (cacheError) {
      console.warn('Cache read failed for HackerRank:', cacheError.message);
    }

    try {
      const rawData = await scrapeHackerRank(username);
      // normalizeHackerRank might be needed if rawData isn't perfect, but let's assume rawData is what we need or check import.
      // Line 10 imports normalizeHackerRank.
      const normalizedData = normalizeHackerRank({ ...rawData, username });

      const result = {
        platform: PLATFORMS.HACKERRANK || 'hackerrank',
        username,
        ...normalizedData,
      };

      try {
        await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);
      } catch (cacheError) {
        console.warn('Cache write failed for HackerRank:', cacheError.message);
      }

      if (userId) {
        try {
          DataChangeEmitter.emitPlatformUpdate(
            PLATFORMS.HACKERRANK || 'hackerrank',
            username,
            result,
            userId
          );
        } catch (emitError) {
          console.warn('Real-time update failed for HackerRank:', emitError.message);
        }
      }

      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: HackerRank - ${error.message}`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Get supported platforms list
   */
  getSupportedPlatforms() {
    return Object.values(PLATFORMS);
  }

  /**
   * Invalidate cache for user
   */
  async invalidateUserCache(username) {
    const platforms = ['leetcode', 'codeforces', 'codechef', 'atcoder', 'github', 'skillrack'];
    platforms.forEach(platform => {
      APICache.delete(APICache.platformKey(platform, username));
    });
  }

  /**
   * Get activity service (lazy loaded)
   */
  getActivityService() {
    return this.container?.get('activityService');
  }

  /**
   * Check for progress and send notifications
   */
  async checkProgressAndNotify(userId, platform, newData, cachedData) {
    if (!cachedData || !newData.data) return;

    const oldCount = cachedData.data?.problemsSolved || cachedData.data?.totalSolved || 0;
    const newCount = newData.data?.problemsSolved || newData.data?.totalSolved || 0;

    if (newCount > oldCount) {
      const problemsGained = newCount - oldCount;
      await NotificationService.createNotification(
        userId,
        'friend_progress',
        `Progress on ${platform}!`,
        `You solved ${problemsGained} new problem${problemsGained > 1 ? 's' : ''} on ${platform}. Total: ${newCount}`,
        {
          platform,
          problemsGained,
          totalProblems: newCount,
          username: newData.username,
        }
      );
    }
  }

  /**
   * Fetch user data from HackerRank with caching
   */
  async fetchHackerRankData(username, userId = null) {
    const cacheKey = `platform:hackerrank:${username}`;

    try {
      const cached = await AdvancedCacheManager.get(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    } catch (cacheError) {
      console.warn('Cache read failed for HackerRank:', cacheError.message);
    }

    try {
      const rawData = await scrapeHackerRank(username);
      const normalizedData = normalizeHackerRank(rawData);

      const result = {
        platform: 'hackerrank',
        username,
        ...normalizedData,
      };

      try {
        await AdvancedCacheManager.set(cacheKey, result, config.CACHE_PLATFORM_TTL, {
          tags: ['platform', 'hackerrank', username],
        });
      } catch (cacheError) {
        console.warn('Cache write failed for HackerRank:', cacheError.message);
      }

      if (userId) {
        try {
          DataChangeEmitter.emitPlatformUpdate('hackerrank', username, result, userId);
        } catch (emitError) {
          console.warn('Real-time update failed for HackerRank:', emitError.message);
        }
      }

      return result;
    } catch (error) {
      // Propagate specific errors like "User not found"
      if (error.message && error.message.includes('User not found')) {
        throw new AppError(error.message, 404, ERROR_CODES.NOT_FOUND);
      }
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: HackerRank - ${error.message}`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }
}

export default PlatformService;
