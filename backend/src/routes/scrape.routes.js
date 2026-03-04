import express from 'express';
import ScrapeController from '../controllers/scrape.controller.js';
import { scrapingTimeout } from '../middlewares/requestTimeout.middleware.js';
import { validateUsername as validateUsernameInput, sanitizeUsername } from '../middlewares/inputValidation.middleware.js';
import { advancedRateLimit, scrapingRateLimit } from '../middlewares/antiBypassRateLimit.middleware.js';
import { apiResponseCache } from '../middlewares/apiCache.middleware.js';
import { auditLogger } from '../middlewares/audit.middleware.js';
import { enforceScrapingQuota } from '../middlewares/quota.middleware.js';
import { scrapingLimiter } from '../middlewares/rateLimiter.middleware.js';
const router = express.Router();

// Apply input validation and sanitization to all username routes
router.use('/:platform/:username', validateUsernameInput, sanitizeUsername);

/**
 * @route   GET /api/scrape/leetcode/:username
 * @desc    Get LeetCode user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/leetcode/:username',
  scrapingTimeout,
  scrapingRateLimit,
  validateUsername,
  enforceScrapingQuota,
  auditLogger('FETCH_LEETCODE_STATS'),
  apiResponseCache(900),
  ScrapeController.getLeetCodeStats
);

/**
 * @route   GET /api/scrape/codeforces/:username
 * @desc    Get Codeforces user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/codeforces/:username',
  scrapingTimeout,
  scrapingRateLimit,
  validateUsername,
  auditLogger('FETCH_CODEFORCES_STATS'),
  apiResponseCache(900),
  ScrapeController.getCodeforcesStats
);

/**
 * @route   GET /api/scrape/codechef/:username
 * @desc    Get CodeChef user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/codechef/:username',
  scrapingTimeout,
  scrapingRateLimit,
  validateUsername,
  auditLogger('FETCH_CODECHEF_STATS'),
  apiResponseCache(900),
  ScrapeController.getCodeChefStats
);

/**
 * @route   GET /api/scrape/atcoder/:username
 * @desc    Get AtCoder user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/atcoder/:username',
  scrapingTimeout,
  scrapingRateLimit,
  validateUsername,
  auditLogger('FETCH_ATCODER_STATS'),
  apiResponseCache(900),
  ScrapeController.getAtCoderStats
);

/**
 * @route   GET /api/scrape/hackerearth/:username
 * @desc    Get HackerEarth user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/hackerearth/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_HACKEREARTH_STATS'),
  platformCache, // 15 minutes cache
  ScrapeController.getHackerEarthStats
);

/**
 * @route   GET /api/scrape/github/:username
 * @desc    Get GitHub user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/github/:username',
  scrapingTimeout,
  scrapingRateLimit,
  validateUsername,
  auditLogger('FETCH_GITHUB_STATS'),
  apiResponseCache(1800),
  ScrapeController.getGitHubStats
);

/**
 * @route   GET /api/scrape/skillrack/:username
 * @desc    Get SkillRack user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/skillrack/:username',
  scrapingTimeout,
  scrapingRateLimit,
  validateUsername,
  auditLogger('FETCH_SKILLRACK_STATS'),
  apiResponseCache(900),
  ScrapeController.getSkillRackStats
);

/**
 * @route   GET /api/scrape/hackerrank/:username
 * @desc    Get HackerRank user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/hackerrank/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_HACKERRANK_STATS'),
  platformCache, // 15 minutes cache
  ScrapeController.getHackerRankStats
);

/**
 * @route   GET /api/scrape/platforms
 * @desc    Get list of supported platforms
 * @access  Public (cached)
 */
router.get(
  '/platforms',
  platformCache, // 15 minutes cache
  '/platforms', 
  advancedRateLimit,
  apiResponseCache(3600),
  ScrapeController.getSupportedPlatforms
);

export default router;
