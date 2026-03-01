const rateLimitStore = new Map();

export const rateLimiter = (maxRequests = 10, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip || 'global';
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 0, resetTime: now + windowMs });
    }
    
    const record = rateLimitStore.get(key);
    
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }
    
    if (record.count >= maxRequests) {
      return next(new AppError('Too many requests', 429));
    }
    
    record.count++;
    next();
  };
};