import IntegrityService from "../services/integrity.service.js";
import User from "../models/user.model.js";
import ActivityLog from "../models/activityLog.model.js";
import Logger from "../utils/logger.js";

/**
 * Automated Integrity Detection Job
 * Runs periodically to analyze user activity for suspicious patterns
 */
class IntegrityJob {
    /**
     * Run integrity checks on active users
     */
    static async runIntegrityCheck(options = {}) {
        const {
            timeWindow = 60, // minutes
            maxUsers = 100,
            minActivityCount = 5, // Only check users with minimum activity
        } = options;

        Logger.info("Starting integrity check job", {
            timeWindow,
            maxUsers,
            minActivityCount,
        });

        try {
            const startTime = new Date(Date.now() - timeWindow * 60 * 1000);

            // Find users with recent activity
            const recentActivities = await ActivityLog.aggregate([
                {
                    $match: {
                        date: { $gte: startTime },
                        action: "problem_solved",
                    },
                },
                {
                    $group: {
                        _id: "$userId",
                        activityCount: { $sum: 1 },
                        lastActivity: { $max: "$date" },
                    },
                },
                {
                    $match: {
                        activityCount: { $gte: minActivityCount },
                    },
                },
                {
                    $sort: { activityCount: -1 },
                },
                {
                    $limit: maxUsers,
                },
            ]);

            Logger.info(`Found ${recentActivities.length} users with recent activity`);

            const results = {
                totalUsers: recentActivities.length,
                suspicious: 0,
                clean: 0,
                errors: 0,
                reportsCreated: 0,
            };

            // Analyze each user
            for (const activity of recentActivities) {
                try {
                    const userId = activity._id;
                    const analysis = await IntegrityService.analyzeUser(userId, timeWindow);

                    if (analysis.suspicious) {
                        results.suspicious++;

                        // Create reports for each flag
                        for (const flag of analysis.flags) {
                            await IntegrityService.createReport(userId, flag, "automated");
                            results.reportsCreated++;
                        }

                        Logger.warn("Suspicious activity detected", {
                            userId,
                            flagsCount: analysis.flags.length,
                            activityCount: activity.activityCount,
                        });
                    } else {
                        results.clean++;
                    }
                } catch (error) {
                    results.errors++;
                    Logger.error("Error analyzing user", {
                        userId: activity._id,
                        error: error.message,
                    });
                }
            }

            Logger.info("Integrity check job completed", results);

            return {
                success: true,
                ...results,
            };
        } catch (error) {
            Logger.error("Integrity check job failed", {
                error: error.message,
                stack: error.stack,
            });

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Run tournament-specific integrity checks
     */
    static async runTournamentIntegrityCheck(tournamentId) {
        Logger.info("Starting tournament integrity check", { tournamentId });

        try {
            // Import Tournament model
            const Tournament = (await import("../models/tournament.model.js")).default;

            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) {
                throw new Error("Tournament not found");
            }

            const participantIds = tournament.participants.map((p) => p.userId);

            // Analyze tournament timeframe
            const timeWindow = Math.ceil(
                (new Date() - tournament.startTime) / 1000 / 60
            );

            const results = await IntegrityService.batchAnalyze(
                participantIds,
                timeWindow
            );

            const suspicious = results.filter((r) => r.suspicious);

            Logger.info("Tournament integrity check completed", {
                tournamentId,
                totalParticipants: participantIds.length,
                suspiciousCount: suspicious.length,
            });

            return {
                success: true,
                tournamentId,
                totalParticipants: participantIds.length,
                suspicious: suspicious.length,
                details: suspicious,
            };
        } catch (error) {
            Logger.error("Tournament integrity check failed", {
                tournamentId,
                error: error.message,
            });

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Clean up expired reports and bans
     */
    static async cleanupExpiredReports() {
        Logger.info("Starting expired reports cleanup");

        try {
            const CheatReport = (await import("../models/cheatReport.model.js")).default;

            const now = new Date();

            // Find expired reports
            const expiredReports = await CheatReport.find({
                expiresAt: { $lte: now },
                status: { $in: ["shadow_banned", "banned"] },
            });

            Logger.info(`Found ${expiredReports.length} expired reports`);

            for (const report of expiredReports) {
                // Update report status
                report.status = "dismissed";
                report.notes = (report.notes || "") + "\n[Auto-dismissed: Ban expired]";
                await report.save();

                // Remove shadow ban from user
                await User.findByIdAndUpdate(report.userId, {
                    $unset: { shadowBanned: "", shadowBannedAt: "" },
                });

                Logger.info("Expired report dismissed", {
                    reportId: report._id,
                    userId: report.userId,
                });
            }

            return {
                success: true,
                cleaned: expiredReports.length,
            };
        } catch (error) {
            Logger.error("Cleanup job failed", {
                error: error.message,
            });

            return {
                success: false,
                error: error.message,
            };
        }
    }
}

export default IntegrityJob;
