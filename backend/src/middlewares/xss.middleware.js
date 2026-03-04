import { AppError } from '../utils/appError.js';

const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload
  /<img[^>]+src[^>]*=.*?javascript:/gi,
  /<svg[^>]*>.*?<\/svg>/gi
];

const DANGEROUS_ATTRIBUTES = [
  'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
  'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
  'onkeydown', 'onkeyup', 'onkeypress'
];

export const xssProtection = (req, res, next) => {
  try {
    // Check all string inputs for XSS patterns
    const checkForXSS = (obj, path = '') => {
      if (typeof obj === 'string') {
        // Check for XSS patterns
        for (const pattern of XSS_PATTERNS) {
          if (pattern.test(obj)) {
            throw new AppError(`XSS attempt detected in ${path}`, 400);
          }
        }
        
        // Check for dangerous attributes
        for (const attr of DANGEROUS_ATTRIBUTES) {
          if (obj.toLowerCase().includes(attr)) {
            throw new AppError(`Dangerous attribute detected in ${path}`, 400);
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          checkForXSS(value, path ? `${path}.${key}` : key);
        }
      }
    };
    
    // Check URL parameters
    checkForXSS(req.params, 'params');
    
    // Check query parameters
    checkForXSS(req.query, 'query');
    
    // Check request body
    if (req.body) {
      checkForXSS(req.body, 'body');
    }
    
    // Check headers for XSS
    const dangerousHeaders = ['user-agent', 'referer', 'x-forwarded-for'];
    dangerousHeaders.forEach(header => {
      const value = req.get(header);
      if (value) {
        checkForXSS(value, `header.${header}`);
      }
    });
    
    next();
  } catch (error) {
    // Log XSS attempt
    console.warn('🚨 XSS ATTEMPT BLOCKED:', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
      error: error.message
    });
    
    next(error);
  }
};

export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};