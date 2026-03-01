import express from "express";
import SprintController from "../controllers/sprint.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateSprint } from "../middlewares/validation.middleware.js";
import { param } from "express-validator";
import { handleValidationErrors } from "../middlewares/validation.middleware.js";

const router = express.Router();

router.use(protect);

/**
 * @route   POST /api/sprints
 * @desc    Start a new time-bound goal sprint
 */
router.post("/", validateSprint, SprintController.createSprint);

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
router.put("/:id/cancel", [
  param('id').isMongoId().withMessage('Invalid sprint ID format').escape(),
  handleValidationErrors
], SprintController.cancelSprint);

export default router;
