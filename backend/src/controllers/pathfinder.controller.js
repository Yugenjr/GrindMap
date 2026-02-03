import PathfinderService from "../services/pathfinder.service.js";
import RecommendationPath from "../models/recommendationPath.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";
import { AppError } from "../utils/appError.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

class PathfinderController {
    /**
     * Generate analysis and get current recommendation
     * GET /api/pathfinder/analysis
     */
    getAnalysis = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        // Check for existing active path
        let path = await RecommendationPath.findOne({
            userId,
            status: "active",
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        // If no active path, generate one immediately
        if (!path) {
            path = await PathfinderService.generatePath(userId);
        }

        sendSuccess(res, path, "Pathfinder analysis retrieved");
    });

    /**
     * Get suggestions only
     * GET /api/pathfinder/suggestions
     */
    getSuggestions = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const path = await RecommendationPath.findOne({
            userId,
            status: "active",
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!path) {
            // Trigger generation if missing
            const newPath = await PathfinderService.generatePath(userId);
            return sendSuccess(res, newPath.suggestedGoals, "Fresh suggestions generated");
        }

        sendSuccess(res, path.suggestedGoals, "Current suggestions retrieved");
    });

    /**
     * Accept recommendation and start sprint
     * POST /api/pathfinder/accept/:id
     */
    acceptSuggestion = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const sprint = await PathfinderService.acceptPath(userId, id);
        sendSuccess(res, sprint, "Recommendation accepted! Sprint started.", HTTP_STATUS.CREATED);
    });
}

export default new PathfinderController();
