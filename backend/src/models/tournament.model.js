import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        inviteCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        description: String,
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["upcoming", "active", "ended"],
            default: "upcoming",
        },
        participants: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
                _id: false,
            },
        ],
        // Custom Scoring Rules: platform -> difficulty -> points
        // Example: { "leetcode": { "hard": 50, "medium": 20 }, "github": { "push": 5 } }
        scoringRules: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
tournamentSchema.index({ status: 1, startTime: 1 });
tournamentSchema.index({ "participants.userId": 1 });

const Tournament = mongoose.model("Tournament", tournamentSchema);
export default Tournament;
