import morgan from 'morgan';
import { asyncMiddleware } from '../utils/asyncWrapper.js';

const requestLogger = morgan((tokens, req, res) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: `${tokens['response-time'](req, res)}ms`,
    contentLength: tokens.res(req, res, 'content-length') || '0',
    userAgent: req.get('User-Agent') || 'unknown',
    ip: req.ip || req.connection.remoteAddress,
    referrer: req.get('Referrer') || 'direct'
  };

  // Security monitoring
  if (res.statusCode >= 400) {
    log.level = 'WARN';
    log.error = true;
  }
  
  if (res.statusCode >= 500) {
    log.level = 'ERROR';
    log.critical = true;
  }

  return JSON.stringify(log);
});

const securityMonitor = asyncMiddleware(async (req, res, next) => {
  try {
    const startTime = Date.now();
    
    // Track suspicious patterns
    const suspiciousPatterns = [
      /\.\./,  // Path traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /javascript:/i  // JS injection
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(req.url) || pattern.test(JSON.stringify(req.body))
    );

    if (isSuspicious) {
      console.warn('🚨 SECURITY ALERT:', {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        body: req.body
      });
    }

    // Track response time
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn('⚠️ SLOW REQUEST:', {
          url: req.url,
          method: req.method,
          duration: `${duration}ms`
        });
      }
    });

    next();
  } catch (error) {
    console.error('Security monitoring error:', error);
    next(); // Continue even if monitoring fails
  }
});

export { requestLogger, securityMonitor };