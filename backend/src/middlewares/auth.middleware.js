import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";
import { isValidJWTFormat, timingSafeCompare } from "../utils/security.util.js";
import { logSecurityEvent } from "../utils/logger.util.js";
import { ERROR_CODES } from "../utils/response.util.js";

/**
 * JWT verification middleware with enhanced security
 */
export const protect = (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No token provided
    if (!token) {
      logSecurityEvent({
        type: 'MISSING_TOKEN',
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.get('user-agent'),
      });
      
      return next(new AppError(
        "Not authorized, no token provided",
        401,
        true,
        ERROR_CODES.UNAUTHORIZED
      ));
    }

    // Validate JWT format before verification
    if (!isValidJWTFormat(token)) {
      logSecurityEvent({
        type: 'INVALID_TOKEN_FORMAT',
        ip: req.ip,
        url: req.originalUrl,
      });
      
      return next(new AppError(
        "Invalid token format",
        401,
        true,
        ERROR_CODES.INVALID_TOKEN
      ));
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], // Explicitly specify allowed algorithms
        issuer: 'grindmap-api', // Verify issuer
      });

      // Attach user info to request
      req.user = { 
        id: decoded.id,
        email: decoded.email,
        tokenIat: decoded.iat,
      };

      // Check if token is about to expire (optional warning)
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      
      if (expiresIn < 300) { // Less than 5 minutes
        res.setHeader('X-Token-Expiring', 'true');
        res.setHeader('X-Token-Expires-In', expiresIn.toString());
      }

      next();
    } catch (error) {
      // Token verification failed
      let errorMessage = "Token verification failed";
      let errorCode = ERROR_CODES.INVALID_TOKEN;

      if (error.name === 'TokenExpiredError') {
        errorMessage = "Token has expired";
        errorCode = ERROR_CODES.TOKEN_EXPIRED;
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = "Invalid token";
        errorCode = ERROR_CODES.INVALID_TOKEN;
      } else if (error.name === 'NotBeforeError') {
        errorMessage = "Token not yet valid";
        errorCode = ERROR_CODES.INVALID_TOKEN;
      }

      logSecurityEvent({
        type: 'TOKEN_VERIFICATION_FAILED',
        error: error.name,
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.get('user-agent'),
      });

      // Record failed attempt for rate limiting
      if (req.recordFailedAttempt) {
        req.recordFailedAttempt();
      }

      return next(new AppError(errorMessage, 401, true, errorCode));
    }
  } catch (error) {
    return next(new AppError(
      "Authentication error",
      500,
      true,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    ));
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(); // No token, but that's okay
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, email: decoded.email };
    } catch (error) {
      // Token invalid, but we don't fail - just continue without user
      console.log('Optional auth failed:', error.message);
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(
        "Not authorized",
        401,
        true,
        ERROR_CODES.UNAUTHORIZED
      ));
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent({
        type: 'INSUFFICIENT_PERMISSIONS',
        userId: req.user.id,
        requiredRoles: roles,
        userRole: req.user.role,
        ip: req.ip,
        url: req.originalUrl,
      });

      return next(new AppError(
        "Insufficient permissions",
        403,
        true,
        ERROR_CODES.UNAUTHORIZED
      ));
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
export const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(
        "Not authorized",
        401,
        true,
        ERROR_CODES.UNAUTHORIZED
      ));
    }

    // Allow if user has admin role
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership (will be verified in controller)
    req.checkOwnership = {
      userId: req.user.id,
      field: resourceUserIdField,
    };

    next();
  };
};
