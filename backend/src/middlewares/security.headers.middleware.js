/**
 * Security Headers Middleware
 * Implements comprehensive security headers using Helmet and custom configurations
 */

import helmet from 'helmet';

/**
 * Configure Helmet with secure defaults
 * Helmet helps protect against well-known web vulnerabilities
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Expect-CT header
  expectCt: {
    enforce: true,
    maxAge: 86400, // 24 hours
  },

  // Frameguard to prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // Hide Powered-By header
  hidePoweredBy: true,

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // Don't Sniff Mimetype
  noSniff: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Referrer Policy
  referrerPolicy: {
    policy: 'same-origin',
  },

  // XSS Filter
  xssFilter: true,
});

/**
 * Additional custom security headers
 */
export const additionalSecurityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent site from being framed
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Feature Policy / Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  
  // Cross-Origin Resource Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Cross-Origin Opener Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Cross-Origin Embedder Policy
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  next();
};

/**
 * Configure CORS with security best practices
 */
export const secureCorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3001', 'http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 600, // 10 minutes
};

/**
 * Rate limiting configuration
 */
export const createRateLimiter = (options = {}) => {
  return {
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => {
      // Skip rate limiting for health check endpoints
      return req.path === '/health' || req.path === '/api/health';
    },
    ...options,
  };
};

export default {
  securityHeaders,
  additionalSecurityHeaders,
  secureCorsOptions,
  createRateLimiter,
};
