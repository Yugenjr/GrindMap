import Duel from "../models/duel.model.js";
import User from "../models/user.model.js";
import WebSocketManager from "../utils/websocketManager.js";
import { AppError } from "../utils/appError.js";
import { HTTP_STATUS } from "../constants/app.constants.js";
import mongoose from "mongoose";

class DuelService {
    /**
     * Create a new duel challenge
     */
    async createDuel(challengerId, opponentId, problemId) {
        // Validate users exist
        const [challenger, opponent] = await Promise.all([
            User.findById(challengerId),
            User.findById(opponentId)
        ]);

        if (!challenger) {
            throw new AppError("Challenger not found", HTTP_STATUS.NOT_FOUND);
        }

        if (!opponent) {
            throw new AppError("Opponent not found", HTTP_STATUS.NOT_FOUND);
        }

        // Check if there's already an active duel between these users
        const existingDuel = await Duel.findOne({
            $or: [
                { challengerId, opponentId, status: { $in: ["pending", "invited", "accepted", "active"] } },
                { challengerId: opponentId, opponentId: challengerId, status: { $in: ["pending", "invited", "accepted", "active"] } }
            ]
        });

        if (existingDuel) {
            throw new AppError("There is already an active duel between these users", HTTP_STATUS.CONFLICT);
        }

        const duel = await Duel.create({
            challengerId,
            opponentId,
            problemId,
            status: "invited"
        });

        // Send invitation to opponent via WebSocket
        WebSocketManager.sendToUser(opponentId, {
            type: 'duel:invite',
            duelId: duel._id,
            challenger: {
                id: challenger._id,
                name: challenger.name,
                avatar: challenger.avatar
            },
            problemId: duel.problemId,
            timestamp: new Date().toISOString()
        });

        return duel;
    }

    /**
     * Accept a duel invitation
     */
    async acceptDuel(duelId, userId) {
        const duel = await Duel.findById(duelId);
        
        if (!duel) {
            throw new AppError("Duel not found", HTTP_STATUS.NOT_FOUND);
        }

        if (duel.opponentId.toString() !== userId.toString()) {
            throw new AppError("Only the invited user can accept the duel", HTTP_STATUS.FORBIDDEN);
        }

        if (duel.status !== "invited") {
            throw new AppError("Duel is no longer available", HTTP_STATUS.BAD_REQUEST);
        }

        // Add accept log
        duel.logs.push({
            userId,
            action: "start",
            time: new Date(),
            result: "accepted_duel"
        });

        duel.status = "accepted";
        await duel.save();

        return duel;
    }

    /**
     * Start a duel with fair synchronization
     */
    async startDuel(duelId, userId) {
        const session = await mongoose.startSession();
        
        try {
            return await session.withTransaction(async () => {
                const duel = await Duel.findById(duelId).session(session);
                
                if (!duel) {
                    throw new AppError("Duel not found", HTTP_STATUS.NOT_FOUND);
                }

                // Check if both users are ready to start
                const isChallenger = duel.challengerId.toString() === userId.toString();
                const isOpponent = duel.opponentId.toString() === userId.toString();

                if (!isChallenger && !isOpponent) {
                    throw new AppError("User is not part of this duel", HTTP_STATUS.FORBIDDEN);
                }

                if (duel.status !== "accepted") {
                    throw new AppError("Duel cannot be started", HTTP_STATUS.BAD_REQUEST);
                }

                // Set start time and update status
                duel.startTime = new Date();
                duel.status = "active";

                // Add start log
                duel.logs.push({
                    userId,
                    action: "start",
                    time: duel.startTime,
                    result: "started_duel"
                });

                const updatedDuel = await duel.save({ session });

                // Notify both users that the duel has started
                const duelData = {
                    type: 'duel:start',
                    duelId: updatedDuel._id,
                    problemId: updatedDuel.problemId,
                    startTime: updatedDuel.startTime,
                    timeout: updatedDuel.timeout,
                    timestamp: new Date().toISOString()
                };

                WebSocketManager.sendToUser(duel.challengerId, duelData);
                WebSocketManager.sendToUser(duel.opponentId, duelData);

                return updatedDuel;
            });
        } finally {
            await session.endSession();
        }
    }

    /**
     * Submit a solution in the duel
     */
    async submitSolution(duelId, userId, submissionData) {
        const session = await mongoose.startSession();
        
        try {
            return await session.withTransaction(async () => {
                const duel = await Duel.findById(duelId).session(session);
                
                if (!duel) {
                    throw new AppError("Duel not found", HTTP_STATUS.NOT_FOUND);
                }

                const isChallenger = duel.challengerId.toString() === userId.toString();
                const isOpponent = duel.opponentId.toString() === userId.toString();

                if (!isChallenger && !isOpponent) {
                    throw new AppError("User is not part of this duel", HTTP_STATUS.FORBIDDEN);
                }

                if (duel.status !== "active") {
                    throw new AppError("Duel is not active", HTTP_STATUS.BAD_REQUEST);
                }

                // Add submission log
                const submissionTime = new Date();
                const testCaseData = {
                    userId,
                    action: "submit",
                    time: submissionTime,
                    result: submissionData.result || "submitted",
                    testCasesPassed: submissionData.testCasesPassed || 0,
                    totalTestCases: submissionData.totalTestCases || 0
                };

                duel.logs.push(testCaseData);
                
                // Check if this submission solves the problem
                const isCorrect = submissionData.testCasesPassed === submissionData.totalTestCases;
                
                if (isCorrect) {
                    // First person to solve wins
                    if (!duel.winnerId) {
                        duel.winnerId = userId;
                        duel.endTime = submissionTime;
                        duel.status = "completed";
                        
                        // Add win log
                        duel.logs.push({
                            userId,
                            action: "complete",
                            time: submissionTime,
                            result: "winner"
                        });
                    }
                }

                const updatedDuel = await duel.save({ session });

                // Send progress update to both users
                const progressUpdate = {
                    type: 'duel:progress',
                    duelId: updatedDuel._id,
                    userId: userId,
                    testCasesPassed: testCaseData.testCasesPassed,
                    totalTestCases: testCaseData.totalTestCases,
                    isCorrect: isCorrect,
                    timestamp: submissionTime.toISOString()
                };

                WebSocketManager.sendToUser(duel.challengerId, progressUpdate);
                WebSocketManager.sendToUser(duel.opponentId, progressUpdate);

                // If there's a winner, announce it
                if (duel.winnerId) {
                    const winnerData = {
                        type: 'duel:complete',
                        duelId: updatedDuel._id,
                        winnerId: duel.winnerId,
                        endTime: duel.endTime,
                        logs: duel.logs,
                        timestamp: submissionTime.toISOString()
                    };

                    WebSocketManager.sendToUser(duel.challengerId, winnerData);
                    WebSocketManager.sendToUser(duel.opponentId, winnerData);
                }

                return updatedDuel;
            });
        } finally {
            await session.endSession();
        }
    }

    /**
     * Forfeit a duel
     */
    async forfeitDuel(duelId, userId) {
        const session = await mongoose.startSession();
        
        try {
            return await session.withTransaction(async () => {
                const duel = await Duel.findById(duelId).session(session);
                
                if (!duel) {
                    throw new AppError("Duel not found", HTTP_STATUS.NOT_FOUND);
                }

                const isChallenger = duel.challengerId.toString() === userId.toString();
                const isOpponent = duel.opponentId.toString() === userId.toString();

                if (!isChallenger && !isOpponent) {
                    throw new AppError("User is not part of this duel", HTTP_STATUS.FORBIDDEN);
                }

                if (duel.status !== "active" && duel.status !== "accepted") {
                    throw new AppError("Cannot forfeit duel in current state", HTTP_STATUS.BAD_REQUEST);
                }

                // Mark as forfeited
                duel.forfeitById = userId;
                duel.status = "completed";
                duel.endTime = new Date();

                // Add forfeit log
                duel.logs.push({
                    userId,
                    action: "forfeit",
                    time: duel.endTime,
                    result: "forfeited_duel"
                });

                // If no winner yet, opponent wins by default
                if (!duel.winnerId) {
                    duel.winnerId = isChallenger ? duel.opponentId : duel.challengerId;
                    
                    duel.logs.push({
                        userId: duel.winnerId,
                        action: "complete",
                        time: duel.endTime,
                        result: "winner_by_forfeit"
                    });
                }

                const updatedDuel = await duel.save({ session });

                // Notify both users about the forfeit
                const forfeitData = {
                    type: 'duel:forfeit',
                    duelId: updatedDuel._id,
                    forfeitById: userId,
                    winnerId: duel.winnerId,
                    endTime: duel.endTime,
                    timestamp: duel.endTime.toISOString()
                };

                WebSocketManager.sendToUser(duel.challengerId, forfeitData);
                WebSocketManager.sendToUser(duel.opponentId, forfeitData);

                return updatedDuel;
            });
        } finally {
            await session.endSession();
        }
    }

    /**
     * Get active duels for a user
     */
    async getUserDuels(userId) {
        const duels = await Duel.find({
            $or: [
                { challengerId: userId },
                { opponentId: userId }
            ]
        })
        .populate('challengerId', 'name avatar')
        .populate('opponentId', 'name avatar')
        .populate('winnerId', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(50);

        return duels;
    }

    /**
     * Get duel by ID
     */
    async getDuel(duelId) {
        const duel = await Duel.findById(duelId)
            .populate('challengerId', 'name avatar')
            .populate('opponentId', 'name avatar')
            .populate('winnerId', 'name avatar');

        if (!duel) {
            throw new AppError("Duel not found", HTTP_STATUS.NOT_FOUND);
        }

        return duel;
    }

    /**
     * Handle duel timeout
     */
    async handleDuelTimeout(duelId) {
        const session = await mongoose.startSession();
        
        try {
            return await session.withTransaction(async () => {
                const duel = await Duel.findById(duelId).session(session);
                
                if (!duel || duel.status !== "active") {
                    return null; // Duel already completed or doesn't exist
                }

                // Mark as completed due to timeout
                duel.status = "completed";
                duel.endTime = new Date();

                // Add timeout log
                duel.logs.push({
                    userId: null,
                    action: "timeout",
                    time: duel.endTime,
                    result: "duel_timeout"
                });

                // If no winner, declare it a draw or pick based on who had more progress
                if (!duel.winnerId) {
                    // Find user with most test cases passed
                    const userProgress = {};
                    duel.logs.forEach(log => {
                        if (log.action === "submit") {
                            if (!userProgress[log.userId]) {
                                userProgress[log.userId] = 0;
                            }
                            if (log.testCasesPassed > userProgress[log.userId]) {
                                userProgress[log.userId] = log.testCasesPassed;
                            }
                        }
                    });

                    const users = Object.keys(userProgress);
                    if (users.length > 0) {
                        // Sort by test cases passed and pick the highest
                        const sortedUsers = users.sort((a, b) => 
                            userProgress[b] - userProgress[a]
                        );
                        
                        if (userProgress[sortedUsers[0]] > 0) {
                            duel.winnerId = sortedUsers[0];
                        }
                    }
                }

                const updatedDuel = await duel.save({ session });

                // Notify both users about the timeout
                const timeoutData = {
                    type: 'duel:timeout',
                    duelId: updatedDuel._id,
                    winnerId: duel.winnerId,
                    endTime: duel.endTime,
                    logs: duel.logs,
                    timestamp: duel.endTime.toISOString()
                };

                WebSocketManager.sendToUser(duel.challengerId, timeoutData);
                WebSocketManager.sendToUser(duel.opponentId, timeoutData);

                return updatedDuel;
            });
        } finally {
            await session.endSession();
        }
    }

    /**
     * Find waiting duels for matchmaking
     */
    async findWaitingDuels() {
        const duels = await Duel.find({
            status: "invited",
            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
        })
        .populate('challengerId', 'name avatar')
        .populate('opponentId', 'name avatar');

        return duels;
    }
}

export default new DuelService();