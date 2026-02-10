import IdeActivityService from '../services/ideActivity.service.js';
import IdeActivity from '../models/ideActivity.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.helper.js';
import Logger from '../utils/logger.js';

class IdeActivityController {
  /**
   * Handle IDE activity webhook
   * POST /api/webhook/ide-activity
   */
  handleWebhook = asyncHandler(async (req, res) => {
    const { userId } = req.body; // Extracted from webhook auth middleware
    const activityData = req.body;

    // Remove userId from activity data to avoid duplication
    delete activityData.userId;

    const activity = await IdeActivityService.processIdeActivity(userId, activityData);

    Logger.info('IDE activity webhook processed', {
      userId,
      activityType: activity.activityType,
      sessionId: activity.sessionId
    });

    sendSuccess(res, {
      activityId: activity._id,
      processed: true
    }, 'IDE activity recorded successfully');
  });

  /**
   * Get user's coding sessions
   * GET /api/ide-activity/sessions
   */
  getSessions = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const sessions = await IdeActivityService.getUserSessions(userId, parseInt(limit));

    sendSuccess(res, { sessions }, 'Coding sessions retrieved successfully');
  });

  /**
   * Get coding analytics
   * GET /api/ide-activity/analytics
   */
  getAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const analytics = await IdeActivityService.getCodingAnalytics(userId, startDate, endDate);

    sendSuccess(res, { analytics }, 'Coding analytics retrieved successfully');
  });

  /**
   * Get active coding sessions
   * GET /api/ide-activity/active-sessions
   */
  getActiveSessions = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get active sessions for this user
    const activeSessions = [];
    for (const [sessionId, session] of IdeActivityService.activeSessions) {
      if (session.userId === userId) {
        activeSessions.push({
          sessionId,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          platform: session.platform,
          problemId: session.problemId,
          totalTimeSpent: session.totalTimeSpent,
          activities: session.activities.length
        });
      }
    }

    sendSuccess(res, { activeSessions }, 'Active sessions retrieved successfully');
  });

  /**
   * Manually end a coding session
   * POST /api/ide-activity/end-session
   */
  endSession = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    // Verify session belongs to user
    const session = IdeActivityService.activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    await IdeActivityService.endSession(sessionId);

    sendSuccess(res, { sessionId }, 'Session ended successfully');
  });

  /**
   * Get session details
   * GET /api/ide-activity/session/:sessionId
   */
  getSessionDetails = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { sessionId } = req.params;

    // Check if it's an active session
    const activeSession = IdeActivityService.activeSessions.get(sessionId);
    if (activeSession && activeSession.userId === userId) {
      sendSuccess(res, {
        session: {
          sessionId,
          startTime: activeSession.startTime,
          lastActivity: activeSession.lastActivity,
          platform: activeSession.platform,
          problemId: activeSession.problemId,
          totalTimeSpent: activeSession.totalTimeSpent,
          activities: activeSession.activities.length,
          isActive: true
        }
      }, 'Session details retrieved successfully');
      return;
    }

    // Get from database
    const activities = await IdeActivityService.getSessionActivities(userId, sessionId);

    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = {
      sessionId,
      startTime: activities[0].timestamp,
      endTime: activities[activities.length - 1].timestamp,
      platform: activities[0].platform,
      problemId: activities[0].problemId,
      activities: activities,
      totalTimeSpent: activities.reduce((total, activity) =>
        total + (activity.metadata?.timeSpent || 0), 0),
      isActive: false
    };

    sendSuccess(res, { session }, 'Session details retrieved successfully');
  });
}

export default new IdeActivityController();
