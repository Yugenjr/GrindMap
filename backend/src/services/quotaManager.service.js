import UserQuota from '../models/userQuota.model.js';
import { createClient } from 'redis';
import Logger from '../utils/logger.js';

class QuotaManager {
  constructor() {
    this.redis = null;
    this.redisConnected = false;
    this.tierLimits = {
      free: {
        daily: 100,
        monthly: 2000,
        concurrent: 5,
        perMinute: 60,
        perHour: 1000,
        burstLimit: 10
      },
      premium: {
        daily: 1000,
        monthly: 25000,
        concurrent: 20,
        perMinute: 300,
        perHour: 10000,
        burstLimit: 50
      },
      enterprise: {
        daily: 10000,
        monthly: 500000,
        concurrent: 100,
        perMinute: 1000,
        perHour: 50000,
        burstLimit: 200
      }
    };
    
    this.init();
  }

  async init() {
    try {
      this.redis = createClient({ 
        url: process.env.REDIS_URL,
        socket: { reconnectStrategy: false }
      });
      
      this.redis.on('connect', () => {
        this.redisConnected = true;
        Logger.info('Quota manager connected to Redis');
      });
      
      this.redis.on('error', () => {
        this.redisConnected = false;
      });
      
      await this.redis.connect();
    } catch (error) {
      Logger.warn('Quota manager using database fallback');
      this.redisConnected = false;
    }
  }

  async checkQuota(userId, endpoint, method) {
    try {
      // Get or create user quota
      let userQuota = await UserQuota.findOne({ userId });
      
      if (!userQuota) {
        userQuota = await this.createUserQuota(userId);
      }
      
      // Check if user can make request
      const canRequest = userQuota.canMakeRequest();
      if (!canRequest.allowed) {
        return {
          allowed: false,
          reason: canRequest.reason,
          resetAt: canRequest.resetAt,
          blockUntil: canRequest.blockUntil,
          quotas: userQuota.quotas
        };
      }
      
      // Check rate limits with Redis
      if (this.redisConnected) {
        const rateLimitCheck = await this.checkRateLimit(userId, userQuota.tier);
        if (!rateLimitCheck.allowed) {
          return rateLimitCheck;
        }
      }
      
      return {
        allowed: true,
        quotas: userQuota.quotas,
        rateLimits: userQuota.rateLimits
      };
    } catch (error) {
      Logger.error('Quota check failed', { userId, error: error.message });
      return { allowed: true }; // Fail open
    }
  }

  async recordUsage(userId, endpoint, method, responseTime, statusCode, userAgent, ip) {
    try {
      const userQuota = await UserQuota.findOne({ userId });
      if (!userQuota) return;
      
      // Increment concurrent requests
      userQuota.quotas.concurrent.current += 1;
      
      // Record usage
      userQuota.incrementUsage(endpoint, method, responseTime, statusCode, userAgent, ip);
      
      await userQuota.save();
      
      // Update Redis counters
      if (this.redisConnected) {
        await this.updateRateLimitCounters(userId);
      }
      
    } catch (error) {
      Logger.error('Usage recording failed', { userId, error: error.message });
    }
  }

  async completeRequest(userId) {
    try {
      const userQuota = await UserQuota.findOne({ userId });
      if (userQuota && userQuota.quotas.concurrent.current > 0) {
        userQuota.quotas.concurrent.current -= 1;
        await userQuota.save();
      }
    } catch (error) {
      Logger.error('Request completion failed', { userId, error: error.message });
    }
  }

  async checkRateLimit(userId, tier) {
    const limits = this.tierLimits[tier];
    const now = Date.now();
    
    try {
      // Sliding window rate limiting
      const minuteKey = `rate:${userId}:${Math.floor(now / 60000)}`;
      const hourKey = `rate:${userId}:${Math.floor(now / 3600000)}`;
      
      const [minuteCount, hourCount] = await Promise.all([
        this.redis.incr(minuteKey),
        this.redis.incr(hourKey)
      ]);
      
      // Set expiry
      await Promise.all([
        this.redis.expire(minuteKey, 60),
        this.redis.expire(hourKey, 3600)
      ]);
      
      if (minuteCount > limits.perMinute) {
        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          type: 'per_minute',
          limit: limits.perMinute,
          resetAt: new Date((Math.floor(now / 60000) + 1) * 60000)
        };
      }
      
      if (hourCount > limits.perHour) {
        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          type: 'per_hour',
          limit: limits.perHour,
          resetAt: new Date((Math.floor(now / 3600000) + 1) * 3600000)
        };
      }
      
      return { allowed: true };
    } catch (error) {
      Logger.warn('Rate limit check failed', { userId, error: error.message });
      return { allowed: true }; // Fail open
    }
  }

  async updateRateLimitCounters(userId) {
    try {
      const now = Date.now();
      const minuteKey = `rate:${userId}:${Math.floor(now / 60000)}`;
      const hourKey = `rate:${userId}:${Math.floor(now / 3600000)}`;
      
      await Promise.all([
        this.redis.incr(minuteKey),
        this.redis.incr(hourKey)
      ]);
    } catch (error) {
      Logger.warn('Rate limit counter update failed', { userId, error: error.message });
    }
  }

  async createUserQuota(userId, tier = 'free') {
    const limits = this.tierLimits[tier];
    
    const userQuota = new UserQuota({
      userId,
      tier,
      quotas: {
        daily: {
          limit: limits.daily,
          used: 0,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        monthly: {
          limit: limits.monthly,
          used: 0,
          resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        },
        concurrent: {
          limit: limits.concurrent,
          current: 0
        }
      },
      rateLimits: {
        perMinute: limits.perMinute,
        perHour: limits.perHour,
        burstLimit: limits.burstLimit
      }
    });
    
    await userQuota.save();
    Logger.info('User quota created', { userId, tier });
    return userQuota;
  }

  async upgradeTier(userId, newTier) {
    const userQuota = await UserQuota.findOne({ userId });
    if (!userQuota) {
      return this.createUserQuota(userId, newTier);
    }
    
    const limits = this.tierLimits[newTier];
    
    userQuota.tier = newTier;
    userQuota.quotas.daily.limit = limits.daily;
    userQuota.quotas.monthly.limit = limits.monthly;
    userQuota.quotas.concurrent.limit = limits.concurrent;
    userQuota.rateLimits = {
      perMinute: limits.perMinute,
      perHour: limits.perHour,
      burstLimit: limits.burstLimit
    };
    
    await userQuota.save();
    Logger.info('User tier upgraded', { userId, newTier });
    return userQuota;
  }

  async getUsageAnalytics(userId, days = 30) {
    const userQuota = await UserQuota.findOne({ userId });
    if (!userQuota) return null;
    
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentUsage = userQuota.usage.filter(u => u.timestamp >= cutoff);
    
    const analytics = {
      totalRequests: recentUsage.length,
      avgResponseTime: recentUsage.reduce((sum, u) => sum + (u.responseTime || 0), 0) / recentUsage.length || 0,
      errorRate: recentUsage.filter(u => u.statusCode >= 400).length / recentUsage.length || 0,
      topEndpoints: this.getTopEndpoints(recentUsage),
      dailyUsage: this.getDailyUsage(recentUsage),
      quotaUtilization: {
        daily: (userQuota.quotas.daily.used / userQuota.quotas.daily.limit) * 100,
        monthly: (userQuota.quotas.monthly.used / userQuota.quotas.monthly.limit) * 100
      }
    };
    
    return analytics;
  }

  getTopEndpoints(usage) {
    const endpoints = {};
    usage.forEach(u => {
      const key = `${u.method} ${u.endpoint}`;
      endpoints[key] = (endpoints[key] || 0) + 1;
    });
    
    return Object.entries(endpoints)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  getDailyUsage(usage) {
    const daily = {};
    usage.forEach(u => {
      const date = u.timestamp.toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + 1;
    });
    
    return Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  async blockUser(userId, reason, duration = 3600000) { // 1 hour default
    const userQuota = await UserQuota.findOne({ userId });
    if (userQuota) {
      userQuota.isBlocked = true;
      userQuota.blockReason = reason;
      userQuota.blockUntil = new Date(Date.now() + duration);
      await userQuota.save();
      
      Logger.warn('User blocked', { userId, reason, duration });
    }
  }

  async unblockUser(userId) {
    const userQuota = await UserQuota.findOne({ userId });
    if (userQuota) {
      userQuota.isBlocked = false;
      userQuota.blockReason = null;
      userQuota.blockUntil = null;
      await userQuota.save();
      
      Logger.info('User unblocked', { userId });
    }
  }
}

export default new QuotaManager();