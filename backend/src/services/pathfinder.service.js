import ActivityLog from "../models/activityLog.model.js";
import RecommendationPath from "../models/recommendationPath.model.js";
import AnalyticsService from "./analytics.service.js";
import SprintService from "./sprint.service.js";
import EmailService from "./email.service.js";
import Logger from "../utils/logger.js";
import mongoose from "mongoose";

class PathfinderService {
    /**
     * Analyze user history and generate growth path
     */
    async generatePath(userId) {
        // 1. Fetch recent activity (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        const recentActivity = await ActivityLog.find({
            userId,
            date: { $gte: thirtyDaysAgo }
        }).lean();

        // 2. Calculate metrics
        const consistency = await AnalyticsService.getConsistencyScore(userId);
        const difficultyDist = this.calculateDifficultyDistribution(recentActivity);
        const platformDist = await AnalyticsService.getPlatformDistribution(userId);

        // 3. Identify gaps and generate suggestions
        const { gaps, suggestions } = this.analyzeGaps(recentActivity, consistency, difficultyDist, platformDist);

        // 4. Create Recommendation Path
        const path = await RecommendationPath.create({
            userId,
            suggestedGoals: suggestions,
            growthAnalysis: {
                consistencyScore: consistency.score,
                difficultyDistribution: difficultyDist,
                topPlatform: platformDist[0]?.platform || "None",
                weakestPlatform: platformDist[platformDist.length - 1]?.platform || "None",
                identifiedGaps: gaps
            },
            expiresAt: new Date(Date.now() + 7 * 86400000) // Valid for 7 days
        });

        return path;
    }

    calculateDifficultyDistribution(activities) {
        const dist = { easy: 0, medium: 0, hard: 0 };
        activities.forEach(a => {
            if (dist[a.difficulty] !== undefined) {
                dist[a.difficulty] += a.count;
            }
        });
        return dist;
    }

    analyzeGaps(activities, consistency, difficultyDist, platformDist) {
        const gaps = [];
        const suggestions = [];

        const totalSolved = Object.values(difficultyDist).reduce((a, b) => a + b, 0);

        // Heuristic 1: Consistency Gap
        if (consistency.score < 50) {
            gaps.push("Low Consistency");
            suggestions.push({
                platform: platformDist[0]?.platform || "leetcode",
                difficulty: "easy",
                count: 5,
                reason: "Boost your daily habit with easy wins."
            });
        }

        // Heuristic 2: Difficulty Plateau (Too many easies)
        if (totalSolved > 20 && (difficultyDist.hard / totalSolved) < 0.1) {
            gaps.push("Difficulty Plateau");
            suggestions.push({
                platform: platformDist[0]?.platform || "leetcode",
                difficulty: "medium", // Gradual step up
                count: 10,
                reason: "You're ready to level up! Try some Mediums."
            });
        }

        // Heuristic 3: Platform Diversification
        if (platformDist.length === 1 && totalSolved > 50) {
            gaps.push("Single Platform Reliance");
            suggestions.push({
                platform: platformDist[0].platform === "leetcode" ? "codeforces" : "leetcode",
                difficulty: "any",
                count: 5,
                reason: "Expand your skills on a new platform."
            });
        }

        // Default Fallback
        if (suggestions.length === 0) {
            suggestions.push({
                platform: "leetcode",
                difficulty: "medium",
                count: 7,
                reason: "Maintain your momentum!"
            });
        }

        return { gaps, suggestions };
    }

    /**
     * Convert recommendation to active sprint
     */
    async acceptPath(userId, pathId) {
        const path = await RecommendationPath.findOne({ _id: pathId, userId, status: "active" });
        if (!path) throw new Error("Recommendation not found or expired");

        const sprintData = {
            targets: path.suggestedGoals.map(g => ({
                platform: g.platform,
                difficulty: g.difficulty,
                count: g.count
            })),
            days: 7 // Default sprint duration for recommendations
        };

        const sprint = await SprintService.createSprint(userId, sprintData);

        path.status = "accepted";
        await path.save();

        return sprint;
    }
}

export default new PathfinderService();
