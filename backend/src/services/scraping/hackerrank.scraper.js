import { puppeteerPool } from '../../utils/puppeteerPool.js';
import RetryManager from '../../utils/retryManager.js';
import Logger from '../../utils/logger.js';

const retryManager = new RetryManager({
  maxRetries: 3,
  baseDelay: 2000,
  maxDelay: 15000,
  backoffMultiplier: 2
});

/**
 * Add random human-like delays to avoid bot detection
 */
const randomDelay = (min = 1000, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export async function scrapeHackerRank(username) {
  return retryManager.execute(
    async () => await scrapeHackerRankInternal(username),
    { platform: 'HackerRank', username }
  );
}

async function scrapeHackerRankInternal(username) {
  Logger.info(`[HackerRank Scraper] Starting scrape for username: "${username}"`);

  const browser = await puppeteerPool.getBrowser();
  const page = await puppeteerPool.createPage(browser, {
    loadImages: false // Speed up loading
  });

  try {
    const profileUrl = `https://www.hackerrank.com/profile/${username}`;
    Logger.debug(`[HackerRank Scraper] Navigating to: ${profileUrl}`);

    // Add random delay before navigation to appear more human
    await randomDelay(500, 1500);

    const response = await page.goto(profileUrl, { 
      waitUntil: 'domcontentloaded', // Faster than networkidle2
      timeout: 60000 
    });
    
    Logger.debug(`[HackerRank Scraper] Response Status: ${response.status()}`);

    if (response.status() === 404) {
      throw new Error('User not found');
    }

    // Check for Cloudflare or CAPTCHA challenges
    const pageContent = await page.content();
    if (pageContent.includes('cf-challenge') || 
        pageContent.includes('captcha') ||
        pageContent.includes('challenge-platform')) {
      Logger.warn('[HackerRank Scraper] Bot detection challenge detected');
      throw new Error('BOT_DETECTED - CAPTCHA or challenge page encountered');
    }

    const pageTitle = await page.title();
    Logger.debug(`[HackerRank Scraper] Page Title: ${pageTitle}`);

    if (pageTitle.toLowerCase().includes('page not found')) {
      throw new Error('User not found');
    }

    // Wait for page to stabilize with randomized delay
    await randomDelay(2000, 4000);

    // Extract badge information using ElementHandles
    const scrapedBadges = [];
    try {
      // Wait for badges to load
      await page.waitForSelector('.hacker-badge', { timeout: 10000 }).catch(() => {
        Logger.warn('[HackerRank Scraper] No badges found or timeout waiting for badges');
      });
      
      const badgeElements = await page.$$('.hacker-badge');
      Logger.debug(`[HackerRank Scraper] Found ${badgeElements.length} badge elements`);

      for (const badgeEl of badgeElements) {
        try {
          // Get badge text content
          const text = await badgeEl.evaluate(el => el.innerText);
          const name = text.split('\n')[0].trim() || 'Badge';

          // Extract star count based on level class (gold=5 stars, silver=3 stars, bronze=1 star)
          const stars = await badgeEl.evaluate(el => {
            if (el.querySelector('.level-gold') || el.classList.contains('level-gold')) return 5;
            if (el.querySelector('.level-silver') || el.classList.contains('level-silver'))
              return 3;
            if (el.querySelector('.level-bronze') || el.classList.contains('level-bronze'))
              return 1;
            // Fallback: count actual star elements
            const starElements = el.querySelectorAll('.star, [class*="star"]');
            return starElements.length > 0 ? starElements.length : 3;
          });

          // Determine icon based on badge name
          let icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/problem-solving-gold.svg';
          const lowerName = name.toLowerCase();

          if (lowerName.includes('30 days') || lowerName.includes('days of code')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/30-days-of-code-gold.svg';
          } else if (lowerName.includes('10 days') || lowerName.includes('statistics')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/10-days-of-statistics-gold.svg';
          } else if (lowerName.includes('java')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/java-gold.svg';
          } else if (lowerName.includes('python')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/python-gold.svg';
          } else if (lowerName.includes('c++') || lowerName.includes('cpp')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/cpp-gold.svg';
          } else if (lowerName.includes('sql')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/sql-gold.svg';
          } else if (lowerName.includes('problem solving')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/problem-solving-gold.svg';
          }

          scrapedBadges.push({ name, stars, icon });
          Logger.debug(`[HackerRank Scraper] Badge: "${name}" (${stars} stars)`);
        } catch (e) {
          Logger.debug('[HackerRank Scraper] Could not extract badge info:', e.message);
        }
      }
    } catch (e) {
      Logger.warn('[HackerRank Scraper] Could not find badges:', e.message);
    }

    // Add delay before fetching submission history
    await randomDelay(1000, 2000);

    // Fetch submission history by navigating to API endpoint
    let submissionHistory = {};
    let problemsSolved = 0;
    try {
      const historyUrl = `https://www.hackerrank.com/rest/hackers/${username}/submission_histories`;
      const historyResponse = await page.goto(historyUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const historyText = await historyResponse.text();
      submissionHistory = JSON.parse(historyText);

      // Calculate total solved
      problemsSolved = Object.values(submissionHistory).reduce(
        (acc, val) => acc + (parseInt(val, 10) || 0),
        0
      );
      Logger.info(
        `[HackerRank Scraper] Submission history: ${Object.keys(submissionHistory).length} days, ${problemsSolved} total solved`
      );
    } catch (e) {
      Logger.warn('[HackerRank Scraper] Could not fetch submission history:', e.message);
    }

    const profileName = pageTitle.split(' - ')[0] || username;

    // Calculate total stars across all badges
    const totalStars = scrapedBadges.reduce((acc, badge) => acc + (badge.stars || 0), 0);

    Logger.info(
      `[HackerRank Scraper] Complete. Solved: ${problemsSolved}, Badges: ${scrapedBadges.length}, Total Stars: ${totalStars}`
    );

    return {
      platform: 'HACKERRANK',
      username,
      data: {
        name: profileName,
        username: username,
        avatar: '',
        country: '',
        school: '',
        badges: scrapedBadges,
        problemsSolved: problemsSolved,
        totalStars: totalStars,
        contestRating: 0,
        followers: 0,
        created_at: new Date().toISOString(),
        level: 0,
        submissionHistory: submissionHistory,
      },
    };
  } catch (err) {
    Logger.error('[HackerRank Scraper] ERROR:', {
      error: err.message,
      username,
      stack: err.stack
    });

    if (err.message.includes('User not found')) {
      throw new Error('User not found');
    }
    
    if (err.message.includes('BOT_DETECTED')) {
      throw err; // Let retry manager handle it
    }
    
    throw new Error(`Failed to fetch HackerRank data: ${err.message}`);
  } finally {
    await puppeteerPool.closePage(page);
    Logger.debug('[HackerRank Scraper] Page closed');
  }
}
