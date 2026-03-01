import Logger from '../utils/logger.js';

// Request timeout middleware
export const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    // Set request timeout
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        Logger.warn('Request timeout', {
          method: req.method,
          url: req.url,
          ip: req.ip,
          timeout: timeoutMs
        });
        
        res.status(408).json({
          success: false,
          error: {
            message: 'Request timeout',
            code: 'REQUEST_TIMEOUT',
            statusCode: 408,
            timestamp: new Date().toISOString()
          }
        });
      }
    }, timeoutMs);
    
    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    res.on('close', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
};

// Specific timeout for scraping endpoints
export const scrapingTimeout = requestTimeout(45000); // 45 seconds

// General API timeout
export const apiTimeout = requestTimeout(30000); // 30 seconds