import { puppeteerPool } from '../../utils/puppeteerPool.js';

export async function fetchSkillRackStats(username) {
  let page;
  try {
    const browser = await puppeteerPool.getBrowser();
    page = await browser.newPage();
    
    await page.goto(`https://www.skillrack.com/faces/resume.xhtml?id=${username}`, {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    const stats = await page.evaluate(() => {
      const problemsElement = document.querySelector('.problems-solved-count');
      const pointsElement = document.querySelector('.total-points');
      
      return {
        problemsSolved: problemsElement ? parseInt(problemsElement.textContent) : 0,
        totalPoints: pointsElement ? parseInt(pointsElement.textContent) : 0
      };
    });
    
    return {
      platform: 'SKILLRACK',
      username,
      data: stats
    };
  } catch (error) {
    throw new Error('Failed to fetch SkillRack data');
  } finally {
    if (page) {
      await puppeteerPool.closePage(page);
    }
  }
}