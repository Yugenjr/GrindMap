import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        platform: {
            type: String,
            enum: ["leetcode", "codeforces", "codechef", "atcoder", "github", "skillrack"],
            required: true,
        },
        action: {
            type: String,
            enum: ["problem_solved", "submission", "contest", "contribution"],
            required: true,
        },
        count: {
            type: Number,
            default: 1,
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard", "unknown"],
            default: "unknown",
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
activityLogSchema.index({ userId: 1, date: -1 });
activityLogSchema.index({ userId: 1, platform: 1, date: -1 });
activityLogSchema.index({ userId: 1, action: 1, date: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
