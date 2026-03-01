import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '../utils/standardResponse.js';

// Simple request validation middleware
export const validateUsername = (req, res, next) => {
  const { username } = req.params;
  
  if (!username) {
    return res.status(400).json(
      createErrorResponse('Username is required', ERROR_CODES.VALIDATION_ERROR, 400)
    );
  }
  
  if (typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json(
      createErrorResponse('Username must be a non-empty string', ERROR_CODES.VALIDATION_ERROR, 400)
    );
  }
  
  if (username.length > 50) {
    return res.status(400).json(
      createErrorResponse('Username too long (max 50 characters)', ERROR_CODES.VALIDATION_ERROR, 400)
    );
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return res.status(400).json(
      createErrorResponse('Username contains invalid characters', ERROR_CODES.VALIDATION_ERROR, 400)
    );
  }
  
  // Sanitize and continue
  req.params.username = username.trim();
  next();
};

// Platform validation
export const validatePlatform = (req, res, next) => {
  const { platform } = req.params;
  const validPlatforms = ['leetcode', 'codeforces', 'codechef', 'atcoder', 'github', 'skillrack'];
  
  if (!platform || !validPlatforms.includes(platform.toLowerCase())) {
    return res.status(400).json(
      createErrorResponse('Invalid platform', ERROR_CODES.INVALID_PLATFORM, 400, { validPlatforms })
    );
  }
  
  req.params.platform = platform.toLowerCase();
  next();
};