import { body, param, query, validationResult } from 'express-validator';
import xss from 'xss';
import { escapeString } from '../utils/dbSanitizer.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS, VALIDATION, ERROR_CODES } from '../constants/app.constants.js';

// Async middleware wrapper
const asyncMiddleware = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize params
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = escapeString(xss(req.params[key].trim()));
      }
    });

    // Sanitize query
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = escapeString(xss(req.query[key].trim()));
      }
    });

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = escapeString(xss(req.body[key].trim()));
        }
      });

      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
          if (typeof req.body[key] === 'string') {
            req.body[key] = xss(req.body[key].trim());
          }
        });
      }
    }

    next();
  } catch (error) {
    throw new AppError('Input sanitization failed', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
};

/**
 * Validation error handler middleware
 * Converts express-validator errors to standardized format
 */
const handleValidationErrors = asyncMiddleware(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      throw new AppError(
        errorMessages.join(', '),
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Username validation rules for platform endpoints
 * Ensures username meets platform requirements
 */
const validateUsername = [
  param('username')
    .isLength({
      min: VALIDATION.USERNAME_MIN_LENGTH,
      max: VALIDATION.USERNAME_MAX_LENGTH
    })
    .withMessage(`Username must be ${VALIDATION.USERNAME_MIN_LENGTH}-${VALIDATION.USERNAME_MAX_LENGTH} characters`)
    .matches(VALIDATION.USERNAME_PATTERN)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores')
    .escape(),
  handleValidationErrors
];

/**
 * Email validation rules for authentication
 */
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .escape(),
  handleValidationErrors
];

/**
 * Password validation rules for authentication
 */
const validatePassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

/**
 * User profile update validation
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters long')
    .escape(),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be 1-50 characters long')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores')
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .escape(),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
    .escape(),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
  handleValidationErrors
];

/**
 * Friend request validation
 */
const validateFriendRequest = [
  body('receiverId')
    .isMongoId()
    .withMessage('Invalid receiver ID format')
    .escape(),
  handleValidationErrors
];

/**
 * Goal creation/update validation
 */
const validateGoal = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Goal title must be 1-100 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .escape(),
  body('targetValue')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Target value must be between 1 and 10000'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid deadline format'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
  handleValidationErrors
];

/**
 * Badge creation validation
 */
const validateBadge = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Badge name must be 1-50 characters')
    .escape(),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Badge description must be 1-200 characters')
    .escape(),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Icon URL cannot exceed 100 characters')
    .escape(),
  body('criteria')
    .isObject()
    .withMessage('Criteria must be an object'),
  handleValidationErrors
];

/**
 * Grind room validation
 */
const validateGrindRoom = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room name must be 1-50 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
    .escape(),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Max participants must be between 2 and 50'),
  handleValidationErrors
];

/**
 * Tournament validation
 */
const validateTournament = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tournament name must be 1-100 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .escape(),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 1000 })
    .withMessage('Max participants must be between 2 and 1000'),
  body('rules')
    .optional()
    .isArray()
    .withMessage('Rules must be an array'),
  handleValidationErrors
];

/**
 * Sprint validation
 */
const validateSprint = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sprint name must be 1-50 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
    .escape(),
  body('duration')
    .isInt({ min: 1, max: 365 })
    .withMessage('Duration must be between 1 and 365 days'),
  body('targetProblems')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Target problems must be between 1 and 1000'),
  handleValidationErrors
];

/**
 * File upload validation
 */
const validateFileUpload = [
  body('fileName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('File name cannot exceed 100 characters')
    .escape(),
  body('fileType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('File type cannot exceed 50 characters')
    .escape(),
  handleValidationErrors
];

/**
 * Search/query validation
 */
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters')
    .escape(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
    .toInt(),
  handleValidationErrors
];

export {
  sanitizeInput,
  validateUsername,
  validateEmail,
  validatePassword,
  validateProfileUpdate,
  validateFriendRequest,
  validateGoal,
  validateBadge,
  validateGrindRoom,
  validateTournament,
  validateSprint,
  validateFileUpload,
  validateSearchQuery,
  handleValidationErrors
};
