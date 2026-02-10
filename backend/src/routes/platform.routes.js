import express from 'express';
import * as platformController from '../controllers/platform.controller.js';
import { validateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(validateToken);

/**
 * GET /api/platforms
 * Get all connected platforms for the user
 */
router.get('/', platformController.getPlatforms);

/**
 * POST /api/platforms/:platformId/connect
 * Connect a new platform with credentials
 */
router.post('/:platformId/connect', platformController.connectPlatform);

/**
 * POST /api/platforms/:platformId/disconnect
 * Disconnect a platform
 */
router.post('/:platformId/disconnect', platformController.disconnectPlatform);

/**
 * POST /api/platforms/:platformId/test
 * Test connection to a platform
 */
router.post('/:platformId/test', platformController.testConnection);

/**
 * POST /api/platforms/:platformId/sync
 * Manually sync data from a platform
 */
router.post('/:platformId/sync', platformController.syncPlatform);

/**
 * PUT /api/platforms/:platformId/settings
 * Update sync settings for a platform
 */
router.put('/:platformId/settings', platformController.updateSettings);

/**
 * GET /api/platforms/:platformId/status
 * Get the current status of a platform
 */
router.get('/:platformId/status', platformController.getPlatformStatus);

export default router;
