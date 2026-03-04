// GitHub Scraper Test Suite
// This file contains tests for GitHub scraper reliability, edge cases, and mock data.

const { scrapeGitHub } = require('./github.scraper.js');
const { generateMockGitHubData } = require('./github.scraper.extended.js');

async function testGitHubScraper() {
  const usernames = [
    'validUser123',
    'invalid user',
    'user-with-edge-case',
    'timeoutUser',
    'mockUser'
  ];

  for (const username of usernames) {
    const result = await scrapeGitHub(username);
    console.log(`Test result for ${username}:`, result);
  }

  // Test mock data
  const mock = generateMockGitHubData('mockUser');
  console.log('Mock data:', mock);
}

if (require.main === module) {
  testGitHubScraper();
}
