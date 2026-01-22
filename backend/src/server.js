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
import { enhancedSecurityHeaders } from './middlewares/enhancedSecurity.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { sanitizeInput } from './middlewares/validation.middleware.js';
import { apiTimeout } from './middlewares/requestTimeout.middleware.js';
import { advancedRateLimit } from './middlewares/antiBypassRateLimit.middleware.js';
import { correlationId } from './middlewares/correlationId.middleware.js';
import { performanceMetrics } from './middlewares/performance.middleware.js';
import {
  distributedRateLimit,
  botDetection,
  geoSecurityCheck,
  securityAudit,
  abuseDetection,
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
import {
  performanceMonitoring,
  errorTracking,
  memoryMonitoring,
} from './middlewares/monitoring.middleware.js';
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
import tournamentRoutes from './routes/tournament.routes.js';
import duelRoutes from './routes/duel.routes.js';

import monitoringRoutes from './routes/monitoring.routes.js';
// Import secure logger to prevent JWT exposure

import './utils/secureLogger.js';
// Import constants
import { HTTP_STATUS, ENVIRONMENTS } from './constants/app.constants.js';
import Logger from './utils/logger.js';

import EnvValidator from './utils/envValidator.js';

// Validate environment variables before starting
EnvValidator.validate();
const config = EnvValidator.getConfig();

const app = express();
const server = createServer(app);
const PORT = config.port;
const NODE_ENV = config.nodeEnv;

// Initialize global error boundary
globalErrorBoundary();

// Connect to database with pooling
connectDB();

// Start database pool monitoring
DatabasePoolMonitor.startMonitoring(60000);

// Initialize WebSocket server
WebSocketManager.initialize(server);

// Start batch processing scheduler
BatchProcessingService.startScheduler();

// Start cache warming service
CacheWarmingService.startDefaultSchedules();

// Register job handlers
JobQueue.registerHandler('scraping', JobHandlers.handleScraping);
JobQueue.registerHandler('cache_warmup', JobHandlers.handleCacheWarmup);
JobQueue.registerHandler('analytics', JobHandlers.handleAnalytics);
JobQueue.registerHandler('notification', JobHandlers.handleNotification);
JobQueue.registerHandler('cleanup', JobHandlers.handleCleanup);
JobQueue.registerHandler('export', JobHandlers.handleExport);
JobQueue.registerHandler('integrity', JobHandlers.handleIntegrity);

// Start robust job processing
RobustJobQueue.startProcessing();

// Start cron scheduler
CronScheduler.start();

// Start health monitoring
HealthMonitor.startMonitoring(120000); // Every 2 minutes

// Start alert monitoring
AlertManager.startMonitoring(300000); // Every 5 minutes

// Request tracking and monitoring (first)
app.use(correlationId);
app.use(performanceMetrics);

// Distributed session management
app.use(DistributedSessionManager.middleware());

// Enhanced security middleware
app.use(enhancedSecurityHeaders);
app.use(securityHeaders);
app.use(requestLogger);
app.use(securityMonitor);

// Monitoring middleware
app.use(performanceMonitoring);
app.use(memoryMonitoring);

// Advanced security middleware
app.use(distributedRateLimit);
app.use(botDetection);
app.use(geoSecurityCheck);
app.use(securityAudit);
app.use(abuseDetection);
app.use(autoRefresh);

// Request timeout handling
app.use(apiTimeout);

// API response compression
app.use(apiCompression);

// Anti-bypass rate limiting
app.use(advancedRateLimit);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

// Passport Middleware
app.use(passport.initialize());
configurePassport();

// Health check endpoint
app.get('/health', async (req, res) => {
  Logger.info('Health check accessed', { correlationId: req.correlationId });

  try {
    const dbHealth = await dbManager.healthCheck();
    const dbStats = dbManager.getConnectionStats();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      correlationId: req.correlationId,
      sessionActive: !!req.session,
      websocketClients: WebSocketManager.getClientsCount(),
      database: dbHealth,
      connectionStats: dbStats,
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
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/duels', duelRoutes);

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
      tournaments: '/api/tournaments',
      duels: '/api/duels',
      health: '/health',
      database: '/api/database',
    },
    correlationId: req.correlationId,
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorTracking);
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
  } catch (error) {
    console.error('Failed to connect to database FATAL:', error);
    process.exit(1);
  }
};

startServer();

export default app;
