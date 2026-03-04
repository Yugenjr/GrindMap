import Tournament from "../models/tournament.model.js";
import ActivityLog from "../models/activityLog.model.js";
import WebSocketManager from "../utils/websocketManager.js";
import { AppError } from "../utils/appError.js";
import { HTTP_STATUS } from "../constants/app.constants.js";
import crypto from "crypto";
import mongoose from "mongoose";

class TournamentService {
    /**
     * Create a new tournament
     */
    async createTournament(userId, data) {
        const { name, description, startTime, endTime, scoringRules } = data;

        const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        const tournament = await Tournament.create({
            name,
            description,
            creator: userId,
            inviteCode,
            startTime,
            endTime,
            participants: [{ userId, joinedAt: new Date() }],
            scoringRules,
        });

        return tournament;
    }

    /**
     * Join a tournament
     */
    async joinTournament(userId, inviteCode) {
        const tournament = await Tournament.findOne({ inviteCode });

        if (!tournament) {
            throw new AppError("Invalid invite code", HTTP_STATUS.NOT_FOUND);
        }

        if (tournament.status === "ended") {
            throw new AppError("Tournament has already ended", HTTP_STATUS.BAD_REQUEST);
        }

        const isMember = tournament.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );

        if (!isMember) {
            tournament.participants.push({ userId, joinedAt: new Date() });
            await tournament.save();
        }

        return tournament;
    }

    /**
     * Get Live Leaderboard
     * Dynamic Scoring Logic:
     * 1. Filter Logs by User + Date Range (max(tournamentStart, userJoin))
     * 2. Apply Custom Weights from scoringRules
     */
    async getLeaderboard(tournamentId) {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) throw new AppError("Tournament not found", HTTP_STATUS.NOT_FOUND);

        const participants = tournament.participants;
        const rules = tournament.scoringRules || {};

        // Build Aggregation Pipeline
        const pipeline = [
            // 1. Match activities only for these participants within strict time bounds
            {
                $match: {
                    userId: { $in: participants.map((p) => p.userId) },
                    date: { $gte: tournament.startTime, $lte: tournament.endTime },
                },
            },
            // 2. Lookup user specific join times ? 
            // Optimization: Instead of lookup, we can try to rely on logic or post-process.
            // But for pure aggregation, let's keep it simple first: score ALL relevant logs, 
            // then filter out pre-join logs if needed. 
            // Given the complexity of "per-user date filter" in pure Mongo 5.0+, 
            // we'll filter globally by tournament dates first (above), and user-specific join filtering 
            // can be done if strict "late joining" penalty is enforced.
            // *Wait*, prompt says "calculating only activity from join time".
            // let's do this: 
        ];

        // We will pull the raw activity data and process in memory for complex rule evaluation
        // because dynamic rule keys (e.g. "leetcode.hard") are hard to map in aggregation standard operators
        // without a very huge $switch statement generated dynamically.

        // Actually, let's try to generate the $switch case dynamically based on the rules object.

        // Convert rules to array for aggregation generation
        // rules example: { leetcode: { hard: 50, medium: 20 } }

        const branches = [];

        if (rules instanceof Map) {
            // handle Map serialization issues if necessary, but mongoose usually returns POJO or Map
        }

        // Helper to traverse rules object
        for (const [platform, difficultyRules] of Object.entries(JSON.parse(JSON.stringify(rules)))) {
            // difficultyRules might be { hard: 50 } or just a number
            if (typeof difficultyRules === 'number') {
                // Platform-wide score (e.g. "github": 5)
                branches.push({
                    case: { $eq: ["$platform", platform] },
                    then: difficultyRules
                });
            } else {
                // Difficulty specific
                for (const [difficulty, points] of Object.entries(difficultyRules)) {
                    branches.push({
                        case: {
                            $and: [
                                { $eq: ["$platform", platform] },
                                { $eq: ["$difficulty", difficulty] }
                            ]
                        },
                        then: points
                    });
                }
            }
        }

        // Add default fallback
        branches.push({ case: { $eq: [1, 1] }, then: 0 }); // Default 0 points if no rule matches

        pipeline.push({
            $project: {
                userId: 1,
                date: 1,
                points: {
                    $switch: {
                        branches: branches,
                        default: 0
                    }
                }
            }
        });

        pipeline.push({
            $group: {
                _id: "$userId",
                totalScore: { $sum: "$points" }
            }
        });

        pipeline.push({ $sort: { totalScore: -1 } });

        // Join User details
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user"
            }
        });

        const results = await ActivityLog.aggregate(pipeline);

        // Post-process logic for "Late Joiners" (filtering out points before they joined)
        // The aggregation above calculated score for the entire tournament window.
        // If we want strict "join time" logic, we need to filter BEFORE grouping.
        // Since aggregation with dynamic per-document filter is hard, let's iterate.
        // OPTIMIZATION: If strictness is required, map-reduce might be better, or standard find.

        // Let's refine the pipeline approach to simple aggregation and then filter?
        // Actually, "filtering activity from join time" is business logic.
        // Let's do it right:

        // We fetch raw logs for the users in range
        const rawLogs = await ActivityLog.find({
            userId: { $in: participants.map(p => p.userId) },
            date: { $gte: tournament.startTime, $lte: tournament.endTime }
        }).lean();

        const leaderboard = {}; // userId -> score

        // Initialize 0
        participants.forEach(p => { leaderboard[p.userId] = 0; });

        for (const log of rawLogs) {
            const participant = participants.find(p => p.userId.equals(log.userId));
            if (!participant) continue;

            // Strict Late Joiner Rule:
            if (new Date(log.date) < new Date(participant.joinedAt)) continue;

            let points = 0;
            const pRules = rules[log.platform];

            if (typeof pRules === 'number') {
                points = pRules;
            } else if (pRules && pRules[log.difficulty]) {
                points = pRules[log.difficulty];
            } else if (pRules && pRules['any']) {
                points = pRules['any'];
            }

            // Multiply by count
            leaderboard[log.userId] += (points * log.count);
        }

        // Format Result
        const sortedDetails = [];
        for (const p of participants) {
            // Need to fetch user details separately or populate tournament
            // Let's rely on Populate in the main query for performance
            // But we are in a loop.
        }

        // Let's stick to the simpler Aggregation Pipeline for v1 and assume "Late Joiner" 
        // simply implies they can only start contributing to the *Aggregate* from that moment.
        // But since logs have dates, we can just effectively tell users "Only future logs count".

        // Re-implementation with robust pipeline + lookup:
        return this.getRobustLeaderboard(tournamentId);

    }

    async getRobustLeaderboard(tournamentId) {
        const tournament = await Tournament.findById(tournamentId).populate("participants.userId", "name avatar handle");
        const rules = tournament.scoringRules instanceof Map
            ? Object.fromEntries(tournament.scoringRules)
            : tournament.scoringRules;

        // Get all logs in the tournament window
        const logs = await ActivityLog.find({
            userId: { $in: tournament.participants.map(p => p.userId._id) },
            date: { $gte: tournament.startTime, $lte: tournament.endTime }
        }).lean();

        const scores = new Map();

        tournament.participants.forEach(p => {
            scores.set(p.userId._id.toString(), {
                user: p.userId,
                score: 0,
                joinedAt: p.joinedAt
            });
        });

        for (const log of logs) {
            const uid = log.userId.toString();
            const entry = scores.get(uid);
            if (!entry) continue;

            // Check join time constraint
            if (new Date(log.date) < new Date(entry.joinedAt)) continue;

            // Calculate Score
            let points = 0;
            const userRules = rules[log.platform];

            if (!userRules) continue; // No points for this platform

            if (typeof userRules === 'number') {
                points = userRules;
            } else if (typeof userRules === 'object') {
                const difficultyPoints = userRules[log.difficulty] || userRules['any'] || 0;
                points = difficultyPoints;
            }

            const totalPoints = points * (log.count || 1);
            entry.score += totalPoints;
        }

        // Sort
        return Array.from(scores.values())
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({
                rank: index + 1,
                user: entry.user,
                score: entry.score
            }));
    }
}

export default new TournamentService();
