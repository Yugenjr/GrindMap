import express from "express";
import {
  initializeGoalTemplates,
  getGoalTemplates,
  getUserGoals,
  createCustomGoal,
  createGoalFromTemplate,
  updateGoalProgress,
  updateGoal,
  deleteGoal,
  getGoalStats,
  getGoalsNeedingReminders,
  markReminderSent
} from "../controllers/goal.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateGoal } from "../middlewares/validation.middleware.js";
import { param, body } from "express-validator";
import { handleValidationErrors } from "../middlewares/validation.middleware.js";

const router = express.Router();

// Initialize goal templates (admin only - should be called once)
router.post("/initialize", initializeGoalTemplates);

// Get goal templates
router.get("/templates", getGoalTemplates);

// Get goals needing reminders (for cron job)
router.get("/reminders", getGoalsNeedingReminders);

// Mark reminder as sent
router.post("/:goalId/reminder-sent", [
  param('goalId').isMongoId().withMessage('Invalid goal ID format').escape(),
  handleValidationErrors
], markReminderSent);

// Protected routes (require authentication)
router.use(protect);

// Get user's goals
router.get("/", getUserGoals);

// Get goal statistics
router.get("/stats", getGoalStats);

// Create custom goal
router.post("/custom", validateGoal, createCustomGoal);

// Create goal from template
router.post("/template", [
  body('templateId').isMongoId().withMessage('Invalid template ID format').escape(),
  body('targetValue').optional().isInt({ min: 1, max: 10000 }).withMessage('Target value must be between 1 and 10000'),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline format'),
  handleValidationErrors
], createGoalFromTemplate);

// Update goal progress
router.patch("/:goalId/progress", [
  param('goalId').isMongoId().withMessage('Invalid goal ID format').escape(),
  body('progress').isInt({ min: 0 }).withMessage('Progress must be non-negative'),
  handleValidationErrors
], updateGoalProgress);

// Update goal settings
router.patch("/:goalId", [
  param('goalId').isMongoId().withMessage('Invalid goal ID format').escape(),
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Goal title must be 1-100 characters').escape(),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters').escape(),
  body('targetValue').optional().isInt({ min: 1, max: 10000 }).withMessage('Target value must be between 1 and 10000'),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline format'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean value'),
  handleValidationErrors
], updateGoal);

// Delete goal
router.delete("/:goalId", [
  param('goalId').isMongoId().withMessage('Invalid goal ID format').escape(),
  handleValidationErrors
], deleteGoal);

export default router;