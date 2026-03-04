import SprintService from "../services/sprint.service.js";
import Sprint from "../models/sprint.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";
import { AppError } from "../utils/appError.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

class SprintController {
    /**
     * Create new sprint
     * POST /api/sprints
     */
    createSprint = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { targets, days } = req.body;

        if (!targets || !targets.length || !days) {
            throw new AppError("Targets and duration (days) are required", HTTP_STATUS.BAD_REQUEST);
        }

        const sprint = await SprintService.createSprint(userId, { targets, days });
        sendSuccess(res, sprint, "Sprint started successfully", HTTP_STATUS.CREATED);
    });

    /**
     * Get active sprints
     * GET /api/sprints/active
     */
    getActiveSprints = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        // Sync progress before returning
        await SprintService.syncSprintProgress(userId);

        const sprints = await Sprint.find({ userId, status: "active" });
        sendSuccess(res, sprints, "Active sprints retrieved");
    });

    /**
     * Get sprint history
     * GET /api/sprints/history
     */
    getSprintHistory = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const sprints = await Sprint.find({
            userId,
            status: { $in: ["completed", "failed", "cancelled"] }
        }).sort({ createdAt: -1 });

        sendSuccess(res, sprints, "Sprint history retrieved");
    });

    /**
     * Cancel an active sprint
     * PUT /api/sprints/:id/cancel
     */
    cancelSprint = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const sprint = await Sprint.findOne({ _id: id, userId, status: "active" });
        if (!sprint) {
            throw new AppError("Active sprint not found", HTTP_STATUS.NOT_FOUND);
        }

        sprint.status = "cancelled";
        await sprint.save();

        sendSuccess(res, null, "Sprint cancelled successfully");
    });
}

export default new SprintController();
