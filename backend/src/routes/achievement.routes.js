import express from "express";
import AchievementController from "../controllers/achievement.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", AchievementController.getAchievements);

export default router;
