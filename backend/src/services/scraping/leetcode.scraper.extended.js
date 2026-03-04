// LeetCode Scraper Extended Activity
// This file contains additional helper functions, edge case handlers, and mock data for testing reliability.

function handleLeetCodeEdgeCases(data) {
  // Example: Check for missing fields
  if (!data || typeof data !== "object") return false;
  if (!data.status || !data.totalSolved) return false;
  return true;
}

function generateMockLeetCodeData(username) {
  return {
    platform: "LEETCODE",
    username,
    data: {
      status: "success",
      totalSolved: Math.floor(Math.random() * 1000),
      easySolved: Math.floor(Math.random() * 300),
      mediumSolved: Math.floor(Math.random() * 400),
      hardSolved: Math.floor(Math.random() * 300),
      ranking: Math.floor(Math.random() * 10000),
      message: "mock data"
    }
  };
}

module.exports = { handleLeetCodeEdgeCases, generateMockLeetCodeData };
