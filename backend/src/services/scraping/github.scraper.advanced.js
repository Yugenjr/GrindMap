// GitHub Scraper Advanced Utilities
// This file contains advanced utilities for GitHub scraping reliability, including caching, stats analysis, and error categorization.

const cache = {};

function cacheGitHubEvents(username, events) {
  cache[username] = {
    events,
    timestamp: Date.now()
  };
}

function getCachedGitHubEvents(username) {
  const entry = cache[username];
  if (!entry) return null;
  // Cache valid for 10 minutes
  if (Date.now() - entry.timestamp > 10 * 60 * 1000) return null;
  return entry.events;
}

function analyzeGitHubEvents(events) {
  if (!Array.isArray(events)) return null;
  const pushEvents = events.filter(e => e.type === "PushEvent");
  const prEvents = events.filter(e => e.type === "PullRequestEvent");
  return {
    totalEvents: events.length,
    pushCount: pushEvents.length,
    prCount: prEvents.length,
    recentActivityCount: events.filter(e => {
      const eventDate = new Date(e.created_at);
      return (Date.now() - eventDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length
  };
}

function categorizeGitHubError(message) {
  if (message.includes("timeout")) return "Timeout";
  if (message.includes("Invalid username")) return "Validation";
  if (message.includes("Malformed")) return "Malformed Response";
  return "Unknown";
}

module.exports = {
  cacheGitHubEvents,
  getCachedGitHubEvents,
  analyzeGitHubEvents,
  categorizeGitHubError
};
