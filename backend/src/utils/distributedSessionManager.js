import Redis from 'ioredis';
import { randomUUID } from 'crypto';

class DistributedSessionManager {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    
    this.isConnected = false;
    this.localSessions = new Map(); // Fallback storage
    
    this.redis.on('connect', () => {
      this.isConnected = true;
    });
    
    this.redis.on('error', () => {
      this.isConnected = false;
    });
  }

  /**
   * Create new session
   */
  async createSession(userId, sessionData = {}) {
    const sessionId = randomUUID();
    const session = {
      id: sessionId,
      userId,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      ...sessionData
    };

    const key = `session:${sessionId}`;
    const ttl = 24 * 60 * 60; // 24 hours

    if (this.isConnected) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(session));
      } catch (error) {
        // Fallback to local storage
        this.localSessions.set(sessionId, session);
      }
    } else {
      this.localSessions.set(sessionId, session);
    }

    return sessionId;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    if (!sessionId) return null;

    const key = `session:${sessionId}`;

    if (this.isConnected) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          const session = JSON.parse(data);
          // Update last accessed time
          session.lastAccessed = new Date().toISOString();
          await this.redis.setex(key, 24 * 60 * 60, JSON.stringify(session));
          return session;
        }
      } catch (error) {
        // Fallback to local storage
        return this.localSessions.get(sessionId);
      }
    }

    return this.localSessions.get(sessionId);
  }

  /**
   * Update session data
   */
  async updateSession(sessionId, updates) {
    if (!sessionId) return false;

    const session = await this.getSession(sessionId);
    if (!session) return false;

    const updatedSession = {
      ...session,
      ...updates,
      lastAccessed: new Date().toISOString()
    };

    const key = `session:${sessionId}`;
    const ttl = 24 * 60 * 60;

    if (this.isConnected) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(updatedSession));
        return true;
      } catch (error) {
        this.localSessions.set(sessionId, updatedSession);
        return true;
      }
    }

    this.localSessions.set(sessionId, updatedSession);
    return true;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    if (!sessionId) return;

    const key = `session:${sessionId}`;

    if (this.isConnected) {
      try {
        await this.redis.del(key);
      } catch (error) {
        // Continue to local cleanup
      }
    }

    this.localSessions.delete(sessionId);
  }

  /**
   * Delete all sessions for user
   */
  async deleteUserSessions(userId) {
    if (this.isConnected) {
      try {
        const pattern = 'session:*';
        const keys = await this.redis.keys(pattern);
        
        for (const key of keys) {
          const data = await this.redis.get(key);
          if (data) {
            const session = JSON.parse(data);
            if (session.userId === userId) {
              await this.redis.del(key);
            }
          }
        }
      } catch (error) {
        // Fallback cleanup
      }
    }

    // Clean local sessions
    for (const [sessionId, session] of this.localSessions) {
      if (session.userId === userId) {
        this.localSessions.delete(sessionId);
      }
    }
  }

  /**
   * Session middleware
   */
  middleware() {
    return async (req, res, next) => {
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
      
      if (sessionId) {
        req.session = await this.getSession(sessionId);
      }
      
      next();
    };
  }
}

export default new DistributedSessionManager();