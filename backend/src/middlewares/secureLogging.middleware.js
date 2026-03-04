import { sanitizeSensitiveData, sanitizeError } from '../utils/sanitizer.js';

export const secureLogger = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Sanitize request data
  req.sanitizedBody = sanitizeSensitiveData(req.body);
  req.sanitizedQuery = sanitizeSensitiveData(req.query);
  req.sanitizedHeaders = sanitizeSensitiveData(req.headers);
  
  // Override res.send to sanitize response
  res.send = function(data) {
    const sanitizedData = sanitizeSensitiveData(data);
    return originalSend.call(this, sanitizedData);
  };
  
  // Override res.json to sanitize JSON responses
  res.json = function(data) {
    const sanitizedData = sanitizeSensitiveData(data);
    return originalJson.call(this, sanitizedData);
  };
  
  next();
};

export const secureErrorHandler = (err, req, res, next) => {
  const sanitizedError = sanitizeError(err);
  
  // Log sanitized error
  console.error('Sanitized Error:', {
    message: sanitizedError.message,
    stack: process.env.NODE_ENV === 'development' ? sanitizedError.stack : undefined,
    requestId: req.requestId,
    url: req.url,
    method: req.method
  });
  
  // Send sanitized error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : sanitizedError.message,
    requestId: req.requestId
  });
};