import crypto from 'crypto';
import { AppError } from '../utils/appError.js';

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens to prevent Cross-Site Request Forgery attacks
 */

// Store CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a secure CSRF token
 */
function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + TOKEN_EXPIRY;

  csrfTokens.set(sessionId, { token, expiry });

  // Clean up expired tokens periodically
  setTimeout(() => {
    csrfTokens.delete(sessionId);
  }, TOKEN_EXPIRY);

  return token;
}

/**
 * Validate CSRF token
 */
function validateCSRFToken(sessionId, token) {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check if token has expired
  if (Date.now() > stored.expiry) {
    csrfTokens.delete(sessionId);
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(stored.token, 'hex')
  );
}

/**
 * CSRF Protection Middleware
 * Adds CSRF token to response and validates incoming tokens
 */
export const csrfProtection = (req, res, next) => {
  try {
    // Generate session ID (in production, use proper session management)
    const sessionId = req.ip || req.connection.remoteAddress || 'anonymous';

    // For GET requests that return sensitive data, validate CSRF token
    if (req.method === 'GET' && req.headers['x-csrf-token']) {
      const token = req.headers['x-csrf-token'];

      if (!validateCSRFToken(sessionId, token)) {
        throw new AppError('Invalid CSRF token', 403);
      }
    }

    // For state-changing requests (POST, PUT, DELETE, PATCH), always require CSRF token
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const token = req.headers['x-csrf-token'] || req.body._csrf;

      if (!token) {
        throw new AppError('CSRF token required', 403);
      }

      if (!validateCSRFToken(sessionId, token)) {
        throw new AppError('Invalid CSRF token', 403);
      }
    }

    // Generate new CSRF token for this session
    const csrfToken = generateCSRFToken(sessionId);

    // Add token to response headers
    res.setHeader('X-CSRF-Token', csrfToken);

    // Also add to response for convenience
    res.locals.csrfToken = csrfToken;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to provide CSRF token endpoint
 */
export const csrfTokenEndpoint = (req, res) => {
  const sessionId = req.ip || req.connection.remoteAddress || 'anonymous';
  const token = generateCSRFToken(sessionId);

  res.json({
    success: true,
    csrfToken: token,
    message: 'CSRF token generated successfully'
  });
};

/**
 * Clean up expired tokens (call this periodically)
 */
export const cleanupExpiredTokens = () => {
  const now = Date.now();

  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now > data.expiry) {
      csrfTokens.delete(sessionId);
    }
  }
};

// Clean up expired tokens every 30 minutes
setInterval(cleanupExpiredTokens, 30 * 60 * 1000);