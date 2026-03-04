import Badge from "../models/badge.model.js";
import UserBadge from "../models/userBadge.model.js";
import User from "../models/user.model.js";

class BadgeService {
  // Initialize default badges in the database
  static async initializeBadges() {
    const defaultBadges = [
      // Problem-solving badges
      {
        name: "First Steps",
        description: "Solve your first problem",
        icon: "🎯",
        category: "problems",
        criteria: { type: "count", value: 1 },
        rarity: "common",
        points: 5
      },
      {
        name: "Problem Solver",
        description: "Solve 10 problems",
        icon: "🧠",
        category: "problems",
        criteria: { type: "count", value: 10 },
        rarity: "common",
        points: 10
      },
      {
        name: "Code Warrior",
        description: "Solve 50 problems",
        icon: "⚔️",
        category: "problems",
        criteria: { type: "count", value: 50 },
        rarity: "rare",
        points: 25
      },
      {
        name: "Algorithm Master",
        description: "Solve 100 problems",
        icon: "👑",
        category: "problems",
        criteria: { type: "count", value: 100 },
        rarity: "epic",
        points: 50
      },
      {
        name: "Legend",
        description: "Solve 500 problems",
        icon: "🌟",
        category: "problems",
        criteria: { type: "count", value: 500 },
        rarity: "legendary",
        points: 100
      },

      // Streak badges
      {
        name: "Getting Started",
        description: "Maintain a 3-day streak",
        icon: "🔥",
        category: "streak",
        criteria: { type: "streak", value: 3 },
        rarity: "common",
        points: 10
      },
      {
        name: "Consistency King",
        description: "Maintain a 7-day streak",
        icon: "🔥",
        category: "streak",
        criteria: { type: "streak", value: 7 },
        rarity: "rare",
        points: 25
      },
      {
        name: "Unstoppable",
        description: "Maintain a 30-day streak",
        icon: "🚀",
        category: "streak",
        criteria: { type: "streak", value: 30 },
        rarity: "epic",
        points: 75
      },
      {
        name: "Immortal",
        description: "Maintain a 100-day streak",
        icon: "💎",
        category: "streak",
        criteria: { type: "streak", value: 100 },
        rarity: "legendary",
        points: 200
      },

      // Rating badges
      {
        name: "Novice",
        description: "Reach an average rating of 1200",
        icon: "🥉",
        category: "rating",
        criteria: { type: "rating", value: 1200 },
        rarity: "common",
        points: 15
      },
      {
        name: "Intermediate",
        description: "Reach an average rating of 1500",
        icon: "🥈",
        category: "rating",
        criteria: { type: "rating", value: 1500 },
        rarity: "rare",
        points: 30
      },
      {
        name: "Expert",
        description: "Reach an average rating of 1800",
        icon: "🥇",
        category: "rating",
        criteria: { type: "rating", value: 1800 },
        rarity: "epic",
        points: 60
      },
      {
        name: "Rating Master",
        description: "Reach an average rating of 2000",
        icon: "🏆",
        category: "rating",
        criteria: { type: "rating", value: 2000 },
        rarity: "legendary",
        points: 100
      },

      // Speed badges
      {
        name: "Quick Thinker",
        description: "Solve a problem in under 5 minutes",
        icon: "⚡",
        category: "speed",
        criteria: { type: "time", value: 300000 }, // 5 minutes in milliseconds
        rarity: "rare",
        points: 20
      },
      {
        name: "Speed Demon",
        description: "Solve a problem in under 2 minutes",
        icon: "💨",
        category: "speed",
        criteria: { type: "time", value: 120000 }, // 2 minutes in milliseconds
        rarity: "epic",
        points: 40
      },
      {
        name: "Lightning Fast",
        description: "Solve a problem in under 1 minute",
        icon: "🌩️",
        category: "speed",
        criteria: { type: "time", value: 60000 }, // 1 minute in milliseconds
        rarity: "legendary",
        points: 80
      }
    ];

    for (const badgeData of defaultBadges) {
      await Badge.findOneAndUpdate(
        { name: badgeData.name },
        badgeData,
        { upsert: true, new: true }
      );
    }
  }

  // Check and award badges for a user based on their current stats
  static async checkAndAwardBadges(userId, userStats = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) return [];

      // Update user stats if provided
      if (userStats.totalProblemsSolved !== undefined) {
        user.totalProblemsSolved = userStats.totalProblemsSolved;
      }
      if (userStats.currentStreak !== undefined) {
        user.currentStreak = userStats.currentStreak;
        if (userStats.currentStreak > user.longestStreak) {
          user.longestStreak = userStats.currentStreak;
        }
      }
      if (userStats.averageRating !== undefined) {
        user.averageRating = userStats.averageRating;
      }
      if (userStats.fastestSolveTime !== undefined && userStats.fastestSolveTime) {
        if (!user.fastestSolveTime || userStats.fastestSolveTime < user.fastestSolveTime) {
          user.fastestSolveTime = userStats.fastestSolveTime;
        }
      }

      await user.save();

      // Get all active badges
      const badges = await Badge.find({ isActive: true });
      const awardedBadges = [];

      for (const badge of badges) {
        // Check if user already has this badge
        const existingUserBadge = await UserBadge.findOne({
          user: userId,
          badge: badge._id
        });

        if (existingUserBadge) continue;

        // Check if user meets the criteria
        let meetsCriteria = false;

        switch (badge.criteria.type) {
          case "count":
            meetsCriteria = user.totalProblemsSolved >= badge.criteria.value;
            break;
          case "streak":
            meetsCriteria = user.longestStreak >= badge.criteria.value;
            break;
          case "rating":
            meetsCriteria = user.averageRating >= badge.criteria.value;
            break;
          case "time":
            meetsCriteria = user.fastestSolveTime && user.fastestSolveTime <= badge.criteria.value;
            break;
        }

        if (meetsCriteria) {
          // Award the badge
          const userBadge = new UserBadge({
            user: userId,
            badge: badge._id,
            earnedAt: new Date()
          });

          await userBadge.save();

          // Update user points and badge count
          user.totalPoints += badge.points;
          user.badgeCount += 1;
          await user.save();

          awardedBadges.push({
            badge: badge,
            userBadge: userBadge,
            isNew: true
          });
        }
      }

      return awardedBadges;
    } catch (error) {
      console.error("Error checking and awarding badges:", error);
      return [];
    }
  }

  // Get user's badges with progress for upcoming badges
  static async getUserBadgesWithProgress(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { earned: [], upcoming: [] };

      // Get earned badges
      const earnedUserBadges = await UserBadge.find({ user: userId })
        .populate("badge")
        .sort({ earnedAt: -1 });

      // Get all badges for progress calculation
      const allBadges = await Badge.find({ isActive: true });

      const upcoming = [];

      for (const badge of allBadges) {
        // Check if user already has this badge
        const hasBadge = earnedUserBadges.some(ub => ub.badge._id.toString() === badge._id.toString());
        if (hasBadge) continue;

        // Calculate progress
        let progress = 0;
        let current = 0;
        let target = badge.criteria.value;

        switch (badge.criteria.type) {
          case "count":
            current = user.totalProblemsSolved;
            progress = Math.min((current / target) * 100, 100);
            break;
          case "streak":
            current = user.longestStreak;
            progress = Math.min((current / target) * 100, 100);
            break;
          case "rating":
            current = user.averageRating;
            progress = Math.min((current / target) * 100, 100);
            break;
          case "time":
            if (user.fastestSolveTime) {
              // For time badges, lower time is better, so invert the progress
              current = user.fastestSolveTime;
              progress = Math.min(((target - current) / target) * 100, 100);
              if (progress < 0) progress = 0;
            }
            break;
        }

        upcoming.push({
          badge: badge,
          progress: Math.round(progress),
          current: current,
          target: target
        });
      }

      // Sort upcoming by progress (closest to completion first)
      upcoming.sort((a, b) => b.progress - a.progress);

      return {
        earned: earnedUserBadges,
        upcoming: upcoming.slice(0, 5), // Show top 5 upcoming badges
        stats: {
          totalPoints: user.totalPoints,
          badgeCount: user.badgeCount,
          totalProblemsSolved: user.totalProblemsSolved,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          averageRating: user.averageRating,
          fastestSolveTime: user.fastestSolveTime
        }
      };
    } catch (error) {
      console.error("Error getting user badges with progress:", error);
      return { earned: [], upcoming: [] };
    }
  }

  // Mark badges as seen (remove "new" indicator)
  static async markBadgesAsSeen(userId, badgeIds) {
    try {
      await UserBadge.updateMany(
        { user: userId, badge: { $in: badgeIds }, isNew: true },
        { isNew: false }
      );
      return true;
    } catch (error) {
      console.error("Error marking badges as seen:", error);
      return false;
    }
  }
}

export default BadgeService;