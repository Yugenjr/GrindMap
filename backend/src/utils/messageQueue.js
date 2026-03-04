import { createClient } from 'redis';
import Logger from './logger.js';

class MessageQueue {
  constructor() {
    this.redis = null;
    this.connected = false;
    this.messageBuffer = new Map(); // Fallback for when Redis is unavailable
    this.init();
  }

  async init() {
    try {
      this.redis = createClient({ 
        url: process.env.REDIS_URL,
        socket: { reconnectStrategy: false }
      });
      
      this.redis.on('connect', () => {
        this.connected = true;
        Logger.info('Message queue connected to Redis');
      });
      
      this.redis.on('error', () => {
        this.connected = false;
      });
      
      await this.redis.connect();
    } catch (error) {
      Logger.warn('Message queue using memory fallback');
      this.connected = false;
    }
  }

  async queueMessage(userId, message) {
    const messageData = {
      id: Date.now() + Math.random(),
      userId,
      message,
      timestamp: new Date().toISOString(),
      delivered: false
    };

    if (this.connected) {
      try {
        await this.redis.lpush(`queue:${userId}`, JSON.stringify(messageData));
        await this.redis.expire(`queue:${userId}`, 3600); // 1 hour TTL
        return messageData.id;
      } catch (error) {
        Logger.warn('Redis queue failed, using memory buffer');
      }
    }

    // Fallback to memory buffer
    if (!this.messageBuffer.has(userId)) {
      this.messageBuffer.set(userId, []);
    }
    this.messageBuffer.get(userId).push(messageData);
    
    // Limit buffer size
    const userQueue = this.messageBuffer.get(userId);
    if (userQueue.length > 100) {
      userQueue.shift();
    }
    
    return messageData.id;
  }

  async getQueuedMessages(userId) {
    if (this.connected) {
      try {
        const messages = await this.redis.lrange(`queue:${userId}`, 0, -1);
        await this.redis.del(`queue:${userId}`);
        return messages.map(msg => JSON.parse(msg));
      } catch (error) {
        Logger.warn('Redis retrieval failed, checking memory buffer');
      }
    }

    // Fallback to memory buffer
    const messages = this.messageBuffer.get(userId) || [];
    this.messageBuffer.delete(userId);
    return messages;
  }

  async markDelivered(userId, messageId) {
    if (this.connected) {
      try {
        await this.redis.hset(`delivered:${userId}`, messageId, Date.now());
        await this.redis.expire(`delivered:${userId}`, 3600);
      } catch (error) {
        Logger.warn('Failed to mark message as delivered');
      }
    }
  }

  async persistMessage(roomId, message) {
    const key = `room:${roomId}:messages`;
    const messageData = {
      ...message,
      timestamp: new Date().toISOString()
    };

    if (this.connected) {
      try {
        await this.redis.lpush(key, JSON.stringify(messageData));
        await this.redis.ltrim(key, 0, 99); // Keep last 100 messages
        await this.redis.expire(key, 86400); // 24 hours
      } catch (error) {
        Logger.warn('Message persistence failed');
      }
    }
  }

  async getRoomHistory(roomId, limit = 50) {
    if (!this.connected) return [];

    try {
      const messages = await this.redis.lrange(`room:${roomId}:messages`, 0, limit - 1);
      return messages.map(msg => JSON.parse(msg)).reverse();
    } catch (error) {
      Logger.warn('Failed to retrieve room history');
      return [];
    }
  }
}

export default new MessageQueue();