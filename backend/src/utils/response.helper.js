import { HTTP_STATUS, MESSAGES } from '../constants/app.constants.js';

/**
 * Send successful response with data
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
export const sendSuccess = (res, data = null, message = MESSAGES.SUCCESS, statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Error code for frontend handling
 */
export const sendError = (res, message = MESSAGES.INTERNAL_ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = 'SERVER_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
export const sendValidationError = (res, errors) => {
  const errorMessages = errors.map(error => error.msg).join(', ');
  return sendError(res, errorMessages, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR');
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
export const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
};

/**
 * Send rate limit exceeded response
 * @param {Object} res - Express response object
 */
export const sendRateLimitError = (res) => {
  return sendError(res, MESSAGES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
};