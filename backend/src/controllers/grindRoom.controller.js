import GrindRoom from "../models/grindRoom.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";
import { AppError } from "../utils/appError.js";
import { HTTP_STATUS } from "../constants/app.constants.js";
import crypto from "crypto";

class GrindRoomController {
    /**
     * Create a new Grind Room
     * POST /api/rooms/create
     */
    createRoom = asyncHandler(async (req, res) => {
        const { name, roomGoal, settings } = req.body;
        const owner = req.user.id;

        const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        const room = await GrindRoom.create({
            name,
            inviteCode,
            owner,
            activeMembers: [owner],
            roomGoal,
            settings,
        });

        sendSuccess(res, room, "Grind Room created successfully", HTTP_STATUS.CREATED);
    });

    /**
     * Join a room via invite code
     * POST /api/rooms/join/:code
     */
    joinRoom = asyncHandler(async (req, res) => {
        const { code } = req.params;
        const userId = req.user.id;

        const room = await GrindRoom.findOne({ inviteCode: code, isActive: true });
        if (!room) {
            throw new AppError("Active room not found with this code", HTTP_STATUS.NOT_FOUND);
        }

        if (!room.activeMembers.includes(userId)) {
            room.activeMembers.push(userId);
            await room.save();
        }

        sendSuccess(res, room, "Joined Grind Room successfully");
    });

    /**
     * Get room stats & active session info
     * GET /api/rooms/:id/stats
     */
    getRoomStats = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const room = await GrindRoom.findById(id).populate("activeMembers", "name avatar");
        if (!room) {
            throw new AppError("Room not found", HTTP_STATUS.NOT_FOUND);
        }

        // Aggregate total problems solved by all members since sessionStartTime
        const totalSolved = await ActivityLog.aggregate([
            {
                $match: {
                    userId: { $in: room.activeMembers.map(m => m._id) },
                    date: { $gte: room.sessionStartTime }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" }
                }
            }
        ]);

        // Member-wise breakdown
        const memberStats = await ActivityLog.aggregate([
            {
                $match: {
                    userId: { $in: room.activeMembers.map(m => m._id) },
                    date: { $gte: room.sessionStartTime }
                }
            },
            {
                $group: {
                    _id: "$userId",
                    count: { $sum: "$count" }
                }
            }
        ]);

        const stats = {
            roomName: room.name,
            roomGoal: room.roomGoal,
            sessionStarted: room.sessionStartTime,
            totalSolved: totalSolved[0]?.total || 0,
            activeMemberCount: room.activeMembers.length,
            memberStats: memberStats.map(stat => ({
                userId: stat._id,
                count: stat.count,
                name: room.activeMembers.find(m => m._id.equals(stat._id))?.name
            }))
        };

        sendSuccess(res, stats, "Room stats retrieved successfully");
    });

    /**
     * Leave a room
     * POST /api/rooms/:id/leave
     */
    leaveRoom = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const room = await GrindRoom.findById(id);
        if (!room) {
            throw new AppError("Room not found", HTTP_STATUS.NOT_FOUND);
        }

        room.activeMembers = room.activeMembers.filter(m => m.toString() !== userId);

        // If owner leaves, deactivate room (or assign new owner - keeping it simple for now)
        if (room.owner.toString() === userId) {
            room.isActive = false;
        }

        await room.save();
        sendSuccess(res, null, "Left the Grind Room");
    });
}

export default new GrindRoomController();
