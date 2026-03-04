import express from 'express';
import CacheController from '../controllers/cache.controller.js';

const router = express.Router();

/**
 * @route   GET /api/cache/stats
 * @desc    Get cache statistics
 * @access  Public
 */
router.get('/stats', CacheController.getStats);

/**
 * @route   POST /api/cache/reset-stats
 * @desc    Reset cache statistics
 * @access  Public
 */
router.post('/reset-stats', CacheController.resetStats);

/**
 * @route   DELETE /api/cache/platform/:platform/:username
 * @desc    Invalidate platform cache
 * @access  Public
 */
router.delete('/platform/:platform/:username', CacheController.invalidatePlatform);

/**
 * @route   DELETE /api/cache/user/:username
 * @desc    Invalidate user cache
 * @access  Public
 */
router.delete('/user/:username', CacheController.invalidateUser);

/**
 * @route   DELETE /api/cache/all
 * @desc    Clear all cache
 * @access  Public
 */
router.delete('/all', CacheController.clearAll);

/**
 * @route   GET /api/cache/health
 * @desc    Get cache health status
 * @access  Public
 */
router.get('/health', CacheController.getHealth);

export default router;