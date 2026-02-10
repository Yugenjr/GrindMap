import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ["consistency", "platform", "difficulty", "social"],
            required: true,
        },
        tier: {
            type: String,
            enum: ["bronze", "silver", "gold", "diamond"],
            required: true,
        },
        criteria: {
            platform: {
                type: String,
                enum: ["leetcode", "codeforces", "codechef", "atcoder", "github", "skillrack", "any"],
                default: "any",
            },
            difficulty: {
                type: String,
                enum: ["easy", "medium", "hard", "any"],
                default: "any",
            },
            action: {
                type: String,
                enum: ["problem_solved", "streak", "contribution", "any"],
                default: "problem_solved",
            },
            targetValue: {
                type: Number,
                required: true,
            },
        },
        badgeImageUrl: {
            type: String,
        },
        points: {
            type: Number,
            required: true,
            default: 10,
        },
    },
    {
        timestamps: true,
    }
);

const Achievement = mongoose.model("Achievement", achievementSchema);
export default Achievement;
