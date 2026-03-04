import { cpuMonitor } from '../services/cpuMonitor.service.js';
import { AppError } from '../utils/appError.js';

export const cpuProtection = (req, res, next) => {
  const currentCPU = cpuMonitor.getCurrentCPU();
  
  // Block new requests if CPU is critically high
  if (currentCPU > 90) {
    console.warn(`🚨 Request blocked due to high CPU usage: ${currentCPU.toFixed(1)}%`);
    
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable - high CPU usage',
      cpuUsage: `${currentCPU.toFixed(1)}%`,
      retryAfter: 30
    });
  }
  
  // Add CPU info to request for monitoring
  req.cpuUsage = currentCPU;
  
  next();
};

export const heavyOperationProtection = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startCPU = process.cpuUsage();
  
  // Monitor CPU usage during request processing
  const checkInterval = setInterval(() => {
    const currentCPU = cpuMonitor.getCurrentCPU();
    
    if (currentCPU > 95) {
      clearInterval(checkInterval);
      
      if (!res.headersSent) {
        console.error(`💥 Request terminated due to excessive CPU usage: ${currentCPU.toFixed(1)}%`);
        
        return res.status(503).json({
          success: false,
          error: 'Request terminated - excessive CPU usage',
          cpuUsage: `${currentCPU.toFixed(1)}%`
        });
      }
    }
  }, 1000); // Check every second
  
  // Clear interval when response is sent
  const originalSend = res.send;
  res.send = function(data) {
    clearInterval(checkInterval);
    
    // Calculate CPU time used by this request
    const endTime = process.hrtime.bigint();
    const endCPU = process.cpuUsage(startCPU);
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms
    const cpuTime = (endCPU.user + endCPU.system) / 1000; // Convert to ms
    
    // Add performance headers
    res.set('X-CPU-Time', `${cpuTime.toFixed(2)}ms`);
    res.set('X-Duration', `${duration.toFixed(2)}ms`);
    
    // Log heavy operations
    if (cpuTime > 1000) { // More than 1 second of CPU time
      console.warn(`⚠️ Heavy operation detected: ${cpuTime.toFixed(2)}ms CPU time for ${req.method} ${req.url}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};