import { AppError } from '../utils/appError.js';

// API versioning security
export const apiVersionSecurity = (req, res, next) => {
  const supportedVersions = ['v1', 'v2'];
  const path = req.path;
  
  // Check if request is to API endpoint
  if (path.startsWith('/api/')) {
    // Extract version from path
    const versionMatch = path.match(/^\/api\/(v\d+)\//);
    
    if (versionMatch) {
      const version = versionMatch[1];
      
      // Validate version
      if (!supportedVersions.includes(version)) {
        return next(new AppError(`API version ${version} not supported`, 400));
      }
      
      req.apiVersion = version;
    } else {
      // No version specified, default to v1
      req.apiVersion = 'v1';
    }
  }

  // Check for version manipulation attempts
  const versionHeader = req.headers['api-version'] || req.headers['x-api-version'];
  if (versionHeader) {
    const suspiciousVersions = [
      'admin', 'test', 'debug', 'internal', 'beta', 'alpha',
      '0', '-1', '999', 'null', 'undefined', '../', '..'
    ];
    
    if (suspiciousVersions.includes(versionHeader.toLowerCase())) {
      return next(new AppError('Invalid API version header', 400));
    }
  }

  next();
};

// Deprecated version warning
export const deprecationWarning = (req, res, next) => {
  const deprecatedVersions = ['v1'];
  
  if (req.apiVersion && deprecatedVersions.includes(req.apiVersion)) {
    res.setHeader('X-API-Deprecation-Warning', `API version ${req.apiVersion} is deprecated`);
    res.setHeader('X-API-Sunset-Date', '2026-12-31');
  }
  
  next();
};

// Version-specific rate limiting
export const versionRateLimit = (req, res, next) => {
  // Different rate limits for different versions
  const rateLimits = {
    'v1': { requests: 100, window: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    'v2': { requests: 200, window: 15 * 60 * 1000 }  // 200 requests per 15 minutes
  };
  
  const version = req.apiVersion || 'v1';
  const limit = rateLimits[version];
  
  if (limit) {
    req.versionRateLimit = limit;
  }
  
  next();
};

// API endpoint validation
export const validateApiEndpoint = (req, res, next) => {
  const path = req.path;
  
  // Check for suspicious API paths
  const suspiciousPaths = [
    /\/api\/admin/i,
    /\/api\/internal/i,
    /\/api\/debug/i,
    /\/api\/test/i,
    /\/api\/\.\.\/\.\.\//,
    /\/api\/.*\.(php|asp|jsp)$/i,
    /\/api\/.*\/\.\./
  ];
  
  if (suspiciousPaths.some(pattern => pattern.test(path))) {
    return next(new AppError('Invalid API endpoint', 404));
  }
  
  // Validate endpoint format
  if (path.startsWith('/api/') && path.length > 200) {
    return next(new AppError('API endpoint path too long', 414));
  }
  
  next();
};