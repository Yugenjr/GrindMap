import Logger from '../utils/logger.js';

// Enhanced CORS security middleware
export const corsSecurityCheck = (req, res, next) => {
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  
  // Log suspicious CORS attempts
  if (origin && !isAllowedOrigin(origin)) {
    Logger.warn('Blocked CORS request', {
      origin,
      referer,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path
    });
  }
  
  // Block requests with suspicious headers
  if (req.get('X-Forwarded-Host') && req.get('X-Forwarded-Host') !== req.get('Host')) {
    return res.status(403).json({
      success: false,
      error: 'Suspicious request headers detected'
    });
  }
  
  next();
};

function isAllowedOrigin(origin) {
  const env = process.env.NODE_ENV || 'development';
  const allowedOrigins = {
    development: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    production: ['https://grindmap.vercel.app', 'https://www.grindmap.com']
  };
  
  const allowed = allowedOrigins[env] || allowedOrigins.development;
  return allowed.includes(origin);
}