// LeetCode Scraper Advanced Utilities
// This file contains advanced utilities for LeetCode scraping reliability, including caching, stats analysis, and error categorization.

const cache = {};

function cacheLeetCodeStats(username, data) {
  cache[username] = {
    data,
    timestamp: Date.now()
  };
}

function getCachedLeetCodeStats(username) {
  const entry = cache[username];
  if (!entry) return null;
  // Cache valid for 10 minutes
  if (Date.now() - entry.timestamp > 10 * 60 * 1000) return null;
  return entry.data;
}

function analyzeLeetCodeStats(data) {
  if (!data || typeof data !== "object") return null;
  return {
    totalSolved: data.totalSolved || 0,
    easyRatio: data.easySolved / (data.totalSolved || 1),
    mediumRatio: data.mediumSolved / (data.totalSolved || 1),
    hardRatio: data.hardSolved / (data.totalSolved || 1),
    ranking: data.ranking || null
  };
}

function categorizeLeetCodeError(message) {
  if (message.includes("timeout")) return "Timeout";
  if (message.includes("Invalid username")) return "Validation";
  if (message.includes("Malformed")) return "Malformed Response";
  return "Unknown";
}

module.exports = {
  cacheLeetCodeStats,
  getCachedLeetCodeStats,
  analyzeLeetCodeStats,
  categorizeLeetCodeError
};
