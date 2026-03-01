import express from 'express';
import { getLeaderboard, getFriendsComparison } from '../controllers/social.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All social routes require authentication
router.use(authenticate);

// Leaderboard routes
router.get('/leaderboard', getLeaderboard);

// Friends comparison
router.get('/friends-comparison', getFriendsComparison);

export default router;
