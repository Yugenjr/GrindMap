import express from "express";
import AnalyticsController from "../controllers/analytics.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics dashboard overview
 * @access  Private
 */
router.get("/overview", AnalyticsController.getOverview);

/**
 * @route   GET /api/analytics/streak
 * @desc    Get streak details (current & longest)
 * @access  Private
 */
router.get("/streak", AnalyticsController.getStreak);

/**
 * @route   GET /api/analytics/heatmap
 * @desc    Get activity heatmap data (365 days)
 * @access  Private
 */
router.get("/heatmap", AnalyticsController.getHeatmap);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get weekly/monthly trends
 * @access  Private
 */
router.get("/trends", AnalyticsController.getTrends);

/**
 * @route   GET /api/analytics/weekly
 * @desc    Get weekly progress (last 4 weeks)
 * @access  Private
 */
router.get("/weekly", AnalyticsController.getWeeklyProgress);

/**
 * @route   GET /api/analytics/platforms
 * @desc    Get platform distribution
 * @access  Private
 */
router.get("/platforms", AnalyticsController.getPlatformDistribution);

/**
 * @route   GET /api/analytics/consistency
 * @desc    Get consistency score (0-100)
 * @access  Private
 */
router.get("/consistency", AnalyticsController.getConsistency);

/**
 * @route   GET /api/analytics/peak-hours
 * @desc    Get peak coding hours
 * @access  Private
 */
router.get("/peak-hours", AnalyticsController.getPeakHours);

export default router;