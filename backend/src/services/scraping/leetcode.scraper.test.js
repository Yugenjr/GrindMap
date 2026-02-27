// LeetCode Scraper Test Suite
// This file contains tests for LeetCode scraper reliability, edge cases, and mock data.

const { scrapeLeetCode } = require('./leetcode.scraper.js');
const { generateMockLeetCodeData } = require('./leetcode.scraper.extended.js');

async function testLeetCodeScraper() {
  const usernames = [
    'validUser123',
    'invalid user',
    'user_with_edge_case',
    'timeoutUser',
    'mockUser'
  ];

  for (const username of usernames) {
    const result = await scrapeLeetCode(username);
    console.log(`Test result for ${username}:`, result);
  }

  // Test mock data
  const mock = generateMockLeetCodeData('mockUser');
  console.log('Mock data:', mock);
}

if (require.main === module) {
  testLeetCodeScraper();
}
