import mongoose from "mongoose";

const mentorshipSessionSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentorProfile",
      required: true,
      index: true
    },
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
      min: 15,
      max: 360 // Max 6 hours
    },
    timezone: {
      type: String, // Timezone for the session
      default: "UTC"
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "rescheduled", "no-show"],
      default: "scheduled",
      index: true
    },
    meetingLink: {
      type: String,
      trim: true
    },
    meetingPassword: {
      type: String // Password for the meeting if needed
    },
    sessionNotes: {
      type: String,
      maxlength: 2000
    },
    rating: {
      type: Number, // Rating given by mentee (1-5)
      min: 1,
      max: 5
    },
    review: {
      type: String, // Review text from mentee
      maxlength: 1000
    },
    cancellationReason: {
      type: String
    },
    amountPaid: {
      type: Number, // Amount paid in points
      required: true
    },
    currency: {
      type: String, // Currency used (points)
      default: "points"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending"
    },
    recordingUrl: {
      type: String // URL to session recording if available
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
mentorshipSessionSchema.index({ mentorId: 1, scheduledAt: 1 });
mentorshipSessionSchema.index({ menteeId: 1, scheduledAt: 1 });
mentorshipSessionSchema.index({ status: 1 });
mentorshipSessionSchema.index({ scheduledAt: 1 });
mentorshipSessionSchema.index({ createdAt: -1 });

const MentorshipSession = mongoose.model("MentorshipSession", mentorshipSessionSchema);
export default MentorshipSession;