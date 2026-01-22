import ActivityLog from "../models/activityLog.model.js";
import mongoose from "mongoose";

class AnalyticsService {
  /**
   * Get daily streak (current and longest)
   */
  async getDailyStreak(userId) {
    const activities = await ActivityLog.find({ userId })
      .sort({ date: -1 })
      .select("date")
      .lean();

    if (!activities.length) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    // Get unique dates
    const uniqueDates = [...new Set(
      activities.map(a => new Date(a.date).toISOString().split("T")[0])
    )].sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Calculate current streak
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = (new Date(uniqueDates[i - 1]) - new Date(uniqueDates[i])) / 86400000;
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = (new Date(uniqueDates[i - 1]) - new Date(uniqueDates[i])) / 86400000;
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
      lastActiveDate: uniqueDates[0],
    };
  }

  /**
   * Get weekly progress (last 4 weeks)
   */
  async getWeeklyProgress(userId) {
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000);

    const result = await ActivityLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: fourWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$date" },
            year: { $isoWeekYear: "$date" },
          },
          totalProblems: { $sum: "$count" },
          platforms: { $addToSet: "$platform" },
        },
      },
      { $sort: { "_id.year": -1, "_id.week": -1 } },
      { $limit: 4 },
    ]);

    return result.map((r) => ({
      week: r._id.week,
      year: r._id.year,
      totalProblems: r.totalProblems,
      platformsActive: r.platforms.length,
    }));
  }

  /**
   * Get platform distribution
   */
  async getPlatformDistribution(userId) {
    const result = await ActivityLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$platform",
          count: { $sum: "$count" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const total = result.reduce((sum, r) => sum + r.count, 0);

    return result.map((r) => ({
      platform: r._id,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));
  }

  /**
   * Calculate consistency score (0-100)
   */
  async getConsistencyScore(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const activities = await ActivityLog.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).select("date").lean();

    const uniqueDays = new Set(
      activities.map((a) => new Date(a.date).toISOString().split("T")[0])
    );

    const activeDays = uniqueDays.size;
    const score = Math.round((activeDays / 30) * 100);

    return {
      score,
      activeDays,
      totalDays: 30,
      rating: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Improvement",
    };
  }

  /**
   * Get peak coding hours
   */
  async getPeakHours(userId) {
    const result = await ActivityLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { $hour: "$date" },
          count: { $sum: "$count" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const hourLabels = result.map((r) => ({
      hour: r._id,
      label: `${r._id}:00 - ${r._id + 1}:00`,
      count: r.count,
    }));

    return {
      peakHour: hourLabels[0] || null,
      distribution: hourLabels,
    };
  }

  /**
   * Get heatmap data (last 365 days)
   */
  async getHeatmapData(userId) {
    const oneYearAgo = new Date(Date.now() - 365 * 86400000);

    const result = await ActivityLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          count: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((r) => ({
      date: r._id,
      count: r.count,
    }));
  }

  /**
   * Get trends (weekly/monthly comparison)
   */
  async getTrends(userId) {
    const now = new Date();
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastWeekStart = new Date(thisWeekStart - 7 * 86400000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisWeek, lastWeek, thisMonth, lastMonth] = await Promise.all([
      this.getCountInRange(userId, thisWeekStart, new Date()),
      this.getCountInRange(userId, lastWeekStart, thisWeekStart),
      this.getCountInRange(userId, thisMonthStart, new Date()),
      this.getCountInRange(userId, lastMonthStart, thisMonthStart),
    ]);

    return {
      weekly: {
        current: thisWeek,
        previous: lastWeek,
        change: lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 100,
      },
      monthly: {
        current: thisMonth,
        previous: lastMonth,
        change: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 100,
      },
    };
  }

  async getCountInRange(userId, start, end) {
    const result = await ActivityLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    return result[0]?.total || 0;
  }

  /**
   * Get overview dashboard
   */
  async getOverview(userId) {
    const [streak, consistency, distribution, trends, peakHours] = await Promise.all([
      this.getDailyStreak(userId),
      this.getConsistencyScore(userId),
      this.getPlatformDistribution(userId),
      this.getTrends(userId),
      this.getPeakHours(userId),
    ]);

    const totalProblems = distribution.reduce((sum, d) => sum + d.count, 0);

    return {
      totalProblems,
      streak,
      consistency,
      topPlatform: distribution[0] || null,
      trends,
      peakHour: peakHours.peakHour,
    };
  }

  /**
   * Log activity (used by scraping service)
   */
  async logActivity(userId, platform, action, count = 1, difficulty = "unknown", metadata = {}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert today's activity
    await ActivityLog.findOneAndUpdate(
      { userId, platform, action, date: today },
      { $inc: { count }, $set: { difficulty, metadata } },
      { upsert: true, new: true }
    );

    // Sync active sprints for the user
    try {
      const SprintService = (await import('./sprint.service.js')).default;
      await SprintService.syncSprintProgress(userId);
    } catch (error) {
      Logger.error("Failed to sync sprint progress after activity logging", { error: error.message, userId });
    }
  }
}

export default new AnalyticsService();