/**
 * Normalizes HackerRank data to standard format
 */
export const normalizeHackerRank = rawData => {
  const { data, username } = rawData;

  // HackerRank doesn't provide easy/medium/hard breakdown in the public endpoint easily.
  // We will map available data and set safe defaults.

  return {
    totalSolved: data.problemsSolved || 0, // Fallback if scraper couldn't find it
    easySolved: 0, // Not available in simple profile text
    mediumSolved: 0, // Not available
    hardSolved: 0, // Not available

    // HackerRank specific
    badges: data.badges || [],
    ranking: 0, // Not standard
    contributionPoints: 0,
    reputation: 0,

    // Standard profile fields
    name: data.name,
    avatar: data.avatar,
    location: data.country,
    company: data.school, // "School" is often used as org in HR

    // Original data for reference
    submissionHistory: data.submissionHistory || [],
  };
};
