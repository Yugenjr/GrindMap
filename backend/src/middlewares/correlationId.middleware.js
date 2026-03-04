import { randomUUID } from 'crypto';

/**
 * Generate correlation ID middleware
 */
export const correlationId = (req, res, next) => {
  const correlationId = (req.headers && req.headers['x-correlation-id']) || randomUUID();
  
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  
  next();
};