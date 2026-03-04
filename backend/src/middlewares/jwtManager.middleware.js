import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import Logger from '../utils/logger.js';

let redis;
let redisConnected = false;

// Initialize Redis with error handling (no auto-retry)
try {
  redis = createClient({ 
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: false
    }
  });
  redis.on('error', () => redisConnected = false);
  redis.on('connect', () => redisConnected = true);
  redis.connect().catch(() => redisConnected = false);
} catch (error) {
  redisConnected = false;
}

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';

export class JWTManager {
  static generateTokens(payload) {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
    
    return { accessToken, refreshToken };
  }
  
  static async storeRefreshToken(userId, refreshToken) {
    if (redisConnected) {
      try {
        await redis.setex(`refresh:${userId}`, 604800, refreshToken);
      } catch (error) {
        Logger.warn('Failed to store refresh token in Redis', { error: error.message });
      }
    }
  }
  
  static async validateRefreshToken(userId, refreshToken) {
    if (!redisConnected) return true; // Skip validation if Redis unavailable
    
    try {
      const stored = await redis.get(`refresh:${userId}`);
      return stored === refreshToken;
    } catch (error) {
      Logger.warn('Failed to validate refresh token', { error: error.message });
      return true; // Allow if Redis fails
    }
  }
  
  static async revokeRefreshToken(userId) {
    if (redisConnected) {
      try {
        await redis.del(`refresh:${userId}`);
      } catch (error) {
        Logger.warn('Failed to revoke refresh token', { error: error.message });
      }
    }
  }
  
  static async rotateTokens(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      const userId = decoded.id;
      
      // Validate stored refresh token
      const isValid = await this.validateRefreshToken(userId, refreshToken);
      if (!isValid) {
        throw new Error('Invalid refresh token');
      }
      
      // Generate new tokens
      const newTokens = this.generateTokens({ id: userId, email: decoded.email });
      
      // Store new refresh token
      await this.storeRefreshToken(userId, newTokens.refreshToken);
      
      Logger.info('Tokens rotated', { userId });
      return newTokens;
    } catch (error) {
      Logger.error('Token rotation failed', { error: error.message });
      throw error;
    }
  }
}

// Auto-refresh middleware
export const autoRefresh = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) return next();
  
  try {
    const decoded = jwt.decode(token);
    const now = Date.now() / 1000;
    
    // If token expires in less than 5 minutes, suggest refresh
    if (decoded.exp - now < 300) {
      res.set('X-Token-Refresh-Needed', 'true');
    }
    
    next();
  } catch (error) {
    next();
  }
};

// JWT verification with auto-refresh
export const verifyJWT = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ error: 'Invalid token' });
  }
};