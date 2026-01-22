import express from "express";
import SprintController from "../controllers/sprint.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

/**
 * @route   POST /api/sprints
 * @desc    Start a new time-bound goal sprint
 */
router.post("/", SprintController.createSprint);

/**
 * @route   GET /api/sprints/active
 * @desc    Get all active sprints with live progress
 */
router.get("/active", SprintController.getActiveSprints);

/**
 * @route   GET /api/sprints/history
 * @desc    Get archive of completed/failed/cancelled sprints
 */
router.get("/history", SprintController.getSprintHistory);

/**
 * @route   PUT /api/sprints/:id/cancel
 * @desc    Manually cancel an active sprint
 */
router.put("/:id/cancel", SprintController.cancelSprint);

export default router;
