import express from 'express';
import { WebSocketAuth } from '../utils/websocketAuth.js';
import WebSocketManager from '../utils/websocketManager.js';
import MessageQueue from '../utils/messageQueue.js';
import { verifyJWT } from '../middlewares/jwtManager.middleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Generate WebSocket token
router.post('/token', verifyJWT, (req, res) => {
  try {
    const { id, email } = req.user;
    const wsToken = WebSocketAuth.generateSocketToken(id, email);
    
    res.json({
      success: true,
      token: wsToken,
      expiresIn: '1h'
    });
  } catch (error) {
    Logger.error('WebSocket token generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Token generation failed'
    });
  }
});

// Get WebSocket connection stats
router.get('/stats', (req, res) => {
  try {
    const stats = {
      connectedClients: WebSocketManager.getClientsCount(),
      totalRooms: WebSocketManager.rooms?.size || 0,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    Logger.error('WebSocket stats failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

// Get room history
router.get('/rooms/:roomId/history', verifyJWT, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await MessageQueue.getRoomHistory(roomId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        roomId,
        messages: history,
        count: history.length
      }
    });
  } catch (error) {
    Logger.error('Room history retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get room history'
    });
  }
});

// Send message to user (admin endpoint)
router.post('/send-message', verifyJWT, async (req, res) => {
  try {
    const { targetUserId, message, type = 'admin_message' } = req.body;
    
    if (!targetUserId || !message) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId and message are required'
      });
    }
    
    const adminMessage = {
      type,
      content: message,
      senderId: req.user.id,
      timestamp: new Date().toISOString()
    };
    
    const delivered = WebSocketManager.sendToUser(targetUserId, adminMessage);
    
    if (!delivered) {
      await MessageQueue.queueMessage(targetUserId, adminMessage);
    }
    
    res.json({
      success: true,
      delivered,
      message: delivered ? 'Message sent' : 'Message queued'
    });
  } catch (error) {
    Logger.error('Admin message send failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Broadcast to room (admin endpoint)
router.post('/broadcast/:roomId', verifyJWT, (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, type = 'admin_broadcast' } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required'
      });
    }
    
    const broadcastMessage = {
      type,
      content: message,
      senderId: req.user.id,
      roomId,
      timestamp: new Date().toISOString()
    };
    
    WebSocketManager.broadcastToRoom(roomId, broadcastMessage);
    
    res.json({
      success: true,
      message: 'Broadcast sent'
    });
  } catch (error) {
    Logger.error('Room broadcast failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message'
    });
  }
});

export default router;