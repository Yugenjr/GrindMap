import compression from 'compression';

// Configure compression middleware
export const apiCompression = compression({
  // Compress responses larger than 1KB
  threshold: 1024,
  
  // Compression level (1-9, 6 is default balance)
  level: 6,
  
  // Only compress these content types
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Compress JSON, text, and other compressible types
    return compression.filter(req, res);
  }
});