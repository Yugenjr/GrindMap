import mongoose from "mongoose";

const cheatReportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reason: {
            type: String,
            enum: [
                "velocity_anomaly",
                "impossible_platform_switching",
                "suspicious_difficulty_pattern",
                "time_manipulation",
                "automated_submission",
                "manual_report",
                "other"
            ],
            required: true,
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            required: true,
            default: "low",
        },
        confidence: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
            default: 50,
        },
        status: {
            type: String,
            enum: ["investigating", "dismissed", "warned", "shadow_banned", "banned", "appealed"],
            default: "investigating",
            index: true,
        },
        evidence: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            default: {},
        },
        detectionMethod: {
            type: String,
            enum: ["automated", "manual", "user_report"],
            default: "automated",
        },
        notes: {
            type: String,
            maxlength: [1000, "Notes cannot exceed 1000 characters"],
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: {
            type: Date,
        },
        appealMessage: {
            type: String,
            maxlength: [2000, "Appeal message cannot exceed 2000 characters"],
        },
        appealedAt: {
            type: Date,
        },
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
cheatReportSchema.index({ userId: 1, status: 1 });
cheatReportSchema.index({ severity: 1, status: 1 });
cheatReportSchema.index({ createdAt: -1 });
cheatReportSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if report is active
cheatReportSchema.virtual("isActive").get(function () {
    return ["investigating", "shadow_banned", "banned"].includes(this.status);
});

// Method to check if ban has expired
cheatReportSchema.methods.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

const CheatReport = mongoose.model("CheatReport", cheatReportSchema);
export default CheatReport;
