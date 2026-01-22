import { WebSocketServer } from 'ws';
import { WebSocketAuth } from './websocketAuth.js';
import MessageQueue from './messageQueue.js';
import Logger from './logger.js';
import DuelService from '../services/duel.service.js';

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.rooms = new Map(); // roomId -> Set of userIds
    this.userRooms = new Map(); // userId -> Set of roomIds
    this.heartbeatInterval = null;
  }

  initialize(server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();

    Logger.info('WebSocket server initialized with authentication');
  }

  verifyClient(info) {
    const auth = WebSocketAuth.authenticate(info.req);
    if (!auth.authenticated) {
      Logger.warn('WebSocket connection rejected', { error: auth.error });
      return false;
    }

    info.req.user = auth;
    return true;
  }

  async handleConnection(ws, request) {
    const user = request.user;
    const userId = user.userId;

    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    ws.userId = userId;
    ws.isAlive = true;
    ws.joinedRooms = new Set();

    Logger.info('WebSocket client connected', { userId, email: user.email });

    await this.deliverQueuedMessages(userId, ws);

    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('close', () => this.handleDisconnection(ws));
    ws.on('pong', () => { ws.isAlive = true; });

    this.sendToUser(userId, {
      type: 'connected',
      message: 'WebSocket connected successfully',
      timestamp: new Date().toISOString()
    });
  }

  async deliverQueuedMessages(userId, ws) {
    try {
      const queuedMessages = await MessageQueue.getQueuedMessages(userId);

      for (const msg of queuedMessages) {
        ws.send(JSON.stringify({
          type: 'queued_message',
          ...msg.message
        }));

        await MessageQueue.markDelivered(userId, msg.id);
      }

      if (queuedMessages.length > 0) {
        Logger.info('Delivered queued messages', { userId, count: queuedMessages.length });
      }
    } catch (error) {
      Logger.error('Failed to deliver queued messages', { userId, error: error.message });
    }
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      const userId = ws.userId;

      switch (message.type) {
        case 'join_room':
          this.joinRoom(userId, message.roomId, ws);
          break;
        case 'leave_room':
          this.leaveRoom(userId, message.roomId, ws);
          break;
        case 'room_message':
          this.handleRoomMessage(userId, message);
          break;
        case 'private_message':
          this.handlePrivateMessage(userId, message);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'activity_pulse':
          this.handleActivityPulse(userId, message);
          break;
        case 'pomodoro_sync':
          this.handlePomodoroSync(userId, message);
          break;
        case 'duel_invite':
          this.handleDuelInvite(userId, message);
          break;
        case 'duel_accept':
          this.handleDuelAccept(userId, message);
          break;
        case 'duel_start':
          this.handleDuelStart(userId, message);
          break;
        case 'duel_submit':
          this.handleDuelSubmit(userId, message);
          break;
        case 'duel_forfeit':
          this.handleDuelForfeit(userId, message);
          break;
        default:
          Logger.warn('Unknown message type', { type: message.type, userId });
      }
    } catch (error) {
      Logger.error('WebSocket message handling failed', { error: error.message });
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  }

  joinRoom(userId, roomId, ws) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);

    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId).add(roomId);

    ws.joinedRooms.add(roomId);

    Logger.info('User joined room', { userId, roomId });

    ws.send(JSON.stringify({
      type: 'room_joined',
      roomId,
      message: `Joined room ${roomId}`,
      timestamp: new Date().toISOString()
    }));

    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId,
      roomId,
      timestamp: new Date().toISOString()
    }, userId);
  }

  leaveRoom(userId, roomId, ws) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }

    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId).delete(roomId);
    }

    ws.joinedRooms.delete(roomId);

    Logger.info('User left room', { userId, roomId });

    ws.send(JSON.stringify({
      type: 'room_left',
      roomId,
      message: `Left room ${roomId}`,
      timestamp: new Date().toISOString()
    }));

    this.broadcastToRoom(roomId, {
      type: 'user_left',
      userId,
      roomId,
      timestamp: new Date().toISOString()
    }, userId);
  }

  async handleRoomMessage(userId, message) {
    const { roomId, content } = message;

    if (!this.rooms.has(roomId) || !this.rooms.get(roomId).has(userId)) {
      Logger.warn('User not in room', { userId, roomId });
      return;
    }

    const roomMessage = {
      type: 'room_message',
      roomId,
      userId,
      content,
      timestamp: new Date().toISOString()
    };

    await MessageQueue.persistMessage(roomId, roomMessage);
    this.broadcastToRoom(roomId, roomMessage);

    Logger.info('Room message sent', { userId, roomId });
  }

  async handlePrivateMessage(senderId, message) {
    const { targetUserId, content } = message;

    const privateMessage = {
      type: 'private_message',
      senderId,
      content,
      timestamp: new Date().toISOString()
    };

    const delivered = this.sendToUser(targetUserId, privateMessage);

    if (!delivered) {
      await MessageQueue.queueMessage(targetUserId, privateMessage);
      Logger.info('Private message queued', { senderId, targetUserId });
    } else {
      Logger.info('Private message delivered', { senderId, targetUserId });
    }
  }

  sendToUser(userId, message) {
    const userConnections = this.clients.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return false;
    }

    const messageStr = JSON.stringify(message);
    let delivered = false;

    userConnections.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(messageStr);
        delivered = true;
      }
    });

    return delivered;
  }

  broadcastToRoom(roomId, message, excludeUserId = null) {
    const roomUsers = this.rooms.get(roomId);
    if (!roomUsers) return;

    roomUsers.forEach(userId => {
      if (userId !== excludeUserId) {
        this.sendToUser(userId, message);
      }
    });
  }

  handleDisconnection(ws) {
    const userId = ws.userId;

    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }

    ws.joinedRooms.forEach(roomId => {
      this.leaveRoom(userId, roomId, ws);
    });

    Logger.info('WebSocket client disconnected', { userId });
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  getClientsCount() {
    return this.wss ? this.wss.clients.size : 0;
  }

  // Legacy compatibility
  broadcastPlatformUpdate(platform, username, data) {
    this.broadcastToRoom('platform_updates', {
      type: 'platform_update',
      platform,
      username,
      data,
      timestamp: new Date().toISOString()
    });
  }

  sendNotificationToUser(userId, notification) {
    this.sendToUser(userId, {
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  handleActivityPulse(userId, message) {
    const { roomId, platform, difficulty } = message;
    if (!this.rooms.has(roomId) || !this.rooms.get(roomId).has(userId)) return;

    this.broadcastToRoom(roomId, {
      type: 'activity_pulse',
      userId,
      platform,
      difficulty,
      timestamp: new Date().toISOString()
    }, userId);
  }

  handlePomodoroSync(userId, message) {
    const { roomId, action, duration } = message;
    if (!this.rooms.has(roomId) || !this.rooms.get(roomId).has(userId)) return;

    this.broadcastToRoom(roomId, {
      type: 'pomodoro_sync',
      userId,
      action, // 'start', 'pause', 'reset'
      duration,
      timestamp: new Date().toISOString()
    }, userId);
  }

  async handleDuelInvite(userId, message) {
    const { opponentId, problemId } = message;
    
    try {
      const duel = await DuelService.createDuel(userId, opponentId, problemId);
      
      // Response to the inviter
      this.sendToUser(userId, {
        type: 'duel:challenge_sent',
        duelId: duel._id,
        opponentId,
        status: 'sent',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.sendToUser(userId, {
        type: 'error',
        message: error.message || 'Failed to send duel invitation',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleDuelAccept(userId, message) {
    const { duelId } = message;
    
    try {
      const duel = await DuelService.acceptDuel(duelId, userId);
      
      // Notify both users that duel is accepted and ready to start
      const acceptData = {
        type: 'duel:accepted',
        duelId: duel._id,
        timestamp: new Date().toISOString()
      };
      
      this.sendToUser(duel.challengerId, acceptData);
      this.sendToUser(duel.opponentId, acceptData);
    } catch (error) {
      this.sendToUser(userId, {
        type: 'error',
        message: error.message || 'Failed to accept duel',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleDuelStart(userId, message) {
    const { duelId } = message;
    
    try {
      const duel = await DuelService.startDuel(duelId, userId);
      
      // The service already handles broadcasting the start event
    } catch (error) {
      this.sendToUser(userId, {
        type: 'error',
        message: error.message || 'Failed to start duel',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleDuelSubmit(userId, message) {
    const { duelId, submissionData } = message;
    
    try {
      const duel = await DuelService.submitSolution(duelId, userId, submissionData);
      
      // The service already handles broadcasting progress/completion
    } catch (error) {
      this.sendToUser(userId, {
        type: 'error',
        message: error.message || 'Failed to submit solution',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleDuelForfeit(userId, message) {
    const { duelId } = message;
    
    try {
      const duel = await DuelService.forfeitDuel(duelId, userId);
      
      // The service already handles broadcasting forfeit
    } catch (error) {
      this.sendToUser(userId, {
        type: 'error',
        message: error.message || 'Failed to forfeit duel',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new WebSocketManager();