import { puppeteerPool } from '../../utils/puppeteerPool.js';
import Logger from '../../utils/logger.js';

export async function fetchAtCoderStats(username) {
  let page;
  
  try {
    const browser = await puppeteerPool.getBrowser();
    page = await puppeteerPool.createPage(browser);
    
    await page.goto(`https://atcoder.jp/users/${username}`, {
      waitUntil: 'networkidle2',
      timeout: 20000
    });
    
    const stats = await Promise.race([
      page.evaluate(() => {
        const ratingElement = document.querySelector('.user-rating');
        const rankElement = document.querySelector('.user-rank');
        
        return {
          rating: ratingElement ? parseInt(ratingElement.textContent) : 0,
          rank: rankElement ? rankElement.textContent.trim() : 'Unrated'
        };
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Evaluation timeout')), 15000)
      )
    ]);
    
    return {
      platform: 'ATCODER',
      username,
      data: stats
    };
  } catch (error) {
    Logger.error('AtCoder scraping failed', { username, error: error.message });
    throw new Error('Failed to fetch AtCoder data');
  } finally {
    if (page) {
      await puppeteerPool.closePage(page);
    }
  }
}