import express from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All settings routes require authentication
router.use(authenticate);

// Get user settings
router.get('/', getUserSettings);

// Update user settings
router.put('/', updateUserSettings);

export default router;
