import express from 'express';
import cors from 'cors';
import passport from 'passport';
import configurePassport from '../config/passport.js';
import { corsOptions } from '../config/cors.js';
import { errorHandler, notFound } from './error.middleware.js';
import { securityHeaders } from './security.middleware.js';
import { securityHeaders as helmetHeaders, additionalSecurityHeaders } from './security.headers.middleware.js';
import { sanitizeInput, sanitizeMongoQuery, preventParameterPollution } from './sanitization.middleware.js';
import { enhancedSecurityHeaders } from './enhancedSecurity.middleware.js';
import { requestLogger, securityMonitor } from './logging.middleware.js';
import { sanitizeInput as validationSanitize } from './validation.middleware.js';
import { advancedRateLimit } from './antiBypassRateLimit.middleware.js';
import { correlationId } from './correlationId.middleware.js';
import { performanceMetrics } from './performance.middleware.js';
import {
  distributedRateLimit,
  botDetection,
  geoSecurityCheck,
  securityAudit,
  abuseDetection
} from './advancedSecurity.middleware.js';
import { autoRefresh } from './jwtManager.middleware.js';
import { globalErrorBoundary } from './errorBoundary.middleware.js';
import { performanceMonitoring, errorTracking, memoryMonitoring } from './monitoring.middleware.js';

// Import additional middlewares and utilities used in server.js
// Note: Some middlewares like auditLogger, securityAudit, etc., need to be imported if not already
// Assuming they are defined in their respective files
import { asyncWrapper } from '../utils/asyncWrapper.js';
import Logger from '../utils/logger.js';

export const setupMiddlewares = (app) => {
  // Configure Passport
  configurePassport(passport);

  // Security and monitoring middlewares
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

  // Advanced security middleware (if not in test)
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

  // CSRF token endpoint
  app.get('/api/csrf-token', csrfTokenEndpoint);

  // Special route for leetcode (this might need to be moved to routes later)
  app.get('/api/leetcode/:username',
    scrapingBodyLimit,
    scrapingSizeLimit,
    scrapingTimeout,
    heavyOperationProtection,
    scrapingLimiter,
    csrfProtection,
    validateUsername,
    asyncWrapper(async (req, res) => {
      const { username } = req.params;

      const data = await backpressureManager.process(() =>
        withTrace(req.traceId, "leetcode.scrape", () =>
          scrapeLeetCode(username)
        )
      );

      res.json({
        success: true,
        data,
        traceId: req.traceId
      });
    })
  );

  // 404 handler for undefined routes
  app.use(notFound);
  app.use(secureErrorHandler);
  app.use(errorHandler);
};
