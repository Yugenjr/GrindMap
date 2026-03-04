// GitHub Scraper Extended Activity
// This file contains additional helper functions, edge case handlers, and mock data for testing reliability.

function handleGitHubEdgeCases(events) {
  // Example: Check for empty events array
  if (!Array.isArray(events) || events.length === 0) return false;
  // Check for missing fields
  for (const event of events) {
    if (!event.created_at) return false;
  }
  return true;
}

function generateMockGitHubData(username) {
  return {
    platform: "GITHUB",
    username,
    data: {
      totalEvents: Math.floor(Math.random() * 100),
      recentActivityCount: Math.floor(Math.random() * 20),
      message: "mock data",
      status: "success"
    }
  };
}

module.exports = { handleGitHubEdgeCases, generateMockGitHubData };
