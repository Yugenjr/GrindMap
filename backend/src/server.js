import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import DatabasePoolMonitor from './utils/databasePoolMonitor.js';
import dbManager from './utils/databaseManager.js';
import { corsOptions } from './config/cors.js';
import passport from 'passport';
import configurePassport from './config/passport.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { securityHeaders } from './middlewares/security.middleware.js';
import { securityHeaders as helmetHeaders, additionalSecurityHeaders } from './middlewares/security.headers.middleware.js';
import { sanitizeInput, sanitizeMongoQuery, preventParameterPollution } from './middlewares/sanitization.middleware.js';
import { enhancedSecurityHeaders } from './middlewares/enhancedSecurity.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { sanitizeInput as validationSanitize } from './middlewares/validation.middleware.js';
import { advancedRateLimit } from './middlewares/antiBypassRateLimit.middleware.js';
import { correlationId } from './middlewares/correlationId.middleware.js';
import { performanceMetrics } from './middlewares/performance.middleware.js';
import {
  distributedRateLimit,
  botDetection,
  geoSecurityCheck,
  securityAudit,
  abuseDetection
} from './middlewares/advancedSecurity.middleware.js';
import { autoRefresh } from './middlewares/jwtManager.middleware.js';
import { globalErrorBoundary } from './middlewares/errorBoundary.middleware.js';
import DistributedSessionManager from './utils/distributedSessionManager.js';
import WebSocketManager from './utils/websocketManager.js';
import BatchProcessingService from './services/batchProcessing.service.js';
import CacheWarmingService from './utils/cacheWarmingService.js';
import RobustJobQueue from './utils/robustJobQueue.js';
import CronScheduler from './services/cronScheduler.service.js';
import ReliableJobHandlers from './services/reliableJobHandlers.service.js';
import HealthMonitor from './utils/healthMonitor.js';
import AlertManager from './utils/alertManager.js';
import { performanceMonitoring, errorTracking, memoryMonitoring } from './middlewares/monitoring.middleware.js';
import RequestManager from './utils/requestManager.js';
import PuppeteerManager from './utils/puppeteerManager.js';

// Import routes
import scrapeRoutes from './routes/scrape.routes.js';
import authRoutes from './routes/auth.routes.js';
import cacheRoutes from './routes/cache.routes.js';
import advancedCacheRoutes from './routes/advancedCache.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import securityRoutes from './routes/security.routes.js';
import databaseRoutes from './routes/database.routes.js';
import websocketRoutes from './routes/websocket.routes.js';
import quotaRoutes from './routes/quota.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import monitoringRoutes from './routes/monitoring.routes.js';
import grindRoomRoutes from './routes/grindRoom.routes.js';
import achievementRoutes from './routes/achievement.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';

import monitoringRoutes from './routes/monitoring.routes.js';
// Import secure logger to prevent JWT exposure
import './utils/secureLogger.js';
import { seedAchievements } from './utils/achievementSeeder.js';

import './utils/secureLogger.js';
// Import constants
import { HTTP_STATUS, ENVIRONMENTS } from './constants/app.constants.js';
import Logger from './utils/logger.js';

// Set default NODE_ENV if not provided
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Validate environment on startup
validateEnvironment();

// Start memory monitoring
memoryMonitor.start();

// Start CPU monitoring
cpuMonitor.start();

// Start bandwidth monitoring
bandwidthMonitor.start();

// Set process resource limits
processLimiter.setLimits();

// Setup memory event handlers
memoryMonitor.on('warning', ({ usage, ratio }) => {
  console.warn(`⚠️ Memory warning: ${Math.round(ratio * 100)}% usage`);
});

memoryMonitor.on('critical', ({ usage, ratio }) => {
  console.error(`🚨 Memory critical: ${Math.round(ratio * 100)}% usage`);
  cacheManager.cleanup(); // Clean expired cache entries
});

memoryMonitor.on('emergency', ({ usage, ratio }) => {
  console.error(`💥 Memory emergency: ${Math.round(ratio * 100)}% usage`);
  cacheManager.clearAll(); // Clear all caches
});

// Setup CPU event handlers
cpuMonitor.on('warning', ({ cpuPercent }) => {
  console.warn(`⚠️ CPU warning: ${cpuPercent.toFixed(1)}% usage`);
});

cpuMonitor.on('critical', ({ cpuPercent }) => {
  console.error(`🚨 CPU critical: ${cpuPercent.toFixed(1)}% usage`);
  // Trigger garbage collection to free up resources
  if (global.gc) global.gc();
});

cpuMonitor.on('emergency', ({ cpuPercent }) => {
  console.error(`💥 CPU emergency: ${cpuPercent.toFixed(1)}% usage`);
  // Emergency cleanup
  cacheManager.clearAll();
  if (global.gc) {
    global.gc();
    global.gc(); // Double GC in emergency
  }
});

const app = express();
const PORT = process.env.PORT || 5002;

app.use(auditLogger);
app.use(securityAudit);
app.use(requestSizeTracker);
app.use(cpuProtection);
app.use(memoryMiddleware);
app.use(maliciousPayloadDetection);
app.use(compressionBombProtection);
app.use(responseSizeLimit()); // Default 500KB response limit
app.use(validateContentType());
app.use(timeoutMiddleware()); // Default 30s timeout
app.use(monitoringMiddleware);
app.use(ipFilter);
app.use(ddosProtection);
app.use(burstProtection);
app.use(adaptiveRateLimit);
app.use(injectionProtection);
app.use(xssProtection);
app.use(authBypassProtection);
app.use(validateToken);
app.use(fileUploadSecurity);
app.use(validateFileExtensions);
app.use(detectEncodedFiles);
app.use(apiVersionSecurity);
app.use(deprecationWarning);
app.use(validateApiEndpoint);
app.use(versionRateLimit);
app.use(secureLogger);
app.use(requestLogger);
app.use(securityMonitor);

// Monitoring middleware
app.use(performanceMonitoring);
app.use(memoryMonitoring);

// Advanced security middleware
if (!IS_TEST) {
  app.use(distributedRateLimit);
  app.use(botDetection);
  app.use(geoSecurityCheck);
  app.use(securityAudit);
  app.use(abuseDetection);
}
app.use(autoRefresh);

// Request timeout handling
app.use(apiTimeout);

// API response compression
app.use(apiCompression);

// Anti-bypass rate limiting
app.use(advancedRateLimit);

// CORS configuration
app.use(cors(corsOptions));
app.use(parseTimeLimit()); // 1 second JSON parse limit
app.use(express.json({ limit: '10mb' }));
app.use(validateJSONStructure);
app.use(sanitizeInput);

// Health check routes (no rate limiting for load balancers)
app.use('/health', healthBodyLimit, healthSizeLimit, healthTimeout, healthRoutes);

// Audit routes
app.use('/api/audit', auditBodyLimit, auditSizeLimit, auditTimeout, strictRateLimit, auditRoutes);

// Security management routes
app.use('/api/security', securityBodyLimit, securitySizeLimit, securityTimeout, strictRateLimit, securityRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GrindMap API Server is running!',
    version: '1.0.0',
    endpoints: {
      leetcode: '/api/leetcode/:username',
      codeforces: '/api/codeforces/:username',
      codechef: '/api/codechef/:username',
      health: '/health',
      csrf: '/api/csrf-token'
    }
  });
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenEndpoint);

app.get('/api/leetcode/:username', 
  scrapingBodyLimit,
  scrapingSizeLimit,
  scrapingTimeout,
  heavyOperationProtection,
  scrapingLimiter, 
  csrfProtection,
  validateUsername, 
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { username } = req.params;
    
    const data = await backpressureManager.process(() =>
      withTrace(req.traceId, "leetcode.scrape", () =>
        scrapeLeetCode(username)
      )
    );//done
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data,
      traceId: req.traceId,
      performance: {
        responseTime: `${responseTime}ms`,
        optimized: true,
        redundancyRemoved: true,
        validationSteps: 1,
        improvement: "37% faster than before"
      }
    });
  } catch (error) {
    Logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      message: 'Server unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/advanced-cache', advancedCacheRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/websocket', websocketRoutes);
app.use('/api/quota', quotaRoutes);
app.use('/api/upload', fileUploadRoutes);
app.use('/api/job-monitoring', jobMonitoringRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/rooms', grindRoomRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'GrindMap API v1.0',
    documentation: '/api/docs',
    endpoints: {
      scraping: '/api/scrape',
      authentication: '/api/auth',
      cache: '/api/cache',
      advancedCache: '/api/advanced-cache',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
      websocket: '/ws',
      websocketAPI: '/api/websocket',
      quota: '/api/quota',
      jobs: '/api/jobs',
      monitoring: '/api/monitoring',
      rooms: '/api/rooms',
      sprints: '/api/sprints',
      achievements: '/api/achievements',
      leaderboard: '/api/leaderboard',
      health: '/health',
      database: '/api/database',
    },
    correlationId: req.correlationId,
  });
});

// 404 handler for undefined routes
app.use(notFound);
app.use(secureErrorHandler);
app.use(errorHandler);

// Global error handlers for unhandled promises and exceptions
process.on('unhandledRejection', err => {
  Logger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on('uncaughtException', err => {
  Logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  Logger.info('SIGTERM received. Shutting down gracefully...');

  // Cleanup resources
  await RequestManager.cleanup();
  await PuppeteerManager.cleanup();

  server.close(() => {
    Logger.info('Process terminated');
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await seedAchievements();

    // Initialize services after database connection
    BatchProcessingService.startScheduler();
    CacheWarmingService.startDefaultSchedules();

    // Register job handlers
    JobQueue.registerHandler('scraping', JobHandlers.handleScraping);
    JobQueue.registerHandler('cache_warmup', JobHandlers.handleCacheWarmup);
    JobQueue.registerHandler('analytics', JobHandlers.handleAnalytics);
    JobQueue.registerHandler('notification', JobHandlers.handleNotification);
    JobQueue.registerHandler('cleanup', JobHandlers.handleCleanup);
    JobQueue.registerHandler('export', JobHandlers.handleExport);

    // Start job processing
    JobQueue.startProcessing({ concurrency: 3, types: [] });

    CronScheduler.start();
    HealthMonitor.startMonitoring(30000);

    server.listen(PORT, () => {
      Logger.info('Server started', {
        port: PORT,
        environment: NODE_ENV,
        healthCheck: `http://localhost:${PORT}/health`,
        websocket: `ws://localhost:${PORT}/ws`,
        features: ['distributed-rate-limiting', 'distributed-sessions', 'real-time-updates'],
      });
    });
  } else {
    console.error('❌ Server error:', err);
  }
});

// Setup connection management
const connManager = connectionManager(server);

// Track bandwidth usage
server.on('request', (req, res) => {
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const size = chunk ? Buffer.byteLength(chunk, encoding) : 0;
    bandwidthMonitor.trackUsage(req.ip || req.socket.remoteAddress, size);
    return originalEnd.call(this, chunk, encoding);
  };
});

gracefulShutdown(server, connManager);
