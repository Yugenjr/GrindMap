import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { validateEmail, validatePassword } from '../middlewares/validation.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.middleware.js';
import { body } from 'express-validator';
import passport from 'passport';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2-50 characters long')
      .escape(),
    validateEmail,
    validatePassword
  ],
  AuthController.registerUser
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with distributed rate limiting
 * @access  Public
 */
router.post(
  '/login',
  loginLimiter, // Distributed rate limiting
  [validateEmail, body('password').notEmpty().withMessage('Password is required')],
  AuthController.loginUser
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and destroy session
 * @access  Private
 */
router.post('/logout', protect, AuthController.logoutUser);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', protect, AuthController.getUserProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2-50 characters long'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters')
  ],
  AuthController.updateProfile
);

export default router;