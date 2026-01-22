import redis from '../config/redis.js';

class OptimizedCacheManager {
  static generateKey(type, identifier, version = '1') {
    return `${type}:${version}:${identifier}`;
  }

  static async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Cache get failed:', error.message);
      return null;
    }
  }

  static async set(key, data, ttl = 900) { // 15 minutes default
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      
      // Track key for pattern-based invalidation
      const keyType = key.split(':')[0];
      await redis.sadd(`keys:${keyType}`, key);
      await redis.expire(`keys:${keyType}`, ttl + 60);
      
      return true;
    } catch (error) {
      console.warn('Cache set failed:', error.message);
      return false;
    }
  }

  static async invalidate(pattern) {
    try {
      if (pattern.includes('*')) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        await redis.del(pattern);
      }
      return true;
    } catch (error) {
      console.warn('Cache invalidation failed:', error.message);
      return false;
    }
  }

  static async invalidateByType(type) {
    try {
      const keys = await redis.smembers(`keys:${type}`);
      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(`keys:${type}`);
      }
      return true;
    } catch (error) {
      console.warn('Type invalidation failed:', error.message);
      return false;
    }
  }

  // Platform-specific cache methods
  static platformKey(platform, username) {
    return this.generateKey('platform', `${platform}:${username}`);
  }

  static userKey(userId) {
    return this.generateKey('user', userId);
  }

  static async invalidateUser(username) {
    await this.invalidate(`platform:*:*:${username}`);
    await this.invalidate(`user:*:${username}`);
  }
}

export default OptimizedCacheManager;