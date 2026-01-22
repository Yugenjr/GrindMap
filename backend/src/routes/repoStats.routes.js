import express from "express";
import {
  trackView,
  getStats,
  getViewBadge
} from "../controllers/repoStats.controller.js";

const router = express.Router();

// Track a view (public endpoint)
router.post("/track", trackView);

// Get repository statistics (public endpoint)
router.get("/stats", getStats);

// Get SVG badge for views count (public endpoint)
router.get("/badge", getViewBadge);

export default router;
