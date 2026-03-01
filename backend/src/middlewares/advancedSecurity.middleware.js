import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import geoip from 'geoip-lite';
import Logger from '../utils/logger.js';

let redis;
let redisConnected = false;

// Initialize Redis with error handling (no auto-retry)
try {
  redis = createClient({ 
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: false // Disable auto-reconnect
    }
  });
  redis.on('error', (err) => {
    if (!redisConnected) {
      Logger.warn('Redis unavailable, using memory store fallback');
      redisConnected = false;
    }
  });
  redis.on('connect', () => {
    redisConnected = true;
    Logger.info('Redis connected for security middleware');
  });
  redis.connect().catch(() => {
    redisConnected = false;
    Logger.info('Redis not available, security features using memory fallback');
  });
} catch (error) {
  redisConnected = false;
}

// Distributed sliding window rate limiter with fallback
export const distributedRateLimit = rateLimit({
  store: redisConnected ? new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
  }) : undefined, // Falls back to memory store
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests', retryAfter: 900 },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request fingerprinting and bot detection
export const botDetection = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|python|java/i,
    /^$/
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    Logger.warn('Suspicious bot detected', {
      ip: req.ip,
      userAgent,
      path: req.path
    });
    return res.status(429).json({ error: 'Bot detected' });
  }
  
  next();
};

// IP geolocation and anomaly detection
export const geoSecurityCheck = async (req, res, next) => {
  const ip = req.ip;
  const geo = geoip.lookup(ip);
  
  if (geo && geo.country) {
    const blockedCountries = ['CN', 'RU'];
    if (blockedCountries.includes(geo.country)) {
      Logger.warn('Blocked country access', { ip, country: geo.country });
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  
  // Rate limiting per country (only if Redis available)
  if (redisConnected) {
    try {
      const key = `country:${geo?.country || 'unknown'}`;
      const count = await redis.incr(key);
      await redis.expire(key, 3600);
      
      if (count > 1000) {
        return res.status(429).json({ error: 'Country rate limit exceeded' });
      }
    } catch (error) {
      Logger.warn('Redis operation failed in geo check', { error: error.message });
    }
  }
  
  req.geoInfo = geo;
  next();
};

// Security audit logging
export const securityAudit = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    Logger.info('Security audit', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      geo: req.geoInfo,
      timestamp: new Date().toISOString()
    });
    
    // Log suspicious activity
    if (res.statusCode >= 400 || duration > 5000) {
      Logger.warn('Suspicious activity detected', {
        ip: req.ip,
        statusCode: res.statusCode,
        duration,
        path: req.path
      });
    }
  });
  
  next();
};

// API abuse detection
export const abuseDetection = async (req, res, next) => {
  if (!redisConnected) return next();
  
  const ip = req.ip;
  const key = `abuse:${ip}`;
  
  try {
    // Track failed requests
    if (req.method === 'POST' && res.statusCode >= 400) {
      const failCount = await redis.incr(`${key}:fail`);
      await redis.expire(`${key}:fail`, 300);
      
      if (failCount > 10) {
        await redis.setex(`${key}:blocked`, 3600, '1');
        return res.status(429).json({ error: 'IP blocked due to abuse' });
      }
    }
    
    // Check if IP is blocked
    const isBlocked = await redis.get(`${key}:blocked`);
    if (isBlocked) {
      return res.status(429).json({ error: 'IP blocked' });
    }
  } catch (error) {
    Logger.warn('Redis operation failed in abuse detection', { error: error.message });
  }
  
  next();
};