import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String, // e.g., "Monday", "Tuesday", etc.
    required: true,
    enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  },
  startTime: {
    type: String, // e.g., "09:00", "14:30" in HH:MM format
    required: true
  },
  endTime: {
    type: String, // e.g., "10:00", "15:30" in HH:MM format
    required: true
  },
  timezone: {
    type: String, // e.g., "IST", "GMT", "EST", etc.
    default: "UTC"
  }
});

const mentorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    expertise: [{
      type: String,
      required: true,
      trim: true
    }],
    hourlyRate: {
      type: Number, // Points per hour charged
      required: true,
      min: 0
    },
    bio: {
      type: String,
      maxlength: 1000
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    availability: [timeSlotSchema], // Array of available time slots
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true
    },
    applicationReason: {
      type: String,
      maxlength: 500
    },
    approvalDate: {
      type: Date
    },
    rejectionReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
mentorProfileSchema.index({ status: 1 });
mentorProfileSchema.index({ expertise: 1 });
mentorProfileSchema.index({ rating: -1 });
mentorProfileSchema.index({ hourlyRate: 1 });
mentorProfileSchema.index({ isAvailable: 1 });

const MentorProfile = mongoose.model("MentorProfile", mentorProfileSchema);
export default MentorProfile;