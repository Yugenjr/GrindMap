import Notification from '../models/notification.model.js';
import NotificationPreferences from '../models/notificationPreferences.model.js';
import WebSocketManager from '../utils/websocketManager.js';
import Logger from '../utils/logger.js';

class NotificationService {
  /**
   * Create and send notification
   */
  async createNotification(userId, type, title, message, data = {}) {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      if (!this.shouldSendNotification(preferences, type)) {
        return null;
      }

      // Create notification in database
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data
      });

      // Send real-time notification
      this.sendRealTimeNotification(userId, notification, preferences);

      Logger.info('Notification created', { userId, type, title });
      return notification;
    } catch (error) {
      Logger.error('Failed to create notification', { error: error.message, userId, type });
      throw error;
    }
  }

  /**
   * Send real-time notification via WebSocket
   */
  sendRealTimeNotification(userId, notification, preferences) {
    const notificationData = {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      sound: this.shouldPlaySound(preferences, notification.type)
    };

    WebSocketManager.sendNotificationToUser(userId, notificationData);
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId) {
    let preferences = await NotificationPreferences.findOne({ userId });
    
    if (!preferences) {
      // Create default preferences
      preferences = await NotificationPreferences.create({ userId });
    }
    
    return preferences;
  }

  /**
   * Check if notification should be sent based on preferences
   */
  shouldSendNotification(preferences, type) {
    const typeMap = {
      'friend_progress': 'friendProgress',
      'achievement': 'achievements',
      'streak': 'streaks',
      'system': 'system'
    };

    const prefKey = typeMap[type];
    return preferences[prefKey]?.enabled !== false;
  }

  /**
   * Check if sound should be played
   */
  shouldPlaySound(preferences, type) {
    const typeMap = {
      'friend_progress': 'friendProgress',
      'achievement': 'achievements',
      'streak': 'streaks',
      'system': 'system'
    };

    const prefKey = typeMap[type];
    return preferences[prefKey]?.sound === true;
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId, notificationIds) {
    await Notification.updateMany(
      { userId, _id: { $in: notificationIds } },
      { read: true }
    );
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId, preferences) {
    return await NotificationPreferences.findOneAndUpdate(
      { userId },
      preferences,
      { new: true, upsert: true }
    );
  }

  /**
   * Notify friends about progress update
   */
  async notifyFriendsProgress(userId, platform, problemsSolved, username) {
    // This would require a friends system - for now, broadcast to all users
    const message = `${username} solved a problem on ${platform}! Total: ${problemsSolved}`;
    
    // In a real implementation, you'd get the user's friends list
    // For demo purposes, we'll just log it
    Logger.info('Friend progress notification', { userId, platform, problemsSolved });
  }
}

export default new NotificationService();