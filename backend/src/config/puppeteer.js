import puppeteer from 'puppeteer';
import Logger from '../utils/logger.js';

let browser = null;

/**
 * Enhanced Puppeteer configuration for anti-bot detection
 * Configured to bypass common bot detection methods
 */
export const BROWSER_CONFIG = {
  headless: 'new',
  args: [
    // Essential args
    '--no-sandbox',
    '--disable-setuid-sandbox',
    
    // Anti-detection args
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-web-security',
    
    // Performance and stability
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    
    // Memory management
    '--max-old-space-size=4096',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    
    // Additional stealth
    '--window-size=1920,1080',
    '--disable-infobars',
    '--hide-scrollbars',
    '--mute-audio',
    
    // Proxy support (can be configured)
    // '--proxy-server=http://proxy:port',
  ],
  ignoreHTTPSErrors: true,
  defaultViewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },
};

export const getBrowser = async () => {
  if (!browser || !browser.isConnected()) {
    try {
      browser = await puppeteer.launch(BROWSER_CONFIG);
      
      // Add stealth scripts to every page
      browser.on('targetcreated', async (target) => {
        const page = await target.page();
        if (page) {
          await applyStealthScripts(page);
        }
      });
      
      Logger.info('Puppeteer browser launched with anti-bot configuration');
    } catch (error) {
      Logger.error('Failed to launch browser', { error: error.message });
      throw error;
    }
  }
  return browser;
};

export const closeBrowser = async () => {
  if (browser) {
    try {
      await browser.close();
      browser = null;
      Logger.info('Puppeteer browser closed');
    } catch (error) {
      Logger.error('Error closing browser', { error: error.message });
    }
  }
};

/**
 * Apply stealth scripts to bypass bot detection
 * Overrides navigator properties and WebDriver flags
 */
export const applyStealthScripts = async (page) => {
  await page.evaluateOnNewDocument(() => {
    // Override the navigator.webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Override the navigator.plugins to appear like a real browser
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override the navigator.languages property
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });

    // Override the chrome property
    window.chrome = {
      runtime: {},
    };

    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);

    // Modernizr fix
    if (window.Modernizr) {
      delete window.Modernizr;
    }
  });
};
