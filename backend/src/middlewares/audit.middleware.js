import fs from 'fs';
import path from 'path';
import { sanitizeSensitiveData } from '../utils/sanitizer.js';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const AUDIT_FILE = path.join(LOGS_DIR, 'audit.log');
const SECURITY_FILE = path.join(LOGS_DIR, 'security.log');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const writeLog = (file, data) => {
  const sanitizedData = sanitizeSensitiveData(data);
  const logEntry = `${new Date().toISOString()} ${JSON.stringify(sanitizedData)}\n`;
  fs.appendFileSync(file, logEntry);
};

export const auditLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  
  // Log request (sanitized)
  const requestLog = {
    type: 'REQUEST',
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    headers: sanitizeSensitiveData(req.headers),
    body: req.method !== 'GET' ? sanitizeSensitiveData(req.body) : undefined,
    query: sanitizeSensitiveData(req.query)
  };
  
  writeLog(AUDIT_FILE, requestLog);
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    const responseLog = {
      type: 'RESPONSE',
      requestId,
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: data ? data.length : 0,
      response: res.statusCode >= 400 ? sanitizeSensitiveData(data) : undefined
    };
    
    writeLog(AUDIT_FILE, responseLog);
    
    // Security monitoring
    if (res.statusCode >= 400) {
      const securityLog = {
        type: 'SECURITY_EVENT',
        requestId,
        timestamp: new Date().toISOString(),
        level: res.statusCode >= 500 ? 'CRITICAL' : 'WARNING',
        statusCode: res.statusCode,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: data
      };
      
      writeLog(SECURITY_FILE, securityLog);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

export const securityAudit = (req, res, next) => {
  const suspiciousPatterns = [
    { pattern: /\.\./g, type: 'PATH_TRAVERSAL' },
    { pattern: /<script/gi, type: 'XSS_ATTEMPT' },
    { pattern: /union.*select/gi, type: 'SQL_INJECTION' },
    { pattern: /javascript:/gi, type: 'JS_INJECTION' },
    { pattern: /eval\(/gi, type: 'CODE_INJECTION' }
  ];
  
  const checkString = `${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
  
  suspiciousPatterns.forEach(({ pattern, type }) => {
    if (pattern.test(checkString)) {
      const securityLog = {
        type: 'SECURITY_THREAT',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        threatType: type,
        level: 'HIGH',
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        payload: req.body
      };
      
      writeLog(SECURITY_FILE, securityLog);
    }
  });
  
  next();
};