import { incrementRequestCount, incrementErrorCount } from '../services/health.service.js';

export const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Increment request count
  incrementRequestCount();
  
  // Track response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Track errors
    if (res.statusCode >= 400) {
      incrementErrorCount();
    }
    
    // Add performance headers
    res.set('X-Response-Time', `${responseTime}ms`);
    
    return originalSend.call(this, data);
  };
  
  next();
};