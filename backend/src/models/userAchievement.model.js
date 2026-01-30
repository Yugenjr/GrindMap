import mongoose from "mongoose";

const userAchievementSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        achievementId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Achievement",
            required: true,
        },
        currentValue: {
            type: Number,
            default: 0,
        },
        isUnlocked: {
            type: Boolean,
            default: false,
        },
        unlockedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure unique achievement tracking per user
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

const UserAchievement = mongoose.model("UserAchievement", userAchievementSchema);
export default UserAchievement;
