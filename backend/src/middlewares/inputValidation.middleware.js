import { body, param, validationResult } from 'express-validator';
import { AppError } from '../utils/appError.js';

// Username validation rules
const usernameValidation = [
  param('username')
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be 1-50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username contains invalid characters')
    .trim()
    .escape()
];

// Platform validation
const platformValidation = [
  param('platform')
    .isIn(['leetcode', 'codeforces', 'codechef', 'atcoder', 'github', 'skillrack'])
    .withMessage('Invalid platform')
];

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400);
  }
  next();
};

// Export validation chains
export const validateUsername = [...usernameValidation, handleValidationErrors];
export const validatePlatform = [...platformValidation, handleValidationErrors];
export const validateScrapeRequest = [...usernameValidation, ...platformValidation, handleValidationErrors];

// Sanitize input to prevent XSS
export const sanitizeUsername = (req, res, next) => {
  if (req.params.username) {
    // Remove any HTML tags and dangerous characters
    req.params.username = req.params.username
      .replace(/<[^>]*>/g, '')
      .replace(/[<>'"&]/g, '')
      .trim();
  }
  next();
};