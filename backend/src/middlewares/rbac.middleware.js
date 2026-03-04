import { AppError, ERROR_CODES } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/app.constants.js';

/**
 * User roles for RBAC
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
};

/**
 * Permissions for different actions
 */
export const PERMISSIONS = {
  READ_USER_DATA: 'read:user_data',
  WRITE_USER_DATA: 'write:user_data',
  DELETE_USER: 'delete:user',
  MANAGE_USERS: 'manage:users',
  ACCESS_ADMIN_PANEL: 'access:admin_panel',
};

/**
 * Role-permission mapping
 */
const ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: [
    PERMISSIONS.READ_USER_DATA,
    PERMISSIONS.WRITE_USER_DATA,
  ],
  [USER_ROLES.MODERATOR]: [
    PERMISSIONS.READ_USER_DATA,
    PERMISSIONS.WRITE_USER_DATA,
    PERMISSIONS.DELETE_USER,
  ],
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.READ_USER_DATA,
    PERMISSIONS.WRITE_USER_DATA,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ACCESS_ADMIN_PANEL,
  ],
};

/**
 * Check if user has required role
 * @param {Array|string} allowedRoles - Required roles
 * @returns {Function} Middleware function
 */
export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_TOKEN
      );
    }

    const userRole = req.user.role || USER_ROLES.USER;
    
    if (!roles.includes(userRole)) {
      throw new AppError(
        'Insufficient permissions',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.INSUFFICIENT_PERMISSIONS
      );
    }

    next();
  };
};

/**
 * Check if user has required permission
 * @param {string} permission - Required permission
 * @returns {Function} Middleware function
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_TOKEN
      );
    }

    const userRole = req.user.role || USER_ROLES.USER;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (!userPermissions.includes(permission)) {
      throw new AppError(
        'Insufficient permissions',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.INSUFFICIENT_PERMISSIONS
      );
    }

    next();
  };
};

/**
 * Check if user owns the resource or has admin role
 * @param {string} resourceUserIdField - Field name containing resource owner ID
 * @returns {Function} Middleware function
 */
export const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_TOKEN
      );
    }

    const userRole = req.user.role || USER_ROLES.USER;
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    // Admin can access any resource
    if (userRole === USER_ROLES.ADMIN) {
      return next();
    }
    
    // User can only access their own resources
    if (req.user.id === resourceUserId) {
      return next();
    }

    throw new AppError(
      'Access denied',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.ACCESS_DENIED
    );
  };
};