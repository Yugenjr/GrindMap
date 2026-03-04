import Logger from './logger.js';

/**
 * Scraping utilities for anti-bot detection and human-like behavior
 */

/**
 * Add random human-like delays
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise<void>}
 */
export const randomDelay = (min = 1000, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  Logger.debug(`Adding human-like delay: ${delay}ms`);
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Simulate human mouse movements on a page
 * @param {Page} page - Puppeteer page instance
 */
export const simulateHumanBehavior = async (page) => {
  try {
    // Random mouse movements
    const viewport = page.viewport();
    const x = Math.floor(Math.random() * viewport.width);
    const y = Math.floor(Math.random() * viewport.height);
    
    await page.mouse.move(x, y, { steps: 10 });
    
    // Random scroll
    await page.evaluate(() => {
      window.scrollBy({
        top: Math.random() * 500,
        left: 0,
        behavior: 'smooth'
      });
    });
    
    await randomDelay(500, 1500);
  } catch (error) {
    Logger.debug('Error simulating human behavior:', error.message);
  }
};

/**
 * Check if page contains bot detection challenges
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<boolean>}
 */
export const detectBotChallenge = async (page) => {
  try {
    const content = await page.content();
    const title = await page.title();
    
    const challengeIndicators = [
      'cf-challenge',
      'captcha',
      'challenge-platform',
      'challenge-form',
      'recaptcha',
      'hcaptcha',
      'cloudflare',
      'just a moment',
      'checking your browser',
      'enable javascript',
      'access denied',
      'blocked',
    ];
    
    const hasChallenge = challengeIndicators.some(indicator =>
      content.toLowerCase().includes(indicator) ||
      title.toLowerCase().includes(indicator)
    );
    
    if (hasChallenge) {
      Logger.warn('Bot detection challenge detected on page', {
        url: page.url(),
        title
      });
    }
    
    return hasChallenge;
  } catch (error) {
    Logger.error('Error detecting bot challenge:', error.message);
    return false;
  }
};

/**
 * Wait for element with retry and timeout
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector
 * @param {Object} options - Wait options
 * @returns {Promise<ElementHandle|null>}
 */
export const waitForElementSafe = async (page, selector, options = {}) => {
  const { timeout = 10000, visible = false } = options;
  
  try {
    await page.waitForSelector(selector, {
      timeout,
      visible,
    });
    return await page.$(selector);
  } catch (error) {
    Logger.debug(`Element not found: ${selector}`, { timeout, error: error.message });
    return null;
  }
};

/**
 * Extract text content safely
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector
 * @param {string} defaultValue - Default value if not found
 * @returns {Promise<string>}
 */
export const getTextContent = async (page, selector, defaultValue = '') => {
  try {
    const element = await page.$(selector);
    if (!element) return defaultValue;
    
    const text = await page.evaluate(el => el.textContent?.trim(), element);
    return text || defaultValue;
  } catch (error) {
    Logger.debug(`Error extracting text from ${selector}:`, error.message);
    return defaultValue;
  }
};

/**
 * Click element with human-like delay
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector
 * @returns {Promise<boolean>} - Success status
 */
export const clickWithDelay = async (page, selector) => {
  try {
    await randomDelay(200, 800);
    await page.click(selector);
    await randomDelay(300, 1000);
    return true;
  } catch (error) {
    Logger.debug(`Error clicking ${selector}:`, error.message);
    return false;
  }
};

/**
 * Type text with human-like delay between keystrokes
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector
 * @param {string} text - Text to type
 */
export const typeWithDelay = async (page, selector, text) => {
  try {
    await page.click(selector);
    await randomDelay(100, 300);
    
    // Type with random delays between characters
    for (const char of text) {
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
    
    await randomDelay(200, 500);
  } catch (error) {
    Logger.error(`Error typing into ${selector}:`, error.message);
    throw error;
  }
};

/**
 * Navigate with retry and bot detection check
 * @param {Page} page - Puppeteer page instance
 * @param {string} url - URL to navigate to
 * @param {Object} options - Navigation options
 * @returns {Promise<Response>}
 */
export const navigateWithRetry = async (page, url, options = {}) => {
  const { 
    waitUntil = 'domcontentloaded',
    timeout = 60000,
    maxRetries = 3 
  } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      Logger.debug(`Navigating to ${url} (attempt ${attempt}/${maxRetries})`);
      
      // Add random delay before navigation
      if (attempt > 1) {
        await randomDelay(2000, 5000);
      }
      
      const response = await page.goto(url, { waitUntil, timeout });
      
      // Check for bot detection
      const hasChallenge = await detectBotChallenge(page);
      if (hasChallenge) {
        if (attempt < maxRetries) {
          Logger.warn(`Bot challenge detected, retrying...`);
          continue;
        }
        throw new Error('BOT_DETECTED - Failed to bypass challenge after retries');
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      Logger.warn(`Navigation failed (attempt ${attempt}/${maxRetries}):`, error.message);
    }
  }
};

/**
 * Handle cookies and consent dialogs
 * @param {Page} page - Puppeteer page instance
 */
export const handleCookieConsent = async (page) => {
  const consentSelectors = [
    'button[aria-label*="Accept"]',
    'button[aria-label*="Agree"]',
    'button:contains("Accept")',
    'button:contains("Agree")',
    'button:contains("Allow")',
    '.cookie-consent button',
    '#cookie-accept',
    '[data-testid="cookie-accept"]',
  ];
  
  for (const selector of consentSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await clickWithDelay(page, selector);
        Logger.debug('Clicked cookie consent button');
        break;
      }
    } catch (error) {
      // Continue to next selector
    }
  }
};

/**
 * Screenshot on error for debugging
 * @param {Page} page - Puppeteer page instance
 * @param {string} filename - Screenshot filename
 */
export const screenshotOnError = async (page, filename) => {
  try {
    const path = `./logs/screenshots/${filename}-${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true });
    Logger.info(`Error screenshot saved: ${path}`);
  } catch (error) {
    Logger.debug('Failed to save screenshot:', error.message);
  }
};

/**
 * Get page performance metrics
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<Object>}
 */
export const getPageMetrics = async (page) => {
  try {
    const metrics = await page.metrics();
    const performanceTimings = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );
    
    return {
      ...metrics,
      loadTime: performanceTimings.loadEventEnd - performanceTimings.navigationStart,
      domContentLoaded: performanceTimings.domContentLoadedEventEnd - performanceTimings.navigationStart,
    };
  } catch (error) {
    Logger.debug('Error getting page metrics:', error.message);
    return {};
  }
};

export default {
  randomDelay,
  simulateHumanBehavior,
  detectBotChallenge,
  waitForElementSafe,
  getTextContent,
  clickWithDelay,
  typeWithDelay,
  navigateWithRetry,
  handleCookieConsent,
  screenshotOnError,
  getPageMetrics,
};
