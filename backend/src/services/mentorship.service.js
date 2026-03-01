import MentorProfile from "../models/mentorProfile.model.js";
import MentorshipSession from "../models/mentorshipSession.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/appError.js";
import { HTTP_STATUS } from "../constants/app.constants.js";
import TimezoneUtil from "../utils/timezone.util.js";
import EmailService from "./email.service.js";
import mongoose from "mongoose";

class MentorshipService {
    /**
     * Apply to become a mentor
     */
    async applyToBecomeMentor(userId, applicationData) {
        // Check if user already has a mentor profile
        const existingProfile = await MentorProfile.findOne({ userId });
        
        if (existingProfile) {
            throw new AppError("User already has a mentor profile", HTTP_STATUS.CONFLICT);
        }

        // Check if user meets basic requirements (for now, we'll just check if they exist)
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
        }

        const { expertise, hourlyRate, bio, applicationReason } = applicationData;

        const mentorProfile = await MentorProfile.create({
            userId,
            expertise,
            hourlyRate,
            bio,
            applicationReason,
            status: "pending" // Default to pending for admin review
        });

        return mentorProfile;
    }

    /**
     * Get all mentors with filters
     */
    async getMentors(filters = {}) {
        const { expertise, minRating, maxHourlyRate, availability, page = 1, limit = 10 } = filters;
        
        const query = { status: "approved", isAvailable: true };
        
        if (expertise) {
            query.expertise = { $in: Array.isArray(expertise) ? expertise : [expertise] };
        }
        
        if (minRating) {
            query.rating = { $gte: minRating };
        }
        
        if (maxHourlyRate) {
            query.hourlyRate = { ...query.hourlyRate, $lte: maxHourlyRate };
        }

        const skip = (page - 1) * limit;

        const mentors = await MentorProfile.find(query)
            .populate('userId', 'name avatar bio')
            .sort({ rating: -1, totalSessions: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MentorProfile.countDocuments(query);

        return {
            mentors,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalMentors: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Get mentor profile by user ID
     */
    async getMentorProfile(mentorId) {
        const mentorProfile = await MentorProfile.findOne({ userId: mentorId })
            .populate('userId', 'name avatar bio email')
            .exec();

        if (!mentorProfile) {
            throw new AppError("Mentor profile not found", HTTP_STATUS.NOT_FOUND);
        }

        return mentorProfile;
    }

    /**
     * Book a mentorship session
     */
    async bookSession(menteeId, bookingData) {
        const session = await mongoose.startSession();
        let newSession = null;

        try {
            await session.withTransaction(async () => {
                const { mentorId, date, startTime, endTime, duration, timezone, notes } = bookingData;

                // Validate mentor exists and is approved
                const mentorProfile = await MentorProfile.findById(mentorId).session(session);
                if (!mentorProfile) {
                    throw new AppError("Mentor not found", HTTP_STATUS.NOT_FOUND);
                }

                if (mentorProfile.status !== "approved") {
                    throw new AppError("Mentor is not approved", HTTP_STATUS.FORBIDDEN);
                }

                if (!mentorProfile.isAvailable) {
                    throw new AppError("Mentor is not available", HTTP_STATUS.BAD_REQUEST);
                }

                // Check if mentor has this time slot available
                const dateObj = new Date(date);
                const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                
                const availableSlot = mentorProfile.availability.find(slot => 
                    slot.dayOfWeek === dayOfWeek &&
                    slot.startTime === startTime &&
                    slot.endTime === endTime
                );

                if (!availableSlot) {
                    throw new AppError("Selected time slot is not available in mentor's schedule", HTTP_STATUS.BAD_REQUEST);
                }

                // Check if there's already a booking for this time slot
                const conflictingSession = await MentorshipSession.findOne({
                    mentorId,
                    scheduledAt: {
                        $gte: new Date(`${date}T${startTime}:00`),
                        $lt: new Date(`${date}T${endTime}:00`)
                    },
                    status: { $in: ["scheduled", "confirmed", "in-progress"] }
                }).session(session);

                if (conflictingSession) {
                    throw new AppError("This time slot is already booked", HTTP_STATUS.CONFLICT);
                }

                // Calculate amount based on duration and hourly rate
                const hourlyRate = mentorProfile.hourlyRate;
                const durationInHours = duration / 60; // Convert minutes to hours
                const amountPaid = Math.round(hourlyRate * durationInHours);

                // Create the session
                newSession = await MentorshipSession.create([{
                    mentorId: mentorProfile._id,
                    menteeId,
                    scheduledAt: new Date(`${date}T${startTime}:00`),
                    duration,
                    timezone: timezone || availableSlot.timezone || "UTC",
                    status: "scheduled",
                    sessionNotes: notes,
                    amountPaid,
                    currency: "points",
                    paymentStatus: "pending" // In a real system, this would integrate with payment
                }], { session });

                // Update mentor's total sessions
                await MentorProfile.findByIdAndUpdate(
                    mentorId,
                    { $inc: { totalSessions: 1 } },
                    { session }
                );

                // In a real system, we would process payment here
                // For now, we'll mark payment as paid
                newSession[0].paymentStatus = "paid";
                await newSession[0].save({ session });
            });

            // Send confirmation email
            if (newSession) {
                const mentor = await MentorProfile.findById(newSession[0].mentorId)
                    .populate('userId', 'name email');
                const mentee = await User.findById(menteeId, 'name email');

                // Generate a meeting link (in real system this would be with Zoom/Google Meet)
                const meetingLink = `https://grindmap-mentorship/${newSession[0]._id}`;
                await MentorshipSession.findByIdAndUpdate(newSession[0]._id, { meetingLink });

                // Send booking confirmation email
                await EmailService.sendMentorshipConfirmation(
                    mentor.userId.email,
                    mentee.email,
                    mentor.userId.name,
                    mentee.name,
                    newSession[0]
                );
            }

            return newSession ? newSession[0] : null;
        } catch (error) {
            throw error;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Get mentor's upcoming sessions
     */
    async getMentorSessions(mentorId, status = null) {
        const query = { mentorId };
        if (status) {
            query.status = status;
        }

        const sessions = await MentorshipSession.find(query)
            .populate('menteeId', 'name avatar')
            .populate('mentorId', 'userId expertise')
            .sort({ scheduledAt: 1 });

        return sessions;
    }

    /**
     * Get mentee's booked sessions
     */
    async getMenteeSessions(menteeId, status = null) {
        const query = { menteeId };
        if (status) {
            query.status = status;
        }

        const sessions = await MentorshipSession.find(query)
            .populate('mentorId.userId', 'name avatar expertise')
            .sort({ scheduledAt: -1 });

        return sessions;
    }

    /**
     * Update mentor availability
     */
    async updateMentorAvailability(mentorId, availability) {
        const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
        
        if (!mentorProfile) {
            throw new AppError("Mentor profile not found", HTTP_STATUS.NOT_FOUND);
        }

        if (mentorProfile.status !== "approved") {
            throw new AppError("Mentor is not approved", HTTP_STATUS.FORBIDDEN);
        }

        mentorProfile.availability = availability;
        await mentorProfile.save();

        return mentorProfile;
    }

    /**
     * Cancel a mentorship session
     */
    async cancelSession(sessionId, userId, reason = "") {
        const session = await MentorshipSession.findById(sessionId);
        
        if (!session) {
            throw new AppError("Session not found", HTTP_STATUS.NOT_FOUND);
        }

        // Check if the user is the mentor or mentee
        if (session.menteeId.toString() !== userId.toString() && 
            session.mentorId.toString() !== userId.toString()) {
            throw new AppError("Unauthorized to cancel this session", HTTP_STATUS.FORBIDDEN);
        }

        if (session.status === "completed" || session.status === "cancelled") {
            throw new AppError("Session is already completed or cancelled", HTTP_STATUS.BAD_REQUEST);
        }

        session.status = "cancelled";
        session.cancellationReason = reason;
        await session.save();

        return session;
    }

    /**
     * Update session status
     */
    async updateSessionStatus(sessionId, newStatus, updateData = {}) {
        const validStatuses = ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "rescheduled", "no-show"];
        
        if (!validStatuses.includes(newStatus)) {
            throw new AppError("Invalid status", HTTP_STATUS.BAD_REQUEST);
        }

        const session = await MentorshipSession.findById(sessionId);
        
        if (!session) {
            throw new AppError("Session not found", HTTP_STATUS.NOT_FOUND);
        }

        session.status = newStatus;
        
        // Update additional fields if provided
        Object.assign(session, updateData);
        
        await session.save();

        return session;
    }

    /**
     * Rate a mentorship session
     */
    async rateSession(sessionId, menteeId, rating, review = "") {
        const session = await MentorshipSession.findById(sessionId);
        
        if (!session) {
            throw new AppError("Session not found", HTTP_STATUS.NOT_FOUND);
        }

        if (session.menteeId.toString() !== menteeId.toString()) {
            throw new AppError("Unauthorized to rate this session", HTTP_STATUS.FORBIDDEN);
        }

        if (session.status !== "completed") {
            throw new AppError("Session must be completed before rating", HTTP_STATUS.BAD_REQUEST);
        }

        if (rating < 1 || rating > 5) {
            throw new AppError("Rating must be between 1 and 5", HTTP_STATUS.BAD_REQUEST);
        }

        session.rating = rating;
        session.review = review;
        await session.save();

        // Update mentor's average rating
        await this.updateMentorRating(session.mentorId);

        return session;
    }

    /**
     * Update mentor's average rating
     */
    async updateMentorRating(mentorId) {
        const completedSessions = await MentorshipSession.find({
            mentorId,
            status: "completed",
            rating: { $exists: true, $ne: null }
        });

        if (completedSessions.length === 0) {
            await MentorProfile.findByIdAndUpdate(mentorId, {
                rating: 0,
                totalRatings: 0
            });
            return;
        }

        const totalRating = completedSessions.reduce((sum, session) => sum + session.rating, 0);
        const averageRating = totalRating / completedSessions.length;

        await MentorProfile.findByIdAndUpdate(mentorId, {
            rating: averageRating,
            totalRatings: completedSessions.length
        });
    }

    /**
     * Approve a mentor application
     */
    async approveMentorApplication(mentorProfileId) {
        const mentorProfile = await MentorProfile.findById(mentorProfileId);
        
        if (!mentorProfile) {
            throw new AppError("Mentor profile not found", HTTP_STATUS.NOT_FOUND);
        }

        mentorProfile.status = "approved";
        mentorProfile.approvalDate = new Date();
        await mentorProfile.save();

        return mentorProfile;
    }

    /**
     * Reject a mentor application
     */
    async rejectMentorApplication(mentorProfileId, reason = "") {
        const mentorProfile = await MentorProfile.findById(mentorProfileId);
        
        if (!mentorProfile) {
            throw new AppError("Mentor profile not found", HTTP_STATUS.NOT_FOUND);
        }

        mentorProfile.status = "rejected";
        mentorProfile.rejectionReason = reason;
        await mentorProfile.save();

        return mentorProfile;
    }
}

export default new MentorshipService();