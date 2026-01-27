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
import healthRoutes from './routes/health.routes.js';
import { getSystemHealth, checkDependencies, getPrometheusMetrics } from './services/health.service.js';
import { secureLogger, secureErrorHandler } from './middlewares/secureLogging.middleware.js';
import { validateEnvironment } from './config/environment.js';
import { connectionManager } from './utils/connectionManager.js';
import { memoryMonitor } from './services/memoryMonitor.service.js';
import { cpuMonitor } from './services/cpuMonitor.service.js';
import { bandwidthMonitor } from './services/bandwidthMonitor.service.js';
import { processLimiter } from './utils/processLimiter.js';
import { cacheManager } from './utils/cacheManager.js';
import { gracefulShutdown } from './utils/shutdown.util.js';
import { authBypassProtection, validateToken } from './middlewares/auth.middleware.js';
import { fileUploadSecurity, validateFileExtensions, detectEncodedFiles } from './middlewares/fileUpload.middleware.js';
import { apiVersionSecurity, deprecationWarning, validateApiEndpoint, versionRateLimit } from './middlewares/apiVersion.middleware.js';

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
const server = createServer(app);
const PORT = config.port;
const NODE_ENV = config.nodeEnv;

/**
 * ✅ CHANGE #1 (ADDED)
 * Detect Jest/test environment so we can skip runtime heavy operations.
 */
const IS_TEST = NODE_ENV === 'test';

// Initialize global error boundary
globalErrorBoundary();

/**
 * ✅ CHANGE #2 (WRAPPED)
 * Connect to DB only when NOT testing.
 */
if (!IS_TEST) {
  connectDB();
}

/**
 * ✅ CHANGE #3 (WRAPPED)
 * Initialize WebSocket server only when NOT testing.
 */
if (!IS_TEST) {
  WebSocketManager.initialize(server);
}

/**
 * ✅ CHANGE #4 (WRAPPED)
 * Start batch processing scheduler only when NOT testing.
 */
if (!IS_TEST) {
  BatchProcessingService.startScheduler();
}

/**
 * ✅ CHANGE #7 (ADDED / WRAPPED)
 * Prevent long-running background services from starting in Jest tests.
 * This avoids open handles + flaky tests.
 */
if (!IS_TEST) {
  // Start cache warming service
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

  // Start cron scheduler
  CronScheduler.start();

  // Start health monitoring
  HealthMonitor.startMonitoring(120000); // Every 2 minutes

  // Start alert monitoring
  AlertManager.startMonitoring(300000); // Every 5 minutes
}
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
app.use(helmetHeaders); // Helmet security headers
app.use(additionalSecurityHeaders); // Custom security headers
app.use(enhancedSecurityHeaders);
app.use(securityHeaders);
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization and validation
app.use(sanitizeInput); // XSS and injection prevention
app.use(sanitizeMongoQuery); // MongoDB injection prevention
app.use(preventParameterPollution({ whitelist: ['tags', 'categories'] })); // HPP prevention
app.use(validationSanitize); // Additional validation

// Health check routes (no rate limiting for load balancers)
app.use('/health', healthBodyLimit, healthSizeLimit, healthTimeout, healthRoutes);

// Healthz endpoint (Kubernetes style)
app.get('/healthz', healthBodyLimit, healthSizeLimit, healthTimeout, async (req, res) => {
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

// Prometheus metrics endpoint
app.get('/metrics', healthBodyLimit, healthSizeLimit, healthTimeout, async (req, res) => {
  try {
    const metrics = await getPrometheusMetrics();
    res.set('Content-Type', register.contentType);
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// Audit routes
app.use('/api/audit', auditBodyLimit, auditSizeLimit, auditTimeout, strictRateLimit, auditRoutes);

// Security management routes
app.use('/api/security', securityBodyLimit, securitySizeLimit, securityTimeout, strictRateLimit, securityRoutes);

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenEndpoint);

app.get('/api/leetcode/:username', 
  scrapingSizeLimit,
  scrapingTimeout,
  heavyOperationProtection,
  scrapingLimiter, 
  csrfProtection,
  validateUsername, 
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    
    const data = await backpressureManager.process(() =>
      withTrace(req.traceId, "leetcode.scrape", () =>
        scrapeLeetCode(username)
      )
    );//done
    
    res.json({
      success: true,
      data,
      traceId: req.traceId
    });
  })
);

app.get('/api/codeforces/:username',
  scrapingSizeLimit,
  scrapingTimeout,
  heavyOperationProtection,
  validateUsername,
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const raw = await backpressureManager.process(() =>
      withTrace(req.traceId, "codeforces.scrape", () =>
        fetchCodeforcesStats(username)
      )
    );
    const normalized = normalizeCodeforces({ ...raw, username });
    res.json({ success: true, data: normalized, traceId: req.traceId });
  })
);

app.get('/api/codechef/:username',
  scrapingSizeLimit,
  scrapingTimeout,
  heavyOperationProtection,
  validateUsername,
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const raw = await backpressureManager.process(() =>
      withTrace(req.traceId, "codechef.scrape", () =>
        fetchCodeChefStats(username)
      )
    );
    const normalized = normalizeCodeChef({ ...raw, username });
    res.json({ success: true, data: normalized, traceId: req.traceId });
  })
);

// 404 handler for undefined routes
app.use(notFound);
app.use(secureErrorHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
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

/**
 * ✅ CHANGE #6 (WRAPPED)
 * Do NOT start listening server during tests.
 */
if (!IS_TEST) {
  startServer();
}

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