import AchievementService from "../services/achievement.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";

class AchievementController {
    /**
     * Get all achievements and user progress
     * GET /api/achievements
     */
    getAchievements = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const achievements = await AchievementService.getUserAchievements(userId);
        sendSuccess(res, achievements, "Achievements retrieved successfully");
    });
}

export default new AchievementController();
