import QuotaManager from '../services/quotaManager.service.js';
import Logger from '../utils/logger.js';

// Quota enforcement middleware
export const enforceQuota = (options = {}) => {
  const { 
    skipAuth = false,
    endpoint = null,
    weight = 1 // Request weight for different endpoints
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Skip quota for unauthenticated requests if specified
    if (skipAuth && !req.user) {
      return next();
    }
    
    // Skip if no user (should be handled by auth middleware)
    if (!req.user) {
      return next();
    }
    
    const userId = req.user.id;
    const requestEndpoint = endpoint || `${req.method} ${req.route?.path || req.path}`;
    
    try {
      // Check quota and rate limits
      const quotaCheck = await QuotaManager.checkQuota(userId, requestEndpoint, req.method);
      
      if (!quotaCheck.allowed) {
        const errorResponse = {
          success: false,
          error: 'Quota exceeded',
          reason: quotaCheck.reason,
          quotas: quotaCheck.quotas,
          resetAt: quotaCheck.resetAt,
          blockUntil: quotaCheck.blockUntil
        };
        
        // Set appropriate headers
        if (quotaCheck.resetAt) {
          res.set('X-RateLimit-Reset', Math.ceil(quotaCheck.resetAt.getTime() / 1000));
        }
        
        if (quotaCheck.quotas) {
          res.set('X-RateLimit-Limit-Daily', quotaCheck.quotas.daily.limit);
          res.set('X-RateLimit-Remaining-Daily', Math.max(0, quotaCheck.quotas.daily.limit - quotaCheck.quotas.daily.used));
          res.set('X-RateLimit-Limit-Monthly', quotaCheck.quotas.monthly.limit);
          res.set('X-RateLimit-Remaining-Monthly', Math.max(0, quotaCheck.quotas.monthly.limit - quotaCheck.quotas.monthly.used));
        }
        
        const statusCode = quotaCheck.reason === 'blocked' ? 403 : 429;
        return res.status(statusCode).json(errorResponse);
      }
      
      // Set quota headers for successful requests
      if (quotaCheck.quotas) {
        res.set('X-RateLimit-Limit-Daily', quotaCheck.quotas.daily.limit);
        res.set('X-RateLimit-Remaining-Daily', Math.max(0, quotaCheck.quotas.daily.limit - quotaCheck.quotas.daily.used));
        res.set('X-RateLimit-Limit-Monthly', quotaCheck.quotas.monthly.limit);
        res.set('X-RateLimit-Remaining-Monthly', Math.max(0, quotaCheck.quotas.monthly.limit - quotaCheck.quotas.monthly.used));
      }
      
      // Record usage start
      await QuotaManager.recordUsage(
        userId,
        requestEndpoint,
        req.method,
        0, // Response time will be updated later
        0, // Status code will be updated later
        req.get('User-Agent'),
        req.ip
      );
      
      // Override res.end to capture response details
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        // Update usage with final details
        QuotaManager.recordUsage(
          userId,
          requestEndpoint,
          req.method,
          responseTime,
          res.statusCode,
          req.get('User-Agent'),
          req.ip
        ).then(() => {
          // Complete the request (decrement concurrent counter)
          return QuotaManager.completeRequest(userId);
        }).catch(error => {
          Logger.error('Failed to update usage record', { userId, error: error.message });
        });
        
        // Call original end
        originalEnd.call(this, chunk, encoding);
      };
      
      next();
      
    } catch (error) {
      Logger.error('Quota enforcement failed', { 
        userId, 
        endpoint: requestEndpoint, 
        error: error.message 
      });
      
      // Fail open - allow request but log error
      next();
    }
  };
};

// Middleware for high-cost operations
export const enforceHighCostQuota = enforceQuota({ weight: 5 });

// Middleware for scraping endpoints
export const enforceScrapingQuota = enforceQuota({ 
  weight: 3,
  endpoint: 'scraping_operation'
});

// Admin bypass middleware
export const bypassQuotaForAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    // Skip quota enforcement for admins
    return next();
  }
  
  // Apply normal quota enforcement
  return enforceQuota()(req, res, next);
};

// Quota analytics middleware
export const quotaAnalytics = async (req, res, next) => {
  if (!req.user) return next();
  
  try {
    const analytics = await QuotaManager.getUsageAnalytics(req.user.id, 7); // Last 7 days
    req.quotaAnalytics = analytics;
  } catch (error) {
    Logger.error('Failed to get quota analytics', { 
      userId: req.user.id, 
      error: error.message 
    });
  }
  
  next();
};