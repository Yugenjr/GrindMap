import Logger from '../utils/logger.js';

/**
 * Performance metrics tracking middleware
 */
export const performanceMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  // Track memory usage at request start
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    // Log request performance
    Logger.request(req, res, duration);
    
    // Log slow requests
    if (duration > 1000) {
      Logger.warn('Slow request detected', {
        correlationId: req.correlationId,
        url: req.originalUrl,
        duration: `${duration}ms`,
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external
        }
      });
    }
    
    // Log high memory usage
    if (endMemory.heapUsed > 100 * 1024 * 1024) { // 100MB
      Logger.warn('High memory usage', {
        correlationId: req.correlationId,
        heapUsed: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`
      });
    }
  });
  
  next();
};