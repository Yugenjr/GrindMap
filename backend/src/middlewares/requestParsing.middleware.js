import { AppError } from '../utils/appError.js';

const MALICIOUS_PATTERNS = [
  // Billion laughs attack patterns
  /(&\w+;){10,}/g,
  
  // Zip bomb patterns in base64
  /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
  
  // Excessive repetition patterns
  /(.{1,10})\1{100,}/g,
  
  // Nested structure bombs
  /(\[|\{)(\s*\1){20,}/g,
  
  // Unicode bomb patterns
  /[\u0000-\u001F\u007F-\u009F]{10,}/g
];

export const maliciousPayloadDetection = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || !req.body) {
    return next();
  }
  
  try {
    const bodyString = JSON.stringify(req.body);
    
    // Check for malicious patterns
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(bodyString)) {
        console.warn('🚨 Malicious payload pattern detected');
        return next(new AppError('Malicious payload detected', 400));
      }
    }
    
    // Check for excessive nesting in JSON string
    const openBrackets = (bodyString.match(/[\[\{]/g) || []).length;
    const closeBrackets = (bodyString.match(/[\]\}]/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      return next(new AppError('Malformed JSON structure', 400));
    }
    
    if (openBrackets > 1000) {
      console.warn(`🚨 Excessive JSON nesting: ${openBrackets} brackets`);
      return next(new AppError('JSON structure too complex', 400));
    }
    
    next();
  } catch (error) {
    next(new AppError('Invalid request payload', 400));
  }
};

export const requestSizeTracker = (req, res, next) => {
  let totalSize = 0;
  
  // Track URL size
  totalSize += Buffer.byteLength(req.url, 'utf8');
  
  // Track headers size
  Object.entries(req.headers).forEach(([key, value]) => {
    totalSize += Buffer.byteLength(`${key}: ${value}`, 'utf8');
  });
  
  // Track body size (if present)
  if (req.body) {
    totalSize += Buffer.byteLength(JSON.stringify(req.body), 'utf8');
  }
  
  // Add size info to request
  req.totalRequestSize = totalSize;
  
  // Log large requests
  if (totalSize > 100 * 1024) { // 100KB
    console.warn(`📊 Large request detected: ${Math.round(totalSize / 1024)}KB from ${req.ip}`);
  }
  
  next();
};

export const parseTimeLimit = (maxTimeMs = 1000) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || !req.body) {
      return next();
    }
    
    const startTime = Date.now();
    
    // Override JSON.parse to add time limit
    const originalParse = JSON.parse;
    JSON.parse = function(text, reviver) {
      const parseStart = Date.now();
      
      try {
        const result = originalParse.call(this, text, reviver);
        const parseTime = Date.now() - parseStart;
        
        if (parseTime > maxTimeMs) {
          console.warn(`⏱️ Slow JSON parsing: ${parseTime}ms`);
        }
        
        return result;
      } finally {
        JSON.parse = originalParse; // Restore original
      }
    };
    
    next();
  };
};