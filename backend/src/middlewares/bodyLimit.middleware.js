import { AppError } from '../utils/appError.js';

const BODY_SIZE_LIMITS = {
  health: 0,           // No body for health checks
  audit: 1024,         // 1KB for audit queries
  security: 2 * 1024,  // 2KB for security operations
  api: 100 * 1024,     // 100KB for general API
  scraping: 50 * 1024, // 50KB for scraping endpoints
  upload: 10 * 1024 * 1024 // 10MB for file uploads
};

const PARSING_LIMITS = {
  maxDepth: 10,        // Max JSON nesting depth
  maxKeys: 100,        // Max object keys
  maxArrayLength: 1000, // Max array length
  maxStringLength: 10000 // Max string length
};

export const bodySize = (maxSize) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }
    
    let bodySize = 0;
    const originalOn = req.on;
    
    req.on = function(event, listener) {
      if (event === 'data') {
        const originalListener = listener;
        const wrappedListener = (chunk) => {
          bodySize += chunk.length;
          
          if (bodySize > maxSize) {
            console.warn(`🚨 Request body too large: ${bodySize} bytes > ${maxSize} bytes`);
            
            const error = new AppError(`Request body too large. Limit: ${Math.round(maxSize / 1024)}KB`, 413);
            return next(error);
          }
          
          return originalListener(chunk);
        };
        
        return originalOn.call(this, event, wrappedListener);
      }
      
      return originalOn.call(this, event, listener);
    };
    
    next();
  };
};

export const validateJSONStructure = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || !req.body) {
    return next();
  }
  
  try {
    const violations = checkJSONLimits(req.body, '', 0);
    
    if (violations.length > 0) {
      console.warn(`🚨 JSON structure violations:`, violations);
      return next(new AppError(`Invalid JSON structure: ${violations.join(', ')}`, 400));
    }
    
    next();
  } catch (error) {
    next(new AppError('Invalid JSON structure', 400));
  }
};

const checkJSONLimits = (obj, path, depth) => {
  const violations = [];
  
  // Check nesting depth
  if (depth > PARSING_LIMITS.maxDepth) {
    violations.push(`Max depth exceeded at ${path}`);
    return violations;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      // Check array length
      if (obj.length > PARSING_LIMITS.maxArrayLength) {
        violations.push(`Array too long at ${path} (${obj.length} > ${PARSING_LIMITS.maxArrayLength})`);
      }
      
      // Check array elements
      obj.forEach((item, index) => {
        violations.push(...checkJSONLimits(item, `${path}[${index}]`, depth + 1));
      });
    } else {
      // Check object keys count
      const keys = Object.keys(obj);
      if (keys.length > PARSING_LIMITS.maxKeys) {
        violations.push(`Too many keys at ${path} (${keys.length} > ${PARSING_LIMITS.maxKeys})`);
      }
      
      // Check object properties
      keys.forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        violations.push(...checkJSONLimits(obj[key], newPath, depth + 1));
      });
    }
  } else if (typeof obj === 'string') {
    // Check string length
    if (obj.length > PARSING_LIMITS.maxStringLength) {
      violations.push(`String too long at ${path} (${obj.length} > ${PARSING_LIMITS.maxStringLength})`);
    }
  }
  
  return violations;
};

export const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }
    
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return next(new AppError('Content-Type header required', 400));
    }
    
    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );
    
    if (!isAllowed) {
      console.warn(`🚫 Invalid content type: ${contentType}`);
      return next(new AppError(`Invalid content type. Allowed: ${allowedTypes.join(', ')}`, 415));
    }
    
    next();
  };
};

// Specific body size limiters
export const healthBodyLimit = bodySize(BODY_SIZE_LIMITS.health);
export const auditBodyLimit = bodySize(BODY_SIZE_LIMITS.audit);
export const securityBodyLimit = bodySize(BODY_SIZE_LIMITS.security);
export const apiBodyLimit = bodySize(BODY_SIZE_LIMITS.api);
export const scrapingBodyLimit = bodySize(BODY_SIZE_LIMITS.scraping);
export const uploadBodyLimit = bodySize(BODY_SIZE_LIMITS.upload);