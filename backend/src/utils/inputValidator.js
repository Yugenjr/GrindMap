import { AppError, ERROR_CODES } from './appError.js';
import Logger from './logger.js';

class InputValidator {
  /**
   * Validate username for different platforms
   */
  static validateUsername(username, platform) {
    if (!username) {
      throw new AppError('Username is required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (typeof username !== 'string') {
      throw new AppError('Username must be a string', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Remove whitespace and convert to lowercase for consistency
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      throw new AppError('Username cannot be empty', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check length constraints
    if (cleanUsername.length < 1 || cleanUsername.length > 50) {
      throw new AppError('Username must be between 1 and 50 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Platform-specific validation
    switch (platform) {
      case 'LEETCODE':
        return this.validateLeetCodeUsername(cleanUsername);
      case 'CODEFORCES':
        return this.validateCodeforcesUsername(cleanUsername);
      case 'CODECHEF':
        return this.validateCodeChefUsername(cleanUsername);
      case 'GITHUB':
        return this.validateGitHubUsername(cleanUsername);
      case 'ATCODER':
        return this.validateAtCoderUsername(cleanUsername);
      case 'SKILLRACK':
        return this.validateSkillRackUsername(cleanUsername);
      default:
        return this.validateGenericUsername(cleanUsername);
    }
  }

  /**
   * Generic username validation (alphanumeric, underscore, hyphen)
   */
  static validateGenericUsername(username) {
    const pattern = /^[a-zA-Z0-9_-]+$/;
    if (!pattern.test(username)) {
      throw new AppError('Username contains invalid characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return username;
  }

  /**
   * LeetCode username validation
   */
  static validateLeetCodeUsername(username) {
    const pattern = /^[a-zA-Z0-9_-]+$/;
    if (!pattern.test(username)) {
      throw new AppError('LeetCode username can only contain letters, numbers, underscore, and hyphen', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (username.length > 30) {
      throw new AppError('LeetCode username cannot exceed 30 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return username;
  }

  /**
   * Codeforces username validation
   */
  static validateCodeforcesUsername(username) {
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(username)) {
      throw new AppError('Codeforces username can only contain letters, numbers, and underscore', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (username.length > 24) {
      throw new AppError('Codeforces username cannot exceed 24 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return username;
  }

  /**
   * CodeChef username validation
   */
  static validateCodeChefUsername(username) {
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(username)) {
      throw new AppError('CodeChef username can only contain letters, numbers, and underscore', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (username.length > 20) {
      throw new AppError('CodeChef username cannot exceed 20 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return username;
  }

  /**
   * GitHub username validation
   */
  static validateGitHubUsername(username) {
    const pattern = /^[a-zA-Z0-9-]+$/;
    if (!pattern.test(username)) {
      throw new AppError('GitHub username can only contain letters, numbers, and hyphen', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (username.startsWith('-') || username.endsWith('-')) {
      throw new AppError('GitHub username cannot start or end with hyphen', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (username.length > 39) {
      throw new AppError('GitHub username cannot exceed 39 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return username;
  }

  /**
   * AtCoder username validation
   */
  static validateAtCoderUsername(username) {
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(username)) {
      throw new AppError('AtCoder username can only contain letters, numbers, and underscore', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (username.length > 16) {
      throw new AppError('AtCoder username cannot exceed 16 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return username;
  }

  /**
   * SkillRack username validation
   */
  static validateSkillRackUsername(username) {
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(username)) {
      throw new AppError('SkillRack username can only contain letters, numbers, and underscore', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return username;
  }

  /**
   * Sanitize response data to prevent XSS and injection attacks
   */
  static sanitizeResponse(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters and HTML tags
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof value === 'number') {
        // Validate numbers
        sanitized[key] = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeResponse(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate API response structure
   */
  static validateApiResponse(data, platform, requiredFields = []) {
    if (!data) {
      throw new AppError(`No data received from ${platform}`, 502, ERROR_CODES.EXTERNAL_API_ERROR);
    }

    if (typeof data !== 'object') {
      throw new AppError(`Invalid response format from ${platform}`, 502, ERROR_CODES.EXTERNAL_API_ERROR);
    }

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in data)) {
        Logger.warn(`Missing required field '${field}' in ${platform} response`, { data });
        // Don't throw error for missing fields, just log warning
      }
    }

    return true;
  }

  /**
   * Validate platform name
   */
  static validatePlatform(platform) {
    const validPlatforms = ['LEETCODE', 'CODEFORCES', 'CODECHEF', 'GITHUB', 'ATCODER', 'SKILLRACK'];
    
    if (!platform || !validPlatforms.includes(platform.toUpperCase())) {
      throw new AppError('Invalid platform specified', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    return platform.toUpperCase();
  }

  /**
   * Rate limiting validation
   */
  static validateRateLimit(platform, lastRequestTime) {
    const rateLimits = {
      LEETCODE: 2000,    // 2 seconds
      CODEFORCES: 1000,  // 1 second
      CODECHEF: 3000,    // 3 seconds (puppeteer)
      GITHUB: 1000,      // 1 second
      ATCODER: 2000,     // 2 seconds
      SKILLRACK: 3000    // 3 seconds
    };

    const minInterval = rateLimits[platform] || 2000;
    const timeSinceLastRequest = Date.now() - (lastRequestTime || 0);

    if (timeSinceLastRequest < minInterval) {
      const waitTime = Math.ceil((minInterval - timeSinceLastRequest) / 1000);
      throw new AppError(
        `Rate limit exceeded for ${platform}. Please wait ${waitTime} seconds.`,
        429,
        ERROR_CODES.RATE_LIMIT_EXCEEDED
      );
    }

    return true;
  }
}

export default InputValidator;