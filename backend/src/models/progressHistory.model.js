import mongoose from "mongoose";

const progressHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ["leetcode", "codeforces", "codechef", "hackerearth"],
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      solved: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 0,
      },
      rank: {
        type: String,
        default: "",
      },
      // Additional platform-specific data
      totalQuestions: {
        type: Number,
        default: 0,
      },
      maxRating: {
        type: Number,
        default: 0,
      },
      globalRank: {
        type: Number,
        default: 0,
      },
      countryRank: {
        type: Number,
        default: 0,
      },
      stars: {
        type: Number,
        default: 0,
      },
      badges: [{
        name: String,
        earnedAt: Date,
      }],
    },
    // Track if user submitted on this day
    submittedToday: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
progressHistorySchema.index({ userId: 1, platform: 1, date: -1 });
progressHistorySchema.index({ userId: 1, date: -1 });

const ProgressHistory = mongoose.model("ProgressHistory", progressHistorySchema);
export default ProgressHistory;
