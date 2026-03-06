import { body, param, query, validationResult } from 'express-validator';
import xss from 'xss';
import { escapeString } from '../utils/dbSanitizer.js';
import { AppError } from '../utils/appError.js';
import { 
  sanitizeString, 
  sanitizeObject,
  isValidEmail,
  isValidUsername,
  validatePasswordStrength,
  checkInputSecurity,
} from '../utils/security.util.js';
import { ERROR_CODES } from '../utils/response.util.js';

/**
 * Enhanced sanitization middleware using security utilities
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    // Sanitize query
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    next(new AppError('Input sanitization failed', 400, true, ERROR_CODES.INVALID_INPUT));
  }
};

/**
 * Validation error handler with consistent response format
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(
      errorMessages.join(', '), 
      400, 
      true, 
      ERROR_CODES.VALIDATION_ERROR,
      { fields: errors.array() }
    ));
  }
};

/**
 * Username validation rules
 */
const validateUsername = [
  param('username')
    .trim()
    .custom((value) => {
      if (!isValidUsername(value)) {
        throw new Error('Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores');
      }
      
      // Check for security threats
      const securityCheck = checkInputSecurity(value);
      if (!securityCheck.safe) {
        throw new Error('Invalid username format detected');
      }
      
      return true;
    })
    .escape(),
  handleValidationErrors
];

/**
 * Email validation rules
 */
const validateEmail = [
  body('email')
    .trim()
    .custom((value) => {
      if (!isValidEmail(value)) {
        throw new Error('Please provide a valid email address');
      }
      return true;
    })
    .normalizeEmail(),
  handleValidationErrors
];

/**
 * Password validation rules
 */
const validatePassword = [
  body('password')
    .custom((value) => {
      const result = validatePasswordStrength(value);
      if (!result.valid) {
        throw new Error(result.errors.join(', '));
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Registration validation
 */
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
    .escape(),
  
  body('email')
    .trim()
    .custom((value) => {
      if (!isValidEmail(value)) {
        throw new Error('Please provide a valid email address');
      }
      return true;
    })
    .normalizeEmail(),
  
  body('password')
    .custom((value) => {
      const result = validatePasswordStrength(value);
      if (!result.valid) {
        throw new Error(result.errors.join(', '));
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Login validation
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .custom((value) => {
      if (!isValidEmail(value)) {
        throw new Error('Please provide a valid email address');
      }
      return true;
    }),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
    .escape(),
  
  body('email')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !isValidEmail(value)) {
        throw new Error('Please provide a valid email address');
      }
      return true;
    }),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
    .custom((value) => {
      if (value) {
        const securityCheck = checkInputSecurity(value);
        if (!securityCheck.safe) {
          throw new Error('Bio contains invalid or suspicious content');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

/**
 * Search query validation
 */
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .custom((value) => {
      if (value) {
        const securityCheck = checkInputSecurity(value);
        if (!securityCheck.safe) {
          throw new Error('Search query contains invalid or suspicious content');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Platform name validation
 */
const validatePlatform = [
  param('platform')
    .trim()
    .isIn(['leetcode', 'codeforces', 'codechef', 'hackerrank', 'atcoder'])
    .withMessage('Invalid platform. Must be one of: leetcode, codeforces, codechef, hackerrank, atcoder')
    .escape(),
  handleValidationErrors
];

/**
 * Generic validate middleware factory
 */
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return next(new AppError(
        errorMessages.join(', '), 
        400, 
        true, 
        ERROR_CODES.VALIDATION_ERROR,
        { fields: errors.array() }
      ));
    }
    
    next();
  };
};

/**
 * Sanitize function compatible with legacy code
 */
const sanitize = sanitizeInput;

export {
  sanitizeInput,
  sanitize,
  validateUsername,
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePagination,
  validateObjectId,
  validateSearchQuery,
  validatePlatform,
  handleValidationErrors,
  validate,
};
