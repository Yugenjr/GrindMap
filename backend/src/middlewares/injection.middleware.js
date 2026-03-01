import { AppError } from '../utils/appError.js';

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(--|\/\*|\*\/|;)/g,
  /(\b(SLEEP|BENCHMARK|WAITFOR)\s*\()/gi,
  /(\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and)/gi
];

const NOSQL_INJECTION_PATTERNS = [
  /\{\s*\$where\s*:/gi,
  /\{\s*\$ne\s*:/gi,
  /\{\s*\$gt\s*:/gi,
  /\{\s*\$regex\s*:/gi,
  /\{\s*\$or\s*:/gi,
  /\{\s*\$and\s*:/gi,
  /javascript\s*:/gi,
  /function\s*\(/gi
];

const detectInjection = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  return [...SQL_INJECTION_PATTERNS, ...NOSQL_INJECTION_PATTERNS]
    .some(pattern => pattern.test(input));
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      if (detectInjection(obj[key])) {
        throw new AppError('Potential injection attack detected', 400);
      }
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
};

export const injectionProtection = (req, res, next) => {
  try {
    // Check URL parameters
    Object.values(req.params).forEach(param => {
      if (detectInjection(param)) {
        throw new AppError('Invalid parameter format', 400);
      }
    });
    
    // Check query parameters
    Object.values(req.query).forEach(query => {
      if (detectInjection(query)) {
        throw new AppError('Invalid query format', 400);
      }
    });
    
    // Check request body
    if (req.body) {
      sanitizeObject(req.body);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};