/**
 * Input Sanitization Middleware
 * Protects against XSS, SQL injection, and other injection attacks
 */

import xss from 'xss';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize string input to prevent XSS attacks
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Use xss library for basic sanitization
  let sanitized = xss(str, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
  
  // Additional sanitization for common injection patterns
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return sanitized;
};

/**
 * Sanitize HTML content with allowed tags
 */
const sanitizeHtmlContent = (html) => {
  if (typeof html !== 'string') return html;
  
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
      a: ['href', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
};

/**
 * Deep sanitize an object recursively
 */
const deepSanitize = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = deepSanitize(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = deepSanitize(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = deepSanitize(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = deepSanitize(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input data',
    });
  }
};

/**
 * Prevent parameter pollution attacks
 */
export const preventParameterPollution = (options = {}) => {
  const whitelist = options.whitelist || [];
  
  return (req, res, next) => {
    try {
      // Check for duplicate parameters in query
      if (req.query) {
        for (const key in req.query) {
          if (Array.isArray(req.query[key]) && !whitelist.includes(key)) {
            // Only allow whitelisted parameters to be arrays
            req.query[key] = req.query[key][0];
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Parameter pollution prevention error:', error);
      next(error);
    }
  };
};

/**
 * Validate and sanitize MongoDB query operators
 */
export const sanitizeMongoQuery = (req, res, next) => {
  const sanitizeMongoOperators = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'object') {
      for (const key in obj) {
        // Remove MongoDB operators from user input
        if (key.startsWith('$')) {
          delete obj[key];
          continue;
        }
        
        if (typeof obj[key] === 'object') {
          obj[key] = sanitizeMongoOperators(obj[key]);
        }
      }
    }
    
    return obj;
  };
  
  try {
    if (req.body) {
      req.body = sanitizeMongoOperators(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeMongoOperators(req.query);
    }
    
    next();
  } catch (error) {
    console.error('MongoDB query sanitization error:', error);
    next(error);
  }
};

export default {
  sanitizeInput,
  sanitizeString,
  sanitizeHtmlContent,
  preventParameterPollution,
  sanitizeMongoQuery,
};
