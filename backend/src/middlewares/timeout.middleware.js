import { AppError } from '../utils/appError.js';

const TIMEOUT_CONFIG = {
  default: 30000,      // 30 seconds
  scraping: 60000,     // 60 seconds for scraping endpoints
  health: 5000,        // 5 seconds for health checks
  audit: 15000,        // 15 seconds for audit endpoints
  security: 10000      // 10 seconds for security endpoints
};

const activeRequests = new Map();

export const timeoutMiddleware = (timeoutMs = TIMEOUT_CONFIG.default) => {
  return (req, res, next) => {
    const requestId = req.requestId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = requestId;
    
    // Set timeout
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        activeRequests.delete(requestId);
        
        console.warn(`⏰ Request timeout: ${req.method} ${req.url} (${timeoutMs}ms)`);
        
        const error = new AppError(`Request timeout after ${timeoutMs}ms`, 408);
        res.status(408).json({
          success: false,
          error: error.message,
          timeout: timeoutMs,
          requestId
        });
      }
    }, timeoutMs);
    
    // Track active request
    activeRequests.set(requestId, {
      timeout,
      startTime: Date.now(),
      method: req.method,
      url: req.url,
      ip: req.ip
    });
    
    // Clear timeout on response
    const originalSend = res.send;
    res.send = function(data) {
      const requestInfo = activeRequests.get(requestId);
      if (requestInfo) {
        clearTimeout(requestInfo.timeout);
        activeRequests.delete(requestId);
      }
      return originalSend.call(this, data);
    };
    
    // Clear timeout on connection close
    req.on('close', () => {
      const requestInfo = activeRequests.get(requestId);
      if (requestInfo) {
        clearTimeout(requestInfo.timeout);
        activeRequests.delete(requestId);
      }
    });
    
    next();
  };
};

// Specific timeout middlewares
export const scrapingTimeout = timeoutMiddleware(TIMEOUT_CONFIG.scraping);
export const healthTimeout = timeoutMiddleware(TIMEOUT_CONFIG.health);
export const auditTimeout = timeoutMiddleware(TIMEOUT_CONFIG.audit);
export const securityTimeout = timeoutMiddleware(TIMEOUT_CONFIG.security);

// Get active requests for monitoring
export const getActiveRequests = () => {
  const requests = [];
  for (const [id, info] of activeRequests) {
    requests.push({
      id,
      duration: Date.now() - info.startTime,
      method: info.method,
      url: info.url,
      ip: info.ip
    });
  }
  return requests;
};

// Force cleanup of stale requests
export const cleanupStaleRequests = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [id, info] of activeRequests) {
    if (now - info.startTime > TIMEOUT_CONFIG.scraping + 10000) { // 10s grace period
      clearTimeout(info.timeout);
      activeRequests.delete(id);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} stale requests`);
  }
  
  return cleaned;
};