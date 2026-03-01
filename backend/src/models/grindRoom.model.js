import mongoose from "mongoose";

const grindRoomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Room name is required"],
            trim: true,
            maxlength: [50, "Room name cannot exceed 50 characters"],
        },
        inviteCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        activeMembers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        roomGoal: {
            platform: String,
            count: Number,
            difficulty: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        sessionStartTime: {
            type: Date,
            default: Date.now,
        },
        settings: {
            isPrivate: {
                type: Boolean,
                default: false,
            },
            pomodoroEnabled: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding rooms by owner
grindRoomSchema.index({ owner: 1 });

const GrindRoom = mongoose.model("GrindRoom", grindRoomSchema);
export default GrindRoom;
