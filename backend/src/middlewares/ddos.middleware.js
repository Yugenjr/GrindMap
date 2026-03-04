import rateLimit from 'express-rate-limit';

const suspiciousIPs = new Map();
const blockedIPs = new Set();

// Adaptive rate limiter that adjusts based on suspicious behavior
export const adaptiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (req) => {
    const ip = req.ip;
    
    // Blocked IPs get 0 requests
    if (blockedIPs.has(ip)) return 0;
    
    // Suspicious IPs get reduced limits
    if (suspiciousIPs.has(ip)) {
      const suspicionLevel = suspiciousIPs.get(ip);
      return Math.max(5, 100 - (suspicionLevel * 20));
    }
    
    return 100; // Normal limit
  },
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    trackSuspiciousActivity(req.ip);
    res.status(429).json({ 
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10,
  message: { error: 'Too many requests to sensitive endpoint' },
  skipSuccessfulRequests: true
});

// Burst protection - very short window, high frequency detection
export const burstProtection = rateLimit({
  windowMs: 1000, // 1 second
  limit: 5,
  message: { error: 'Request burst detected' },
  handler: (req, res) => {
    trackSuspiciousActivity(req.ip, 2); // Higher suspicion for bursts
    res.status(429).json({ error: 'Burst limit exceeded' });
  }
});

const trackSuspiciousActivity = (ip, increment = 1) => {
  const current = suspiciousIPs.get(ip) || 0;
  const newLevel = current + increment;
  
  suspiciousIPs.set(ip, newLevel);
  
  // Block IP after 5 suspicious activities
  if (newLevel >= 5) {
    blockedIPs.add(ip);
    console.warn(`🚨 IP ${ip} blocked for suspicious activity`);
    
    // Auto-unblock after 1 hour
    setTimeout(() => {
      blockedIPs.delete(ip);
      suspiciousIPs.delete(ip);
      console.log(`✅ IP ${ip} unblocked`);
    }, 60 * 60 * 1000);
  }
};

// DDoS detection middleware
export const ddosProtection = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / 1000)}`; // Per-second tracking
  
  // Simple in-memory request counting
  if (!global.requestCounts) global.requestCounts = new Map();
  
  const count = global.requestCounts.get(key) || 0;
  global.requestCounts.set(key, count + 1);
  
  // DDoS threshold: 50 requests per second from same IP
  if (count > 50) {
    trackSuspiciousActivity(ip, 3);
    return res.status(429).json({ 
      error: 'DDoS protection activated',
      message: 'Excessive requests detected'
    });
  }
  
  // Cleanup old entries every minute
  if (Math.random() < 0.01) {
    const cutoff = Math.floor((now - 60000) / 1000);
    for (const [k] of global.requestCounts) {
      if (parseInt(k.split(':')[1]) < cutoff) {
        global.requestCounts.delete(k);
      }
    }
  }
  
  next()
};