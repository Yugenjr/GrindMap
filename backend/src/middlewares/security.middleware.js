import { SECURITY_HEADERS, SECURITY_CONFIG } from '../config/security.config.js';
import { checkInputSecurity, sanitizeObject, redactSensitiveData } from '../utils/security.util.js';
import { AppError } from '../utils/appError.js';
import { logSecurityEvent } from '../utils/logger.util.js';

/**
 * Apply security headers to all responses
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enhanced XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  const cspDirectives = SECURITY_CONFIG.HEADERS.CSP_DIRECTIVES;
  const csp = Object.entries(cspDirectives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HTTPS enforcement (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      `max-age=${SECURITY_CONFIG.HEADERS.HSTS_MAX_AGE}; includeSubDomains; preload`
    );
  }
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

/**
 * Input sanitization middleware
 */
const sanitizeInputs = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    next(new AppError('Invalid input data', 400));
  }
};

/**
 * Security threat detection middleware
 */
const detectThreats = (req, res, next) => {
  const inputsToCheck = [];
  
  // Collect all inputs
  if (req.body) {
    inputsToCheck.push(...Object.values(req.body).filter(v => typeof v === 'string'));
  }
  if (req.query) {
    inputsToCheck.push(...Object.values(req.query).filter(v => typeof v === 'string'));
  }
  if (req.params) {
    inputsToCheck.push(...Object.values(req.params).filter(v => typeof v === 'string'));
  }
  
  // Check each input for threats
  for (const input of inputsToCheck) {
    const result = checkInputSecurity(input, req);
    
    if (!result.safe) {
      logSecurityEvent({
        type: 'THREAT_DETECTED',
        threats: result.threats,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        url: req.originalUrl,
        method: req.method,
      });
      
      return next(new AppError('Suspicious input detected', 400));
    }
  }
  
  next();
};

/**
 * Request logging with sensitive data redaction
 */
const secureRequestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    // Log request (with redacted sensitive data)
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      duration,
      body: redactSensitiveData(req.body || {}),
      query: redactSensitiveData(req.query || {}),
    };
    
    // Only log in development or for errors
    if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
      console.log('[SECURE REQUEST]', JSON.stringify(logData, null, 2));
    }
    
    // Call original end function
    originalEnd.apply(res, args);
  };
  
  next();
};

/**
 * IP-based blocking middleware
 */
const failedAttempts = new Map(); // Store failed attempts by IP

const ipBlockingMiddleware = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  
  // Clean up old entries (older than block duration)
  for (const [key, data] of failedAttempts.entries()) {
    if (now - data.timestamp > SECURITY_CONFIG.IP_BLOCKING.BLOCK_DURATION) {
      failedAttempts.delete(key);
    }
  }
  
  // Check if IP is blocked
  const attempts = failedAttempts.get(ip);
  if (attempts && attempts.count >= SECURITY_CONFIG.IP_BLOCKING.MAX_FAILED_ATTEMPTS) {
    const timeRemaining = Math.ceil(
      (SECURITY_CONFIG.IP_BLOCKING.BLOCK_DURATION - (now - attempts.timestamp)) / 1000 / 60
    );
    
    logSecurityEvent({
      type: 'IP_BLOCKED',
      ip,
      attempts: attempts.count,
      timeRemaining,
    });
    
    return next(new AppError(`Too many failed attempts. Try again in ${timeRemaining} minutes`, 429));
  }
  
  // Attach method to record failed attempt
  req.recordFailedAttempt = () => {
    const current = failedAttempts.get(ip) || { count: 0, timestamp: now };
    failedAttempts.set(ip, {
      count: current.count + 1,
      timestamp: now,
    });
  };
  
  next();
};

/**
 * CORS validation middleware (additional layer)
 */
const validateCORS = (req, res, next) => {
  const origin = req.get('origin');
  
  // Skip CORS check for same-origin requests
  if (!origin) {
    return next();
  }
  
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }
  
  if (!allowedOrigins.includes(origin) && !allowedOrigins.includes('*')) {
    logSecurityEvent({
      type: 'CORS_VIOLATION',
      origin,
      ip: req.ip,
      url: req.originalUrl,
    });
    
    return next(new AppError('Origin not allowed', 403));
  }
  
  next();
};

/**
 * Request size limit middleware (additional layer)
 */
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    logSecurityEvent({
      type: 'REQUEST_TOO_LARGE',
      size: contentLength,
      maxSize,
      ip: req.ip,
      url: req.originalUrl,
    });
    
    return next(new AppError('Request entity too large', 413));
  }
  
  next();
};

/**
 * HTTP method validation
 */
const validateHTTPMethod = (req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  
  if (!allowedMethods.includes(req.method)) {
    logSecurityEvent({
      type: 'INVALID_HTTP_METHOD',
      method: req.method,
      ip: req.ip,
      url: req.originalUrl,
    });
    
    return next(new AppError('Method not allowed', 405));
  }
  
  next();
};

/**
 * Combine all security middlewares
 */
const applySecurity = [
  securityHeaders,
  validateHTTPMethod,
  requestSizeLimit,
  sanitizeInputs,
  detectThreats,
  ipBlockingMiddleware,
];

export {
  securityHeaders,
  sanitizeInputs,
  detectThreats,
  secureRequestLogger,
  ipBlockingMiddleware,
  validateCORS,
  requestSizeLimit,
  validateHTTPMethod,
  applySecurity,
};