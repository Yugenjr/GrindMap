import mongoose from "mongoose";

const recommendationPathSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        suggestedGoals: [
            {
                platform: {
                    type: String,
                    required: true,
                },
                difficulty: String,
                count: Number,
                reason: String, // Reason for recommendation (e.g., "Consistency Gap", "Level Up")
            },
        ],
        growthAnalysis: {
            consistencyScore: Number,
            difficultyDistribution: {
                easy: Number,
                medium: Number,
                hard: Number,
            },
            topPlatform: String,
            weakestPlatform: String,
            identifiedGaps: [String],
        },
        status: {
            type: String,
            enum: ["active", "accepted", "ignored", "completed"],
            default: "active",
        },
        generatedAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one active recommendation per user
recommendationPathSchema.index({ userId: 1, status: 1 });

const RecommendationPath = mongoose.model("RecommendationPath", recommendationPathSchema);
export default RecommendationPath;
