/**
 * Security Utilities
 * Input sanitization, validation, and security helper functions
 */

import { SECURITY_PATTERNS, SECURITY_EVENTS, SENSITIVE_PATTERNS } from '../config/security.config.js';
import { logSecurityEvent } from './logger.util.js';

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both key and value
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Detect SQL injection attempts
 */
export const detectSQLInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  return SECURITY_PATTERNS.SQL_INJECTION.some(pattern => pattern.test(input));
};

/**
 * Detect NoSQL injection attempts
 */
export const detectNoSQLInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  // Check for MongoDB operators
  if (SECURITY_PATTERNS.NOSQL_INJECTION.some(pattern => pattern.test(input))) {
    return true;
  }
  
  // Check if input is an object with $ operators
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'object') {
      const jsonStr = JSON.stringify(parsed);
      return /"\$\w+"/.test(jsonStr);
    }
  } catch (e) {
    // Not JSON, continue with other checks
  }
  
  return false;
};

/**
 * Detect XSS attempts
 */
export const detectXSS = (input) => {
  if (typeof input !== 'string') return false;
  
  return SECURITY_PATTERNS.XSS.some(pattern => pattern.test(input));
};

/**
 * Detect command injection attempts
 */
export const detectCommandInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  return SECURITY_PATTERNS.COMMAND_INJECTION.some(pattern => pattern.test(input));
};

/**
 * Detect path traversal attempts
 */
export const detectPathTraversal = (input) => {
  if (typeof input !== 'string') return false;
  
  return SECURITY_PATTERNS.PATH_TRAVERSAL.some(pattern => pattern.test(input));
};

/**
 * Comprehensive security check for input
 */
export const checkInputSecurity = (input, req = null) => {
  if (typeof input !== 'string') return { safe: true };
  
  const threats = [];
  
  if (detectSQLInjection(input)) {
    threats.push(SECURITY_EVENTS.SQL_INJECTION_ATTEMPT);
  }
  
  if (detectNoSQLInjection(input)) {
    threats.push(SECURITY_EVENTS.NOSQL_INJECTION_ATTEMPT);
  }
  
  if (detectXSS(input)) {
    threats.push(SECURITY_EVENTS.XSS_ATTEMPT);
  }
  
  if (detectCommandInjection(input)) {
    threats.push(SECURITY_EVENTS.COMMAND_INJECTION_ATTEMPT);
  }
  
  if (detectPathTraversal(input)) {
    threats.push(SECURITY_EVENTS.PATH_TRAVERSAL_ATTEMPT);
  }
  
  if (threats.length > 0 && req) {
    logSecurityEvent({
      type: SECURITY_EVENTS.SUSPICIOUS_INPUT,
      threats,
      input: input.slice(0, 100), // Log first 100 chars only
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: req.originalUrl,
    });
  }
  
  return {
    safe: threats.length === 0,
    threats,
  };
};

/**
 * Sanitize MongoDB query to prevent NoSQL injection
 */
export const sanitizeMongoQuery = (query) => {
  if (typeof query !== 'object' || query === null) {
    return query;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Remove $ operators from keys (except whitelisted ones)
    if (key.startsWith('$') && !['$and', '$or'].includes(key)) {
      continue; // Skip dangerous operators
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate username format
 */
export const isValidUsername = (username) => {
  if (typeof username !== 'string') return false;
  
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'] };
  }
  
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate secure random token
 */
export const generateSecureToken = async (length = 32) => {
  const crypto = await import('crypto');
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data for logging
 */
export const hashForLogging = async (data) => {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(String(data)).digest('hex').slice(0, 8);
};

/**
 * Redact sensitive information from logs
 */
export const redactSensitiveData = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const redacted = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive terms
    const isSensitive = 
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('apikey') ||
      lowerKey.includes('api_key') ||
      lowerKey.includes('authorization');
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
};

/**
 * Rate limit key generator
 */
export const generateRateLimitKey = (req, suffix = '') => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'unknown';
  const userId = req.user?.id || 'anonymous';
  
  return `${ip}:${userId}:${suffix}`;
};

/**
 * Validate JWT token format (basic check)
 */
export const isValidJWTFormat = (token) => {
  if (typeof token !== 'string') return false;
  
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Check if IP is private/internal
 */
export const isPrivateIP = (ip) => {
  const privateRanges = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^::1$/,
    /^fc00:/,
  ];
  
  return privateRanges.some(range => range.test(ip));
};

/**
 * Escape HTML entities
 */
export const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'\/]/g, char => htmlEntities[char]);
};

/**
 * Validate and sanitize URL
 */
export const sanitizeURL = (url) => {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch (e) {
    return null;
  }
};

/**
 * Check for common malicious patterns
 */
export const containsMaliciousPatterns = (input) => {
  if (typeof input !== 'string') return false;
  
  const maliciousPatterns = [
    /eval\(/gi,
    /exec\(/gi,
    /function\s*\(/gi,
    /setTimeout\(/gi,
    /setInterval\(/gi,
    /<script/gi,
    /javascript:/gi,
    /data:text\/html/gi,
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = async () => {
  const crypto = await import('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Verify CSRF token
 */
export const verifyCSRFToken = (token, sessionToken) => {
  if (!token || !sessionToken) return false;
  
  return token === sessionToken;
};

/**
 * Time-safe string comparison to prevent timing attacks
 */
export const timingSafeCompare = async (a, b) => {
  const crypto = await import('crypto');
  
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(bufferA, bufferB);
};

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeMongoQuery,
  checkInputSecurity,
  isValidEmail,
  isValidUsername,
  validatePasswordStrength,
  generateSecureToken,
  redactSensitiveData,
  escapeHTML,
  sanitizeURL,
  containsMaliciousPatterns,
  generateCSRFToken,
  verifyCSRFToken,
  timingSafeCompare,
};
