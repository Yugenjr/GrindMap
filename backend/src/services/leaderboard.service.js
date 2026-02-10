import User from "../models/user.model.js";
import ActivityLog from "../models/activityLog.model.js";
import AchievementService from "./achievement.service.js";
import mongoose from "mongoose";

class LeaderboardService {
    /**
     * Get global leaderboard with GrindScore
     */
    async getGlobalLeaderboard(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const ranking = await ActivityLog.aggregate([
            {
                $project: {
                    userId: 1,
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
                    _id: "$userId",
                    grindScore: { $sum: { $multiply: ["$count", "$weight"] } },
                    totalSolved: { $sum: "$count" }
                }
            },
            { $sort: { grindScore: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: 1,
                    grindScore: 1,
                    totalSolved: 1,
                    name: "$userDetails.name",
                    avatar: "$userDetails.avatar"
                }
            }
        ]);

        return ranking;
    }

    /**
     * Get friend-only leaderboard
     */
    async getFriendsLeaderboard(userId) {
        const user = await User.findById(userId);
        const friendIds = [...(user.friends || []), userId];

        const ranking = await ActivityLog.aggregate([
            {
                $match: { userId: { $in: friendIds.map(id => new mongoose.Types.ObjectId(id)) } }
            },
            {
                $project: {
                    userId: 1,
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
                    _id: "$userId",
                    grindScore: { $sum: { $multiply: ["$count", "$weight"] } }
                }
            },
            { $sort: { grindScore: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: 1,
                    grindScore: 1,
                    name: "$userDetails.name",
                    avatar: "$userDetails.avatar"
                }
            }
        ]);

        return ranking;
    }

    /**
     * Calculate user percentile in global rankings
     */
    async getUserPercentile(userId) {
        const userScore = await AchievementService.calculateGrindScore(userId);

        // Total users who have logged activity
        const activeUserCount = (await ActivityLog.distinct("userId")).length;

        if (activeUserCount === 0) return 100;

        // Count users with score better than current user
        const usersBetter = await ActivityLog.aggregate([
            {
                $project: {
                    userId: 1,
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
                    _id: "$userId",
                    score: { $sum: { $multiply: ["$count", "$weight"] } }
                }
            },
            { $match: { score: { $gt: userScore } } },
            { $count: "count" }
        ]);

        const countBetter = usersBetter[0]?.count || 0;
        const percentile = ((activeUserCount - countBetter) / activeUserCount) * 100;

        return Math.round(percentile * 10) / 10;
    }
}

export default new LeaderboardService();
