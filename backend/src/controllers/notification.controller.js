import NotificationService from '../services/notification.service.js';
import { sendSuccess } from '../utils/response.helper.js';
import { asyncHandler } from '../utils/asyncHandler.js';

class NotificationController {
  /**
   * Get user notifications
   * @route GET /api/notifications
   */
  getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const result = await NotificationService.getUserNotifications(
      userId, 
      parseInt(page), 
      parseInt(limit)
    );

    sendSuccess(res, result, 'Notifications retrieved successfully');
  });

  /**
   * Mark notifications as read
   * @route PUT /api/notifications/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;
    const userId = req.user.id;

    await NotificationService.markAsRead(userId, notificationIds);
    sendSuccess(res, null, 'Notifications marked as read');
  });

  /**
   * Get notification preferences
   * @route GET /api/notifications/preferences
   */
  getPreferences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const preferences = await NotificationService.getUserPreferences(userId);
    
    sendSuccess(res, preferences, 'Preferences retrieved successfully');
  });

  /**
   * Update notification preferences
   * @route PUT /api/notifications/preferences
   */
  updatePreferences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const preferences = await NotificationService.updatePreferences(userId, req.body);
    
    sendSuccess(res, preferences, 'Preferences updated successfully');
  });

  /**
   * Test notification (for development)
   * @route POST /api/notifications/test
   */
  testNotification = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type = 'system', title = 'Test Notification', message = 'This is a test notification' } = req.body;

    const notification = await NotificationService.createNotification(
      userId,
      type,
      title,
      message,
      { test: true }
    );

    sendSuccess(res, notification, 'Test notification sent');
  });
}

export default new NotificationController();