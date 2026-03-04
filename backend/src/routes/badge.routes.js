import express from "express";
import {
  initializeBadges,
  getUserBadges,
  checkAndAwardBadges,
  markBadgesAsSeen,
  getAllBadges,
  getBadgeStats
} from "../controllers/badge.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Initialize badges (admin only - should be called once)
router.post("/initialize", initializeBadges);

// Get all available badges
router.get("/all", getAllBadges);

// Get badge statistics
router.get("/stats", getBadgeStats);

// Protected routes (require authentication)
router.use(protect);

// Get user's badges with progress
router.get("/", getUserBadges);

// Check and award badges based on user stats
router.post("/check", checkAndAwardBadges);

// Mark badges as seen
router.post("/seen", markBadgesAsSeen);

export default router;