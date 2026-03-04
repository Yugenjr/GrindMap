import Activity from '../models/activity.model.js';

/**
 * Streak service - handles streak calculation and tracking
 * NO DIRECT SERVICE DEPENDENCIES - uses DI container
 */
class StreakService {
  constructor(container = null) {
    this.container = container;
  }

  /**
   * Compute user streak for a specific platform or all platforms
   * @param {string} userId - User ID
   * @param {string} platformKey - Optional platform filter
   * @returns {Object} Streak metrics
   */
  async computeUserStreak(userId, platformKey = null) {
    try {
      // Query activities for the user
      const query = { user: userId };
      if (platformKey) {
        query.platform = platformKey;
      }

      const activities = await Activity.find(query)
        .select('solvedAt')
        .sort({ solvedAt: 1 });

      if (activities.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          streakStartDate: null,
          streakEndDate: null
        };
      }

      // Extract unique dates (normalized to UTC day)
      const uniqueDates = this._getUniqueActivityDates(activities);

      // Calculate streaks
      const streaks = this._calculateStreaks(uniqueDates);

      return {
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        lastActiveDate: streaks.lastActiveDate,
        streakStartDate: streaks.streakStartDate,
        streakEndDate: streaks.streakEndDate
      };
    } catch (error) {
      console.error('Error computing user streak:', error);
      throw error;
    }
  }

  /**
   * Calculate streaks from sorted unique dates
   * @param {Date[]} dates - Sorted array of activity dates
   * @returns {Object} Streak calculations
   */
  _calculateStreaks(dates) {
    if (dates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        streakStartDate: null,
        streakEndDate: null
      };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 1;
    let tempStreak = 1;
    let lastActiveDate = dates[dates.length - 1];
    let streakStartDate = dates[dates.length - 1];
    let streakEndDate = dates[dates.length - 1];

    // Check if current streak is active (ends today or yesterday)
    const lastDate = new Date(dates[dates.length - 1]);
    lastDate.setUTCHours(0, 0, 0, 0);
    const daysSinceLastActivity = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastActivity <= 1) {
      // Current streak is active
      currentStreak = 1;
      streakStartDate = lastDate;
      streakEndDate = lastDate;

      // Count backwards from last activity
      for (let i = dates.length - 2; i >= 0; i--) {
        const currentDate = new Date(dates[i]);
        currentDate.setUTCHours(0, 0, 0, 0);
        const prevDate = new Date(dates[i + 1]);
        prevDate.setUTCHours(0, 0, 0, 0);

        const dayDiff = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          currentStreak++;
          streakStartDate = currentDate;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      currentDate.setUTCHours(0, 0, 0, 0);
      const prevDate = new Date(dates[i - 1]);
      prevDate.setUTCHours(0, 0, 0, 0);

      const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
      streakStartDate,
      streakEndDate
    };
  }

  /**
   * Extract unique activity dates normalized to UTC day
   * @param {Array} activities - Activity documents
   * @returns {Date[]} Sorted unique dates
   */
  _getUniqueActivityDates(activities) {
    const dateSet = new Set();

    activities.forEach(activity => {
      const date = new Date(activity.solvedAt);
      date.setUTCHours(0, 0, 0, 0);
      dateSet.add(date.getTime());
    });

    return Array.from(dateSet)
      .map(timestamp => new Date(timestamp))
      .sort((a, b) => a - b);
  }

  /**
   * Get activity service (lazy loaded)
   */
  getActivityService() {
    return this.container?.get('activityService');
  }
}

export default StreakService;