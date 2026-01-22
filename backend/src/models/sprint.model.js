import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        targets: [
            {
                platform: {
                    type: String,
                    required: true,
                },
                difficulty: {
                    type: String,
                    default: "any",
                },
                count: {
                    type: Number,
                    required: true,
                },
                achieved: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "completed", "failed", "cancelled"],
            default: "active",
        },
        lastNotifiedProgress: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index to find active sprints for a user
sprintSchema.index({ userId: 1, status: 1 });

const Sprint = mongoose.model("Sprint", sprintSchema);
export default Sprint;
