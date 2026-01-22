import express from 'express';
import MentorshipController from '../controllers/mentorship.controller.js';
import { verifyJWT } from '../middlewares/jwtManager.middleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Apply JWT verification to all mentorship routes
router.use(verifyJWT);

// Rate limiting for mentorship-related actions
const mentorshipRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each user to 30 requests per windowMs
  message: 'Too many mentorship requests, please try again later.'
});

/**
 * Apply to become a mentor
 * POST /api/mentorship/apply
 */
router.post('/apply', mentorshipRateLimiter, MentorshipController.applyToBecomeMentor);

/**
 * Search for mentors with filters
 * GET /api/mentorship/search
 */
router.get('/search', mentorshipRateLimiter, MentorshipController.searchMentors);

/**
 * Get mentor profile
 * GET /api/mentorship/profile/:id
 */
router.get('/profile/:id', mentorshipRateLimiter, MentorshipController.getMentorProfile);

/**
 * Book a mentorship session
 * POST /api/mentorship/book
 */
router.post('/book', mentorshipRateLimiter, MentorshipController.bookSession);

/**
 * Get mentor's sessions
 * GET /api/mentorship/sessions/mentor
 */
router.get('/sessions/mentor', mentorshipRateLimiter, MentorshipController.getMentorSessions);

/**
 * Get mentee's sessions
 * GET /api/mentorship/sessions/mentee
 */
router.get('/sessions/mentee', mentorshipRateLimiter, MentorshipController.getMenteeSessions);

/**
 * Update mentor availability
 * PUT /api/mentorship/availability
 */
router.put('/availability', mentorshipRateLimiter, MentorshipController.updateAvailability);

/**
 * Cancel a session
 * DELETE /api/mentorship/session/:id
 */
router.delete('/session/:id', mentorshipRateLimiter, MentorshipController.cancelSession);

/**
 * Update session status
 * PUT /api/mentorship/session/:id/status
 */
router.put('/session/:id/status', mentorshipRateLimiter, MentorshipController.updateSessionStatus);

/**
 * Rate a session
 * POST /api/mentorship/session/:id/rate
 */
router.post('/session/:id/rate', mentorshipRateLimiter, MentorshipController.rateSession);

export default router;