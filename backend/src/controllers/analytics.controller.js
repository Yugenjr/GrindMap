import AnalyticsService from "../services/analytics.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";

class AnalyticsController {
  /**
   * Get analytics overview
   * GET /api/analytics/overview
   */
  getOverview = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await AnalyticsService.getOverview(userId);
    sendSuccess(res, data, "Analytics overview retrieved");
  });

  /**
   * Get streak details
   * GET /api/analytics/streak
   */
  getStreak = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await AnalyticsService.getDailyStreak(userId);
    sendSuccess(res, data, "Streak data retrieved");
  });

  /**
   * Get heatmap data
   * GET /api/analytics/heatmap
   */
  getHeatmap = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await AnalyticsService.getHeatmapData(userId);
    sendSuccess(res, data, "Heatmap data retrieved");
  });

  /**
   * Get weekly/monthly trends
   * GET /api/analytics/trends
   */
  getTrends = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await AnalyticsService.getTrends(userId);
    sendSuccess(res, data, "Trends data retrieved");
  });

  /**
   * Get weekly progress
   * GET /api/analytics/weekly
   */
  getWeeklyProgress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await AnalyticsService.getWeeklyProgress(userId);
    sendSuccess(res, data, "Weekly progress retrieved");
  });

  /**
   * Get platform distribution
   * GET /api/analytics/platforms
   */
  getPlatformDistribution = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await AnalyticsService.getPlatformDistribution(userId);
    sendSuccess(res, data, "Platform distribution retrieved");
  });

  /**
   * Get consistency score
   * GET /api/analytics/consistency
   */
  getConsistency = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await AnalyticsService.getConsistencyScore(userId);
    sendSuccess(res, data, "Consistency score retrieved");
  });

  /**
   * Get peak hours
   * GET /api/analytics/peak-hours
   */
  getPeakHours = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await AnalyticsService.getPeakHours(userId);
    sendSuccess(res, data, "Peak hours retrieved");
  });
}

export default new AnalyticsController();