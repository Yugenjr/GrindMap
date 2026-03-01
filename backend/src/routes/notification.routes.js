import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { body, query } from 'express-validator';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination
 * @access  Private
 */
router.get(
  '/',
  protect,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  NotificationController.getNotifications
);

/**
 * @route   PUT /api/notifications/read
 * @desc    Mark notifications as read
 * @access  Private
 */
router.put(
  '/read',
  protect,
  [
    body('notificationIds')
      .isArray({ min: 1 })
      .withMessage('notificationIds must be a non-empty array')
      .custom((value) => {
        return value.every(id => typeof id === 'string' && id.length === 24);
      })
      .withMessage('All notification IDs must be valid MongoDB ObjectIds')
  ],
  NotificationController.markAsRead
);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/preferences', protect, NotificationController.getPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/preferences', protect, NotificationController.updatePreferences);

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification (development only)
 * @access  Private
 */
router.post(
  '/test',
  protect,
  [
    body('type').optional().isIn(['friend_progress', 'achievement', 'streak', 'system']),
    body('title').optional().isLength({ min: 1, max: 100 }),
    body('message').optional().isLength({ min: 1, max: 500 })
  ],
  NotificationController.testNotification
);

export default router;