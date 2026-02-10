import express from 'express';
import IdeActivityController from '../controllers/ideActivity.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Webhook endpoint (no auth required - uses webhook signature validation)
router.post('/webhook/ide-activity', IdeActivityController.handleWebhook);

// All other routes require authentication
router.use(protect);

/**
 * @route   GET /api/ide-activity/sessions
 * @desc    Get user's coding sessions
 * @access  Private
 */
router.get('/sessions', IdeActivityController.getSessions);

/**
 * @route   GET /api/ide-activity/analytics
 * @desc    Get coding analytics
 * @access  Private
 */
router.get('/analytics', IdeActivityController.getAnalytics);

/**
 * @route   GET /api/ide-activity/active-sessions
 * @desc    Get active coding sessions
 * @access  Private
 */
router.get('/active-sessions', IdeActivityController.getActiveSessions);

/**
 * @route   POST /api/ide-activity/end-session
 * @desc    Manually end a coding session
 * @access  Private
 */
router.post('/end-session', IdeActivityController.endSession);

/**
 * @route   GET /api/ide-activity/session/:sessionId
 * @desc    Get session details
 * @access  Private
 */
router.get('/session/:sessionId', IdeActivityController.getSessionDetails);

export default router;
