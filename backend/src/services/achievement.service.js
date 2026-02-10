import Achievement from "../models/achievement.model.js";
import UserAchievement from "../models/userAchievement.model.js";
import ActivityLog from "../models/activityLog.model.js";
import AnalyticsService from "./analytics.service.js";
import WebSocketManager from "../utils/websocketManager.js";
import Logger from "../logger.js";
import mongoose from "mongoose";

class AchievementService {
    /**
     * Process a new activity to update achievement progress
     */
    async processActivity(userId, activity) {
        try {
            // Find all achievements that match the activity criteria
            const matchingAchievements = await Achievement.find({
                $or: [
                    { "criteria.platform": activity.platform },
                    { "criteria.platform": "any" }
                ],
                $or: [
                    { "criteria.difficulty": activity.difficulty },
                    { "criteria.difficulty": "any" }
                ],
                "criteria.action": activity.action
            });

            for (const achievement of matchingAchievements) {
                await this.updateProgress(userId, achievement, activity.count);
            }

            // Also check for streak-based achievements
            await this.checkStreakAchievements(userId);
        } catch (error) {
            Logger.error("Error processing achievements", { userId, error: error.message });
        }
    }

    /**
     * Update progress for a specific achievement
     */
    async updateProgress(userId, achievement, increment) {
        let userAch = await UserAchievement.findOne({
            userId,
            achievementId: achievement._id
        });

        if (!userAch) {
            userAch = new UserAchievement({
                userId,
                achievementId: achievement._id,
                currentValue: 0
            });
        }

        if (userAch.isUnlocked) return;

        userAch.currentValue += increment;

        if (userAch.currentValue >= achievement.criteria.targetValue) {
            userAch.isUnlocked = true;
            userAch.unlockedAt = new Date();

            // Notify user via WebSocket
            WebSocketManager.sendNotificationToUser(userId, {
                type: 'achievement_unlocked',
                achievementName: achievement.name,
                badgeImageUrl: achievement.badgeImageUrl,
                points: achievement.points,
                message: `Congratulations! You've unlocked the ${achievement.name} badge!`
            });

            Logger.info("Achievement unlocked", { userId, achievement: achievement.name });
        }

        await userAch.save();
    }

    /**
     * Check and update streak-based achievements
     */
    async checkStreakAchievements(userId) {
        const streakData = await AnalyticsService.getDailyStreak(userId);
        const currentStreak = streakData.currentStreak;

        const streakAchievements = await Achievement.find({
            "criteria.action": "streak"
        });

        for (const achievement of streakAchievements) {
            let userAch = await UserAchievement.findOne({
                userId,
                achievementId: achievement._id
            });

            if (!userAch) {
                userAch = new UserAchievement({
                    userId,
                    achievementId: achievement._id,
                    currentValue: 0
                });
            }

            if (userAch.isUnlocked) continue;

            userAch.currentValue = currentStreak;

            if (userAch.currentValue >= achievement.criteria.targetValue) {
                userAch.isUnlocked = true;
                userAch.unlockedAt = new Date();

                WebSocketManager.sendNotificationToUser(userId, {
                    type: 'achievement_unlocked',
                    achievementName: achievement.name,
                    message: `Incredible! You've reached a ${achievement.criteria.targetValue}-day coding streak!`
                });
            }

            await userAch.save();
        }
    }

    /**
     * Get all achievements for a user (unlocked and locked)
     */
    async getUserAchievements(userId) {
        const allAchievements = await Achievement.find().lean();
        const userProgress = await UserAchievement.find({ userId }).lean();

        return allAchievements.map(ach => {
            const progress = userProgress.find(p => p.achievementId.toString() === ach._id.toString());
            return {
                ...ach,
                currentValue: progress ? progress.currentValue : 0,
                isUnlocked: progress ? progress.isUnlocked : false,
                unlockedAt: progress ? progress.unlockedAt : null
            };
        });
    }

    /**
     * Calculate GrindScore for leaderboards
     * Weights: Hard=3, Medium=2, Easy=1
     */
    async calculateGrindScore(userId) {
        const result = await ActivityLog.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $project: {
                    weight: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$difficulty", "hard"] }, then: 3 },
                                { case: { $eq: ["$difficulty", "medium"] }, then: 2 },
                                { case: { $eq: ["$difficulty", "easy"] }, then: 1 }
                            ],
                            default: 1
                        }
                    },
                    count: "$count"
                }
            },
            {
                $group: {
                    _id: null,
                    totalScore: { $sum: { $multiply: ["$count", "$weight"] } }
                }
            }
        ]);

        return result[0]?.totalScore || 0;
    }
}

export default new AchievementService();
