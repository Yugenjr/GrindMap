import express from 'express';
import DuelController from '../controllers/duel.controller.js';
import { verifyJWT } from '../middlewares/jwtManager.middleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Apply JWT verification to all duel routes
router.use(verifyJWT);

// Rate limiting for duel-related actions
const duelRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each user to 20 requests per windowMs
  message: 'Too many duel requests, please try again later.'
});

/**
 * Challenge a user to a duel
 * POST /api/duels/challenge
 */
router.post('/challenge', duelRateLimiter, DuelController.challenge);

/**
 * Accept a duel invitation
 * POST /api/duels/:id/accept
 */
router.post('/:id/accept', duelRateLimiter, DuelController.accept);

/**
 * Start a duel (both players must call this to start)
 * POST /api/duels/:id/start
 */
router.post('/:id/start', duelRateLimiter, DuelController.start);

/**
 * Submit a solution in the duel
 * POST /api/duels/:id/submit
 */
router.post('/:id/submit', duelRateLimiter, DuelController.submit);

/**
 * Forfeit a duel
 * POST /api/duels/:id/forfeit
 */
router.post('/:id/forfeit', duelRateLimiter, DuelController.forfeit);

/**
 * Get user's duels
 * GET /api/duels
 */
router.get('/', duelRateLimiter, DuelController.getUserDuels);

/**
 * Get a specific duel
 * GET /api/duels/:id
 */
router.get('/:id', duelRateLimiter, DuelController.getDuel);

/**
 * Find waiting duels for matchmaking
 * GET /api/duels/waiting
 */
router.get('/waiting', duelRateLimiter, DuelController.getWaitingDuels);

export default router;