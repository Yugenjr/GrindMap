import puppeteer from 'puppeteer';

class PuppeteerManager {
  constructor() {
    this.browsers = new Set();
    this.pages = new Set();
    this.maxBrowsers = 3;
    this.pageTimeout = 15000; // 15 seconds
  }

  async createBrowser() {
    if (this.browsers.size >= this.maxBrowsers) {
      throw new Error('Maximum browser instances reached');
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    this.browsers.add(browser);

    // Auto-cleanup after 5 minutes
    setTimeout(() => this.closeBrowser(browser), 300000);

    return browser;
  }

  async createPage(browser) {
    const page = await browser.newPage();
    page.setDefaultTimeout(this.pageTimeout);

    this.pages.add(page);
    return page;
  }

  async closePage(page) {
    if (page && !page.isClosed()) {
      await page.close();
    }
    this.pages.delete(page);
  }

  async closeBrowser(browser) {
    if (browser && browser.isConnected()) {
      await browser.close();
    }
    this.browsers.delete(browser);
  }

  async cleanup() {
    // Close all pages
    await Promise.all(Array.from(this.pages).map(page => this.closePage(page)));

    // Close all browsers
    await Promise.all(Array.from(this.browsers).map(browser => this.closeBrowser(browser)));
  }

  getStats() {
    return {
      activeBrowsers: this.browsers.size,
      activePages: this.pages.size,
    };
  }
}

export default new PuppeteerManager();
