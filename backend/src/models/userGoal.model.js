import mongoose from "mongoose";

const userGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true
    },
    // Custom goal data (if user creates their own goal)
    customTitle: { type: String },
    customDescription: { type: String },
    customTargetValue: { type: Number },
    customTargetUnit: { type: String },
    customCategory: { type: String },

    // Progress tracking
    currentValue: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "completed", "paused", "abandoned"],
      default: "active"
    },

    // Time tracking
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date },
    completedDate: { type: Date },

    // Reminder settings
    reminderFrequency: {
      type: String,
      enum: ["daily", "weekly", "none"],
      default: "weekly"
    },
    lastReminderSent: { type: Date },

    // Progress milestones
    milestones: [{
      value: { type: Number, required: true },
      achievedAt: { type: Date },
      message: { type: String }
    }],

    // Notes and updates
    notes: [{
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],

    // Priority and visibility
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    isPublic: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Compound index for efficient queries
userGoalSchema.index({ user: 1, status: 1 });
userGoalSchema.index({ user: 1, targetDate: 1 });

const UserGoal = mongoose.model("UserGoal", userGoalSchema);
export default UserGoal;