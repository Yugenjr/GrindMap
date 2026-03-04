import express from 'express';
import { getActiveRequests, cleanupStaleRequests } from '../middlewares/timeout.middleware.js';
import { memoryMonitor } from '../services/memoryMonitor.service.js';
import { cpuMonitor } from '../services/cpuMonitor.service.js';
import { bandwidthMonitor } from '../services/bandwidthMonitor.service.js';
import { bodyValidationMonitor } from '../services/bodyValidationMonitor.service.js';
import { processLimiter } from '../utils/processLimiter.js';
import { cacheManager } from '../utils/cacheManager.js';
import { getSystemHealth, checkDependencies, getDetailedMetrics } from '../services/health.service.js';

const router = express.Router();

// Basic health check for load balancers
router.get('/', async (req, res) => {
  try {
    const health = getSystemHealth();
    const dependencies = await checkDependencies();
    
    const hasUnhealthy = dependencies.some(dep => dep.status === 'unhealthy');
    const status = hasUnhealthy ? 'unhealthy' : 'healthy';
    
    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      ...health,
      dependencies
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed metrics for monitoring systems
router.get('/metrics', (req, res) => {
  try {
    const metrics = getDetailedMetrics();
    const activeRequests = getActiveRequests();
    const memoryStats = memoryMonitor.getStats();
    const cpuStats = cpuMonitor.getStats();
    const cacheStats = cacheManager.getStats();
    const bandwidthStats = bandwidthMonitor.getStats();
    const bodyValidationStats = bodyValidationMonitor.getStats();
    const processStats = processLimiter.getStats();
    
    res.json({
      ...metrics,
      activeRequests: {
        count: activeRequests.length,
        requests: activeRequests
      },
      memory: memoryStats,
      cpu: cpuStats,
      caches: cacheStats,
      bandwidth: bandwidthStats,
      bodyValidation: bodyValidationStats,
      process: processStats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe for Kubernetes
router.get('/ready', async (req, res) => {
  try {
    const dependencies = await checkDependencies();
    const ready = dependencies.every(dep => dep.status !== 'unhealthy');
    
    res.status(ready ? 200 : 503).json({
      ready,
      dependencies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe for Kubernetes
router.get('/live', (req, res) => {
  // Cleanup stale requests and caches during liveness check
  cleanupStaleRequests();
  cacheManager.cleanup();
  
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;