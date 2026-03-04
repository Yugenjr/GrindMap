import { logError } from '../utils/logger.util.js';
import { ERROR_CODES } from '../utils/response.util.js';

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, code } = err;
  let errorCode = code || ERROR_CODES.INTERNAL_SERVER_ERROR;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  if (err.code === 11000) {
    statusCode = 400;
    errorCode = ERROR_CODES.DUPLICATE_ENTRY;
    message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyPattern || {})[0];
    if (field) {
      message = `${field} already exists`;
    }
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = ERROR_CODES.INVALID_INPUT;
    message = 'Invalid ID format';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ERROR_CODES.INVALID_TOKEN;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Token expired';
  }

  // Centralized error logging
  logError({
    statusCode,
    message,
    errorCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get ? req.get('User-Agent') : undefined,
    time: new Date().toISOString(),
    ...(err.meta && { meta: err.meta }),
  });

  // Determine if error details should be exposed
  const isProduction = process.env.NODE_ENV === 'production';
  const exposedMessage = isProduction && statusCode >= 500 
    ? 'Internal server error' 
    : message;

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    message: exposedMessage,
    error: {
      code: errorCode,
      ...(err.meta && { details: err.meta }),
      ...(!isProduction && { stack: err.stack }),
    },
    ...(err.meta && !isProduction && { timestamp: new Date().toISOString() }),
  });

  // Send standardized error response
  const response = {
    success: false,
    message: process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION && statusCode >= 500 
      ? 'Internal server error' 
      : message,
    errorCode,
    correlationId: req.correlationId
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
  Logger.warn('Route not found', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      path: req.originalUrl,
      method: req.method,
    }
  });
};

export { errorHandler, notFound };
