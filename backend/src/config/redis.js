import Redis from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connect();
  }

  connect() {
    try {
      this.client = new Redis(config.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('✅ Redis Connected');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.warn('Redis connection error:', err.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

    } catch (error) {
      logger.error('Redis setup failed:', error.message);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.warn('Redis GET error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.isConnected) return false;
    try {
      await this.client.setex(key, ttl, value);
      return true;
    } catch (error) {
      logger.warn('Redis SET error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.warn('Redis DEL error:', error.message);
      return false;
    }
  }

  async flushPattern(pattern) {
    if (!this.isConnected) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.warn('Redis FLUSH error:', error.message);
      return false;
    }
  }
}

export default new RedisClient();