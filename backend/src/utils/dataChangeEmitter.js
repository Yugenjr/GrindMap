import { EventEmitter } from 'events';
import WebSocketManager from './websocketManager.js';
import Logger from './logger.js';

class DataChangeEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Listen for platform data updates
    this.on('platform_data_updated', (data) => {
      this.handlePlatformUpdate(data);
    });

    // Listen for user profile updates
    this.on('user_profile_updated', (data) => {
      this.handleUserUpdate(data);
    });

    // Listen for system notifications
    this.on('system_notification', (data) => {
      this.handleSystemNotification(data);
    });
  }

  /**
   * Handle platform data updates
   */
  handlePlatformUpdate({ platform, username, data, userId }) {
    // Broadcast to WebSocket clients
    WebSocketManager.broadcastPlatformUpdate(platform, username, data);

    // Log the update
    Logger.info('Platform data updated', { 
      platform, 
      username, 
      userId 
    });
  }

  /**
   * Handle user profile updates
   */
  handleUserUpdate({ userId, changes }) {
    WebSocketManager.sendToUser(userId, {
      type: 'profile_updated',
      changes,
      timestamp: new Date().toISOString()
    });

    Logger.info('User profile updated', { userId, changes });
  }

  /**
   * Handle system notifications
   */
  handleSystemNotification({ type, message, userId }) {
    if (userId) {
      // Send to specific user
      WebSocketManager.sendToUser(userId, {
        type: 'notification',
        notificationType: type,
        message,
        timestamp: new Date().toISOString()
      });
    } else {
      // Broadcast to all users
      const notification = JSON.stringify({
        type: 'notification',
        notificationType: type,
        message,
        timestamp: new Date().toISOString()
      });

      for (const [userId, connections] of WebSocketManager.clients) {
        for (const ws of connections) {
          ws.send(notification);
        }
      }
    }

    Logger.info('System notification sent', { type, message, userId });
  }

  /**
   * Emit platform data update
   */
  emitPlatformUpdate(platform, username, data, userId) {
    this.emit('platform_data_updated', {
      platform,
      username,
      data,
      userId
    });
  }

  /**
   * Emit user profile update
   */
  emitUserUpdate(userId, changes) {
    this.emit('user_profile_updated', {
      userId,
      changes
    });
  }

  /**
   * Emit system notification
   */
  emitNotification(type, message, userId = null) {
    this.emit('system_notification', {
      type,
      message,
      userId
    });
  }
}

export default new DataChangeEmitter();