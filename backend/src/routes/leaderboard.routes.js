import express from "express";
import LeaderboardController from "../controllers/leaderboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateSearchQuery } from "../middlewares/validation.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/global", LeaderboardController.getGlobalLeaderboard);
router.get("/friends", LeaderboardController.getFriendsLeaderboard);

export default router;