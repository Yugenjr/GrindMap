import mongoose from "mongoose";

const duelSchema = new mongoose.Schema(
  {
    challengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    opponentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "invited", "accepted", "active", "completed", "cancelled", "expired"],
      default: "pending",
      index: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    forfeitById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    logs: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        action: {
          type: String,
          required: true,
          enum: ["start", "submit", "forfeit", "progress", "complete"],
        },
        time: {
          type: Date,
          default: Date.now,
        },
        result: {
          type: mongoose.Schema.Types.Mixed, // Store submission result or progress data
        },
        testCasesPassed: {
          type: Number,
          default: 0,
        },
        totalTestCases: {
          type: Number,
          default: 0,
        },
      },
    ],
    durationSeconds: {
      type: Number, // Duration of the duel in seconds
    },
    timeout: {
      type: Number, // Time limit for the duel in seconds
      default: 1800, // 30 minutes default
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
duelSchema.index({ status: 1 });
duelSchema.index({ challengerId: 1, status: 1 });
duelSchema.index({ opponentId: 1, status: 1 });
duelSchema.index({ createdAt: -1 });

const Duel = mongoose.model("Duel", duelSchema);
export default Duel;