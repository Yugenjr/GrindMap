/**
 * Input validation for scraper endpoints
 */
class ScraperValidator {
  static validateUsername(username, platform) {
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required and must be a string');
    }
    
    const trimmed = username.trim();
    if (trimmed.length === 0) {
      throw new Error('Username cannot be empty');
    }
    
    if (trimmed.length > 50) {
      throw new Error('Username too long (max 50 characters)');
    }
    
    // Platform-specific validation
    const patterns = {
      LEETCODE: /^[a-zA-Z0-9_-]+$/,
      CODEFORCES: /^[a-zA-Z0-9_]+$/,
      CODECHEF: /^[a-zA-Z0-9_]+$/,
      GITHUB: /^[a-zA-Z0-9_-]+$/,
      ATCODER: /^[a-zA-Z0-9_]+$/,
      SKILLRACK: /^[a-zA-Z0-9_]+$/
    };
    
    const pattern = patterns[platform?.toUpperCase()];
    if (pattern && !pattern.test(trimmed)) {
      throw new Error(`Invalid username format for ${platform}`);
    }
    
    return trimmed;
  }
  
  static sanitizeResponse(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else if (typeof value === 'number' && !isNaN(value)) {
        sanitized[key] = Math.max(0, Math.floor(value));
      } else if (value !== null && value !== undefined) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

export default ScraperValidator;