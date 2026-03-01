import MentorshipService from "../services/mentorship.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

class MentorshipController {
    /**
     * Apply to become a mentor
     * POST /api/mentorship/apply
     */
    applyToBecomeMentor = asyncHandler(async (req, res) => {
        const { expertise, hourlyRate, bio, applicationReason } = req.body;
        const userId = req.user.id;

        const mentorProfile = await MentorshipService.applyToBecomeMentor(userId, {
            expertise,
            hourlyRate,
            bio,
            applicationReason
        });

        sendSuccess(res, mentorProfile, "Mentor application submitted successfully", HTTP_STATUS.CREATED);
    });

    /**
     * Get all mentors with filters
     * GET /api/mentorship/search
     */
    searchMentors = asyncHandler(async (req, res) => {
        const filters = req.query;

        const result = await MentorshipService.getMentors(filters);

        sendSuccess(res, result, "Mentors retrieved successfully");
    });

    /**
     * Get mentor profile
     * GET /api/mentorship/profile/:id
     */
    getMentorProfile = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const mentorProfile = await MentorshipService.getMentorProfile(id);

        sendSuccess(res, mentorProfile, "Mentor profile retrieved successfully");
    });

    /**
     * Book a mentorship session
     * POST /api/mentorship/book
     */
    bookSession = asyncHandler(async (req, res) => {
        const bookingData = req.body;
        const menteeId = req.user.id;

        const session = await MentorshipService.bookSession(menteeId, bookingData);

        sendSuccess(res, session, "Session booked successfully", HTTP_STATUS.CREATED);
    });

    /**
     * Get mentor's sessions
     * GET /api/mentorship/sessions/mentor
     */
    getMentorSessions = asyncHandler(async (req, res) => {
        const mentorId = req.user.id;
        const { status } = req.query;

        const sessions = await MentorshipService.getMentorSessions(mentorId, status);

        sendSuccess(res, sessions, "Mentor sessions retrieved successfully");
    });

    /**
     * Get mentee's sessions
     * GET /api/mentorship/sessions/mentee
     */
    getMenteeSessions = asyncHandler(async (req, res) => {
        const menteeId = req.user.id;
        const { status } = req.query;

        const sessions = await MentorshipService.getMenteeSessions(menteeId, status);

        sendSuccess(res, sessions, "Mentee sessions retrieved successfully");
    });

    /**
     * Update mentor availability
     * PUT /api/mentorship/availability
     */
    updateAvailability = asyncHandler(async (req, res) => {
        const mentorId = req.user.id;
        const { availability } = req.body;

        const mentorProfile = await MentorshipService.updateMentorAvailability(mentorId, availability);

        sendSuccess(res, mentorProfile, "Availability updated successfully");
    });

    /**
     * Cancel a session
     * DELETE /api/mentorship/session/:id
     */
    cancelSession = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const { reason } = req.body;

        const session = await MentorshipService.cancelSession(id, userId, reason);

        sendSuccess(res, session, "Session cancelled successfully");
    });

    /**
     * Update session status
     * PUT /api/mentorship/session/:id/status
     */
    updateSessionStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, ...updateData } = req.body;

        const session = await MentorshipService.updateSessionStatus(id, status, updateData);

        sendSuccess(res, session, "Session status updated successfully");
    });

    /**
     * Rate a session
     * POST /api/mentorship/session/:id/rate
     */
    rateSession = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const menteeId = req.user.id;
        const { rating, review } = req.body;

        const session = await MentorshipService.rateSession(id, menteeId, rating, review);

        sendSuccess(res, session, "Session rated successfully");
    });
}

export default new MentorshipController();