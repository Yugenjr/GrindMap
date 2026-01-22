import puppeteer from 'puppeteer';
import Logger from './logger.js';
import { BROWSER_CONFIG, applyStealthScripts } from '../config/puppeteer.js';

// User-Agent rotation pool
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

class PuppeteerPool {
  constructor() {
    this.browsers = new Map();
    this.maxBrowsers = 2;
    this.pageTimeout = 60000; // Increased to 60s for slower sites
    this.browserTimeout = 300000;
    this.userAgentIndex = 0;
  }

  /**
   * Get a random user agent for rotation
   */
  getRandomUserAgent() {
    this.userAgentIndex = (this.userAgentIndex + 1) % USER_AGENTS.length;
    return USER_AGENTS[this.userAgentIndex];
  }

  async getBrowser() {
    await this.cleanupExpiredBrowsers();
    
    // Try to reuse existing browser
    for (const [browser, info] of this.browsers) {
      if (info.pages < 5 && browser.isConnected()) {
        info.lastUsed = Date.now();
        info.pages++;
        return browser;
      }
    }
    
    // Create new browser if pool not exhausted
    if (this.browsers.size < this.maxBrowsers) {
      const browser = await puppeteer.launch(BROWSER_CONFIG);
      
      this.browsers.set(browser, {
        created: Date.now(),
        lastUsed: Date.now(),
        pages: 1
      });
      
      Logger.info('New browser instance created in pool', {
        totalBrowsers: this.browsers.size,
        maxBrowsers: this.maxBrowsers
      });
      
      return browser;
    }
    
    throw new Error('Browser pool exhausted');
  }

  async createPage(browser, options = {}) {
    const page = await browser.newPage();
    
    // Set default timeout
    await page.setDefaultTimeout(this.pageTimeout);
    await page.setDefaultNavigationTimeout(this.pageTimeout);
    
    // Set random user agent for anti-bot detection
    const userAgent = options.userAgent || this.getRandomUserAgent();
    await page.setUserAgent(userAgent);
    
    // Apply stealth scripts
    await applyStealthScripts(page);
    
    // Set viewport with randomization to appear more human
    const viewportWidth = 1920 + Math.floor(Math.random() * 200 - 100);
    const viewportHeight = 1080 + Math.floor(Math.random() * 200 - 100);
    
    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });
    
    // Extra headers to appear more legitimate
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Upgrade-Insecure-Requests': '1',
    });
    
    // Block unnecessary resources to speed up loading (optional)
    if (!options.loadImages) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }
    
    Logger.debug('Page created with anti-bot configuration', {
      userAgent,
      viewport: `${viewportWidth}x${viewportHeight}`
    });
    
    return page;
  }

  async closePage(page) {
    try {
      if (page && !page.isClosed()) {
        await page.close();
        
        // Update page count for the browser
        for (const [browser, info] of this.browsers) {
          if (page.browser() === browser) {
            info.pages = Math.max(0, info.pages - 1);
            break;
          }
        }
      }
    } catch (error) {
      Logger.error('Error closing page', { error: error.message });
    }
  }

  async cleanupExpiredBrowsers() {
    const now = Date.now();
    const toClose = [];
    
    for (const [browser, info] of this.browsers) {
      if (now - info.lastUsed > this.browserTimeout || info.pages === 0) {
        toClose.push(browser);
      }
    }
    
    for (const browser of toClose) {
      await this.closeBrowser(browser);
    }
  }

  async closeBrowser(browser) {
    try {
      if (browser && browser.isConnected()) {
        await browser.close();
      }
      this.browsers.delete(browser);
    } catch (error) {
      Logger.error('Error closing browser', { error: error.message });
    }
  }

  async closeAll() {
    const closePromises = Array.from(this.browsers.keys()).map(browser => 
      this.closeBrowser(browser)
    );
    
    await Promise.allSettled(closePromises);
    this.browsers.clear();
  }
}

export const puppeteerPool = new PuppeteerPool();

process.on('SIGINT', async () => {
  await puppeteerPool.closeAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await puppeteerPool.closeAll();
  process.exit(0);
});

setInterval(() => {
  puppeteerPool.cleanupExpiredBrowsers();
}, 60000);