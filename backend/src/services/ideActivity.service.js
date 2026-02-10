import IdeActivity from '../models/ideActivity.model.js';
import Activity from '../models/activity.model.js';
import User from '../models/user.model.js';
import WebSocketManager from '../utils/websocketManager.js';
import Logger from '../utils/logger.js';
import { AppError } from '../utils/appError.js';

class IdeActivityService {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> session data
    this.sessionTimeouts = new Map(); // sessionId -> timeout
  }

  /**
   * Process IDE activity data from webhook
   */
  async processIdeActivity(userId, activityData) {
    try {
      const {
        ideType,
        sessionId,
        activityType,
        filePath,
        platform,
        problemId,
        timestamp,
        metadata = {}
      } = activityData;

      // Validate required fields
      if (!ideType || !sessionId || !activityType) {
        throw new AppError('Missing required fields: ideType, sessionId, activityType', 400);
      }

      // Create activity record
      const activity = new IdeActivity({
        user: userId,
        ideType,
        sessionId,
        activityType,
        filePath,
        platform,
        problemId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        metadata
      });

      await activity.save();

      // Process activity for session tracking and real-time updates
      await this.processActivityForSession(userId, activity);

      // Detect and handle special events
      await this.handleSpecialEvents(userId, activity);

      Logger.info('IDE activity processed', {
        userId,
        sessionId,
        activityType,
        platform
      });

      return activity;
    } catch (error) {
      Logger.error('Failed to process IDE activity', {
        userId,
        error: error.message,
        activityData
      });
      throw error;
    }
  }

  /**
   * Process activity for session tracking
   */
  async processActivityForSession(userId, activity) {
    const { sessionId, activityType, timestamp, metadata } = activity;

    if (activityType === 'session_start') {
      // Start new session
      this.activeSessions.set(sessionId, {
        userId,
        startTime: timestamp,
        lastActivity: timestamp,
        activities: [],
        totalTimeSpent: 0,
        platform: activity.platform,
        problemId: activity.problemId
      });

      // Set session timeout (auto-end after 2 hours of inactivity)
      this.setSessionTimeout(sessionId);

      // Broadcast session start
      WebSocketManager.sendToUser(userId, {
        type: 'coding_session_start',
        sessionId,
        platform: activity.platform,
        problemId: activity.problemId,
        timestamp: timestamp.toISOString()
      });

    } else if (activityType === 'session_end') {
      // End session
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.endTime = timestamp;
        session.totalTimeSpent = timestamp - session.startTime;

        // Clear timeout
        if (this.sessionTimeouts.has(sessionId)) {
          clearTimeout(this.sessionTimeouts.get(sessionId));
          this.sessionTimeouts.delete(sessionId);
        }

        // Broadcast session end with summary
        WebSocketManager.sendToUser(userId, {
          type: 'coding_session_end',
          sessionId,
          duration: session.totalTimeSpent,
          platform: session.platform,
          problemId: session.problemId,
          timestamp: timestamp.toISOString()
        });

        this.activeSessions.delete(sessionId);
      }

    } else {
      // Update existing session
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.lastActivity = timestamp;
        session.activities.push(activity);

        // Add time spent if provided
        if (metadata.timeSpent) {
          session.totalTimeSpent += metadata.timeSpent;
        }

        // Reset session timeout
        this.resetSessionTimeout(sessionId);
      }
    }
  }

  /**
   * Handle special events like submissions
   */
  async handleSpecialEvents(userId, activity) {
    const { activityType, platform, problemId, metadata } = activity;

    if (activityType === 'submission_attempt') {
      // Broadcast submission attempt
      WebSocketManager.sendToUser(userId, {
        type: 'submission_attempt',
        platform,
        problemId,
        timestamp: activity.timestamp.toISOString()
      });

    } else if (activityType === 'submission_success') {
      // Record successful submission
      try {
        const existingActivity = await Activity.findOne({
          user: userId,
          platform,
          problemId
        });

        if (!existingActivity) {
          // Create new activity record
          const newActivity = new Activity({
            user: userId,
            platform,
            problemId,
            problemName: metadata.problemName || `Problem ${problemId}`,
            difficulty: metadata.difficulty || 'medium',
            score: this.calculateScore(metadata),
            solvedAt: activity.timestamp
          });

          await newActivity.save();

          // Broadcast successful submission
          WebSocketManager.sendToUser(userId, {
            type: 'submission_success',
            platform,
            problemId,
            difficulty: metadata.difficulty,
            score: newActivity.score,
            timestamp: activity.timestamp.toISOString()
          });
        }
      } catch (error) {
        Logger.error('Failed to record submission activity', {
          userId,
          platform,
          problemId,
          error: error.message
        });
      }
    }
  }

  /**
   * Calculate score based on submission metadata
   */
  calculateScore(metadata) {
    const { difficulty, timeComplexity, spaceComplexity, executionTime } = metadata;

    let baseScore = 10; // Base points

    // Difficulty multiplier
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2
    };

    baseScore *= difficultyMultiplier[difficulty] || 1;

    // Bonus for optimal solutions
    if (timeComplexity && timeComplexity.includes('O(1)')) baseScore += 5;
    if (spaceComplexity && spaceComplexity.includes('O(1)')) baseScore += 5;

    // Execution time bonus (faster is better)
    if (executionTime && executionTime < 100) baseScore += 3;

    return Math.round(baseScore);
  }

  /**
   * Set session timeout
   */
  setSessionTimeout(sessionId) {
    const timeout = setTimeout(() => {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        Logger.info('Auto-ending inactive session', { sessionId });
        this.endSession(sessionId);
      }
    }, 2 * 60 * 60 * 1000); // 2 hours

    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * Reset session timeout
   */
  resetSessionTimeout(sessionId) {
    if (this.sessionTimeouts.has(sessionId)) {
      clearTimeout(this.sessionTimeouts.get(sessionId));
    }
    this.setSessionTimeout(sessionId);
  }

  /**
   * Manually end session
   */
  async endSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const endTime = new Date();
      session.endTime = endTime;
      session.totalTimeSpent = endTime - session.startTime;

      // Clear timeout
      if (this.sessionTimeouts.has(sessionId)) {
        clearTimeout(this.sessionTimeouts.get(sessionId));
        this.sessionTimeouts.delete(sessionId);
      }

      // Broadcast session end
      WebSocketManager.sendToUser(session.userId, {
        type: 'coding_session_end',
        sessionId,
        duration: session.totalTimeSpent,
        platform: session.platform,
        problemId: session.problemId,
        timestamp: endTime.toISOString()
      });

      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Get user's coding sessions
   */
  async getUserSessions(userId, limit = 50) {
    try {
      const sessions = await IdeActivity.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$sessionId',
            startTime: { $min: '$timestamp' },
            endTime: { $max: '$timestamp' },
            platform: { $first: '$platform' },
            problemId: { $first: '$problemId' },
            activities: { $sum: 1 },
            totalTimeSpent: {
              $sum: {
                $cond: {
                  if: { $gt: ['$metadata.timeSpent', 0] },
                  then: '$metadata.timeSpent',
                  else: 0
                }
              }
            }
          }
        },
        {
          $project: {
            sessionId: '$_id',
            startTime: 1,
            endTime: 1,
            platform: 1,
            problemId: 1,
            activities: 1,
            totalTimeSpent: 1,
            duration: { $subtract: ['$endTime', '$startTime'] }
          }
        },
        { $sort: { startTime: -1 } },
        { $limit: limit }
      ]);

      return sessions;
    } catch (error) {
      Logger.error('Failed to get user sessions', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get coding analytics
   */
  async getCodingAnalytics(userId, startDate, endDate) {
    try {
      const matchStage = { user: userId };
      if (startDate && endDate) {
        matchStage.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const analytics = await IdeActivity.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              platform: '$platform',
              activityType: '$activityType'
            },
            count: { $sum: 1 },
            totalTimeSpent: {
              $sum: {
                $cond: {
                  if: { $gt: ['$metadata.timeSpent', 0] },
                  then: '$metadata.timeSpent',
                  else: 0
                }
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.platform',
            activities: {
              $push: {
                type: '$_id.activityType',
                count: '$count',
                timeSpent: '$totalTimeSpent'
              }
            },
            totalActivities: { $sum: '$count' },
            totalTimeSpent: { $sum: '$totalTimeSpent' }
          }
        },
        {
          $project: {
            platform: '$_id',
            activities: 1,
            totalActivities: 1,
            totalTimeSpent: 1,
            avgSessionTime: {
              $cond: {
                if: { $gt: ['$totalActivities', 0] },
                then: { $divide: ['$totalTimeSpent', '$totalActivities'] },
                else: 0
              }
            }
          }
        }
      ]);

      return analytics;
    } catch (error) {
      Logger.error('Failed to get coding analytics', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Clean up inactive sessions (called periodically)
   */
  cleanupInactiveSessions() {
    const now = Date.now();
    const inactiveThreshold = 2 * 60 * 60 * 1000; // 2 hours

    for (const [sessionId, session] of this.activeSessions) {
      if (now - session.lastActivity > inactiveThreshold) {
        Logger.info('Cleaning up inactive session', { sessionId });
        this.endSession(sessionId);
      }
    }
  }
}

export default new IdeActivityService();
