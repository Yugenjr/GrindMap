import { memoryMonitor } from '../services/memoryMonitor.service.js';

export const memoryMiddleware = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapUsageRatio = memUsage.heapUsed / memUsage.heapTotal;
  
  // Block requests if memory is critically high
  if (heapUsageRatio > 0.95) {
    console.warn(`🚨 Request blocked due to critical memory usage: ${Math.round(heapUsageRatio * 100)}%`);
    return res.status(503).json({
      error: 'Service temporarily unavailable - critical memory usage',
      memoryUsage: `${memUsedMB.toFixed(2)}MB`,
      heapUsage: `${Math.round(heapUsageRatio * 100)}%`
    });
  }
  
  // Add memory info to request for monitoring
  req.memoryUsage = {
    heapUsed: memUsedMB,
    heapUsagePercent: Math.round(heapUsageRatio * 100)
  };
  
  next();
};
