import { AppError } from '../utils/appError.js';

const RESPONSE_LIMITS = {
  health: 1024,        // 1KB for health checks
  audit: 50 * 1024,    // 50KB for audit logs
  security: 10 * 1024, // 10KB for security endpoints
  api: 500 * 1024,     // 500KB for API responses
  scraping: 1024 * 1024 // 1MB for scraping endpoints (largest)
};

const compressionBombPatterns = [
  /(.)\1{1000,}/g,     // Repeated characters (1000+)
  /\s{1000,}/g,        // Excessive whitespace
  /null.*null.*null/g,  // Repeated null values
  /""\s*,\s*""/g       // Empty string patterns
];

export const responseSizeLimit = (maxSize = RESPONSE_LIMITS.api) => {
  return (req, res, next) => {
    let responseSize = 0;
    const originalWrite = res.write;
    const originalEnd = res.end;
    
    // Override res.write to track size
    res.write = function(chunk, encoding) {
      if (chunk) {
        responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
        
        if (responseSize > maxSize) {
          console.warn(`🚨 Response size limit exceeded: ${responseSize} bytes > ${maxSize} bytes`);
          
          if (!res.headersSent) {
            res.status(413).json({
              success: false,
              error: 'Response too large',
              limit: `${Math.round(maxSize / 1024)}KB`,
              size: `${Math.round(responseSize / 1024)}KB`
            });
          }
          return false;
        }
      }
      
      return originalWrite.call(this, chunk, encoding);
    };
    
    // Override res.end to track final size
    res.end = function(chunk, encoding) {
      if (chunk) {
        responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
        
        if (responseSize > maxSize && !res.headersSent) {
          res.status(413).json({
            success: false,
            error: 'Response too large',
            limit: `${Math.round(maxSize / 1024)}KB`,
            size: `${Math.round(responseSize / 1024)}KB`
          });
          return;
        }
      }
      
      // Add response size header
      res.set('X-Response-Size', responseSize.toString());
      
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

export const compressionBombProtection = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    try {
      const jsonString = JSON.stringify(data);
      
      // Check for compression bomb patterns
      for (const pattern of compressionBombPatterns) {
        if (pattern.test(jsonString)) {
          console.warn('🧨 Compression bomb pattern detected in response');
          
          return res.status(413).json({
            success: false,
            error: 'Response contains suspicious patterns',
            message: 'Data compression anomaly detected'
          });
        }
      }
      
      // Check compression ratio
      const originalSize = Buffer.byteLength(jsonString, 'utf8');
      const compressedSize = JSON.stringify(data).length;
      const compressionRatio = originalSize / compressedSize;
      
      if (compressionRatio > 100) { // Suspicious compression ratio
        console.warn(`🧨 Suspicious compression ratio: ${compressionRatio.toFixed(2)}:1`);
        
        return res.status(413).json({
          success: false,
          error: 'Response compression ratio too high',
          ratio: `${compressionRatio.toFixed(2)}:1`
        });
      }
      
      return originalJson.call(this, data);
    } catch (error) {
      console.error('Error in compression bomb protection:', error.message);
      return originalJson.call(this, data);
    }
  };
  
  next();
};

// Specific size limiters
export const healthSizeLimit = responseSizeLimit(RESPONSE_LIMITS.health);
export const auditSizeLimit = responseSizeLimit(RESPONSE_LIMITS.audit);
export const securitySizeLimit = responseSizeLimit(RESPONSE_LIMITS.security);
export const scrapingSizeLimit = responseSizeLimit(RESPONSE_LIMITS.scraping);

// Response streaming for large data
export const streamLargeResponse = (data, res, chunkSize = 64 * 1024) => {
  const jsonString = JSON.stringify(data);
  const totalSize = Buffer.byteLength(jsonString, 'utf8');
  
  if (totalSize <= chunkSize) {
    return res.json(data);
  }
  
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Length': totalSize,
    'X-Response-Size': totalSize.toString(),
    'X-Streaming': 'true'
  });
  
  let offset = 0;
  const sendChunk = () => {
    const chunk = jsonString.slice(offset, offset + chunkSize);
    if (chunk) {
      res.write(chunk);
      offset += chunkSize;
      setImmediate(sendChunk);
    } else {
      res.end();
    }
  };
  
  sendChunk();
};