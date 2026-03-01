import CheatReport from "../models/cheatReport.model.js";
import ActivityLog from "../models/activityLog.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/appError.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

/**
 * Integrity Detection Service
 * Analyzes user behavior patterns to detect potential cheating
 */
class IntegrityService {
    /**
     * Configuration for detection thresholds
     */
    static THRESHOLDS = {
        // Velocity thresholds (problems per minute)
        VELOCITY: {
            easy: 1, // Max 1 easy problem per minute
            medium: 0.5, // Max 1 medium problem per 2 minutes
            hard: 0.2, // Max 1 hard problem per 5 minutes
        },
        // Minimum time between submissions (seconds)
        MIN_SUBMISSION_TIME: {
            easy: 30,
            medium: 60,
            hard: 180,
        },
        // Platform switching thresholds
        MAX_PLATFORMS_PER_MINUTE: 3,
        MIN_PLATFORM_SWITCH_TIME: 15, // seconds
        // Activity spike detection
        MAX_HOURLY_SUBMISSIONS: 30,
        MAX_DAILY_SUBMISSIONS: 200,
    };

    /**
     * Main detection function - analyzes user's recent activity
     */
    async analyzeUser(userId, timeWindowMinutes = 60) {
        const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
        
        const activities = await ActivityLog.find({
            userId,
            date: { $gte: startTime },
            action: "problem_solved",
        }).sort({ date: 1 });

        if (activities.length === 0) {
            return { suspicious: false, flags: [] };
        }

        const flags = [];

        // Run all detection checks
        const velocityCheck = await this.checkVelocityAnomaly(activities);
        const platformCheck = await this.checkPlatformSwitching(activities);
        const patternCheck = await this.checkDifficultyPattern(activities);
        const spikeCheck = await this.checkActivitySpike(userId);

        if (velocityCheck.detected) flags.push(velocityCheck);
        if (platformCheck.detected) flags.push(platformCheck);
        if (patternCheck.detected) flags.push(patternCheck);
        if (spikeCheck.detected) flags.push(spikeCheck);

        const suspicious = flags.length > 0;

        return { suspicious, flags, activitiesAnalyzed: activities.length };
    }

    /**
     * Check for velocity anomalies - solving problems too fast
     */
    async checkVelocityAnomaly(activities) {
        const difficultyGroups = {
            easy: [],
            medium: [],
            hard: [],
        };

        // Group by difficulty
        activities.forEach((activity) => {
            const difficulty = activity.difficulty?.toLowerCase() || "unknown";
            if (difficultyGroups[difficulty]) {
                difficultyGroups[difficulty].push(activity);
            }
        });

        const anomalies = [];

        for (const [difficulty, acts] of Object.entries(difficultyGroups)) {
            if (acts.length < 2) continue;

            for (let i = 1; i < acts.length; i++) {
                const timeDiff = (acts[i].date - acts[i - 1].date) / 1000; // seconds
                const minTime = IntegrityService.THRESHOLDS.MIN_SUBMISSION_TIME[difficulty];

                if (timeDiff < minTime) {
                    anomalies.push({
                        difficulty,
                        timeDiff: Math.round(timeDiff),
                        minRequired: minTime,
                        activity1: acts[i - 1]._id,
                        activity2: acts[i]._id,
                    });
                }
            }
        }

        if (anomalies.length > 0) {
            return {
                detected: true,
                type: "velocity_anomaly",
                severity: anomalies.length >= 5 ? "high" : anomalies.length >= 3 ? "medium" : "low",
                confidence: Math.min(95, 50 + anomalies.length * 10),
                details: {
                    anomaliesCount: anomalies.length,
                    anomalies: anomalies.slice(0, 10), // Limit to first 10
                },
            };
        }

        return { detected: false };
    }

    /**
     * Check for impossible platform switching
     */
    async checkPlatformSwitching(activities) {
        if (activities.length < 2) {
            return { detected: false };
        }

        const switches = [];
        let platformCount = new Set();
        let oneMinuteWindow = [];

        for (let i = 0; i < activities.length; i++) {
            const currentActivity = activities[i];
            
            // Check switches within 1 minute
            oneMinuteWindow = oneMinuteWindow.filter(
                (act) => (currentActivity.date - act.date) / 1000 <= 60
            );
            oneMinuteWindow.push(currentActivity);

            const platformsInWindow = new Set(oneMinuteWindow.map((a) => a.platform));

            if (platformsInWindow.size > IntegrityService.THRESHOLDS.MAX_PLATFORMS_PER_MINUTE) {
                switches.push({
                    timestamp: currentActivity.date,
                    platforms: Array.from(platformsInWindow),
                    count: platformsInWindow.size,
                });
            }

            // Check rapid platform switches
            if (i > 0) {
                const prevActivity = activities[i - 1];
                const timeDiff = (currentActivity.date - prevActivity.date) / 1000;

                if (
                    currentActivity.platform !== prevActivity.platform &&
                    timeDiff < IntegrityService.THRESHOLDS.MIN_PLATFORM_SWITCH_TIME
                ) {
                    switches.push({
                        from: prevActivity.platform,
                        to: currentActivity.platform,
                        timeDiff: Math.round(timeDiff),
                        timestamp: currentActivity.date,
                    });
                }
            }
        }

        if (switches.length > 0) {
            return {
                detected: true,
                type: "impossible_platform_switching",
                severity: switches.length >= 5 ? "high" : switches.length >= 3 ? "medium" : "low",
                confidence: Math.min(90, 40 + switches.length * 15),
                details: {
                    switchesCount: switches.length,
                    switches: switches.slice(0, 10),
                },
            };
        }

        return { detected: false };
    }

    /**
     * Check for suspicious difficulty patterns
     */
    async checkDifficultyPattern(activities) {
        const difficultyMap = { easy: 1, medium: 2, hard: 3 };
        const suspicious = [];

        // Check for alternating hard-easy-hard patterns (suggesting automation)
        for (let i = 2; i < activities.length; i++) {
            const difficulties = [
                difficultyMap[activities[i - 2].difficulty] || 0,
                difficultyMap[activities[i - 1].difficulty] || 0,
                difficultyMap[activities[i].difficulty] || 0,
            ];

            // Pattern: Hard -> Easy -> Hard (unusual)
            if (difficulties[0] === 3 && difficulties[1] === 1 && difficulties[2] === 3) {
                const timeSpan = (activities[i].date - activities[i - 2].date) / 1000;
                if (timeSpan < 180) {
                    // Less than 3 minutes
                    suspicious.push({
                        pattern: "hard-easy-hard",
                        timeSpan: Math.round(timeSpan),
                        activities: [
                            activities[i - 2]._id,
                            activities[i - 1]._id,
                            activities[i]._id,
                        ],
                    });
                }
            }
        }

        // Check for consistent hard problem solving at impossible speeds
        const hardProblems = activities.filter((a) => a.difficulty === "hard");
        if (hardProblems.length >= 3) {
            const avgTimeBetween =
                (hardProblems[hardProblems.length - 1].date - hardProblems[0].date) /
                1000 /
                (hardProblems.length - 1);

            if (avgTimeBetween < 120) {
                // Avg less than 2 minutes per hard problem
                suspicious.push({
                    pattern: "rapid_hard_problems",
                    hardProblemsCount: hardProblems.length,
                    avgTimeBetween: Math.round(avgTimeBetween),
                });
            }
        }

        if (suspicious.length > 0) {
            return {
                detected: true,
                type: "suspicious_difficulty_pattern",
                severity: suspicious.length >= 3 ? "high" : "medium",
                confidence: Math.min(85, 45 + suspicious.length * 12),
                details: {
                    patternsFound: suspicious.length,
                    patterns: suspicious,
                },
            };
        }

        return { detected: false };
    }

    /**
     * Check for activity spikes (unusual burst of submissions)
     */
    async checkActivitySpike(userId) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [hourlyCount, dailyCount] = await Promise.all([
            ActivityLog.countDocuments({
                userId,
                date: { $gte: oneHourAgo },
                action: "problem_solved",
            }),
            ActivityLog.countDocuments({
                userId,
                date: { $gte: oneDayAgo },
                action: "problem_solved",
            }),
        ]);

        const violations = [];

        if (hourlyCount > IntegrityService.THRESHOLDS.MAX_HOURLY_SUBMISSIONS) {
            violations.push({
                window: "1_hour",
                count: hourlyCount,
                threshold: IntegrityService.THRESHOLDS.MAX_HOURLY_SUBMISSIONS,
            });
        }

        if (dailyCount > IntegrityService.THRESHOLDS.MAX_DAILY_SUBMISSIONS) {
            violations.push({
                window: "24_hours",
                count: dailyCount,
                threshold: IntegrityService.THRESHOLDS.MAX_DAILY_SUBMISSIONS,
            });
        }

        if (violations.length > 0) {
            return {
                detected: true,
                type: "activity_spike",
                severity: violations.length === 2 ? "high" : "medium",
                confidence: 70,
                details: {
                    violations,
                    hourlyCount,
                    dailyCount,
                },
            };
        }

        return { detected: false };
    }

    /**
     * Create a cheat report
     */
    async createReport(userId, flag, detectionMethod = "automated") {
        const existingActiveReport = await CheatReport.findOne({
            userId,
            reason: flag.type,
            status: { $in: ["investigating", "shadow_banned", "banned"] },
        });

        if (existingActiveReport) {
            // Update existing report with new evidence
            existingActiveReport.evidence = {
                ...existingActiveReport.evidence,
                latestDetection: flag.details,
                detectionCount: (existingActiveReport.evidence.detectionCount || 1) + 1,
                lastDetected: new Date(),
            };
            existingActiveReport.confidence = Math.max(
                existingActiveReport.confidence,
                flag.confidence
            );
            await existingActiveReport.save();
            return existingActiveReport;
        }

        // Create new report
        const report = await CheatReport.create({
            userId,
            reason: flag.type,
            severity: flag.severity,
            confidence: flag.confidence,
            evidence: {
                detection: flag.details,
                detectedAt: new Date(),
                detectionCount: 1,
            },
            detectionMethod,
        });

        // Auto-action based on confidence and severity
        if (flag.confidence >= 80 && flag.severity === "high") {
            await this.applyShadowBan(userId, report._id);
        }

        return report;
    }

    /**
     * Apply shadow ban to a user
     */
    async applyShadowBan(userId, reportId) {
        await CheatReport.findByIdAndUpdate(reportId, {
            status: "shadow_banned",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        // Update user record
        await User.findByIdAndUpdate(userId, {
            $set: { shadowBanned: true, shadowBannedAt: new Date() },
        });
    }

    /**
     * Check if user is shadow banned
     */
    async isUserShadowBanned(userId) {
        const activeReport = await CheatReport.findOne({
            userId,
            status: "shadow_banned",
            $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
        });

        return !!activeReport;
    }

    /**
     * Check if user is banned from tournaments
     */
    async isUserBannedFromTournaments(userId) {
        const activeReport = await CheatReport.findOne({
            userId,
            status: { $in: ["shadow_banned", "banned"] },
            severity: { $in: ["high", "critical"] },
            $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
        });

        return !!activeReport;
    }

    /**
     * Get all reports (admin)
     */
    async getAllReports(filters = {}) {
        const query = {};

        if (filters.status) query.status = filters.status;
        if (filters.severity) query.severity = filters.severity;
        if (filters.userId) query.userId = filters.userId;

        const reports = await CheatReport.find(query)
            .populate("userId", "name email")
            .populate("reviewedBy", "name email")
            .sort({ createdAt: -1 })
            .limit(filters.limit || 100);

        return reports;
    }

    /**
     * Get user's own reports
     */
    async getUserReports(userId) {
        const reports = await CheatReport.find({ userId }).sort({ createdAt: -1 });
        return reports;
    }

    /**
     * Submit an appeal
     */
    async submitAppeal(userId, reportId, appealMessage) {
        const report = await CheatReport.findOne({ _id: reportId, userId });

        if (!report) {
            throw new AppError("Report not found", HTTP_STATUS.NOT_FOUND);
        }

        if (report.status === "dismissed" || report.status === "appealed") {
            throw new AppError("Cannot appeal this report", HTTP_STATUS.BAD_REQUEST);
        }

        report.appealMessage = appealMessage;
        report.appealedAt = new Date();
        report.status = "appealed";

        await report.save();
        return report;
    }

    /**
     * Review a report (admin)
     */
    async reviewReport(reportId, reviewerId, decision, notes) {
        const report = await CheatReport.findById(reportId);

        if (!report) {
            throw new AppError("Report not found", HTTP_STATUS.NOT_FOUND);
        }

        report.status = decision; // dismissed, warned, shadow_banned, banned
        report.reviewedBy = reviewerId;
        report.reviewedAt = new Date();
        report.notes = notes;

        if (decision === "shadow_banned") {
            await this.applyShadowBan(report.userId, reportId);
        } else if (decision === "banned") {
            await User.findByIdAndUpdate(report.userId, {
                $set: { isActive: false, bannedAt: new Date() },
            });
        } else if (decision === "dismissed") {
            // Remove shadow ban if exists
            await User.findByIdAndUpdate(report.userId, {
                $unset: { shadowBanned: "", shadowBannedAt: "" },
            });
        }

        await report.save();
        return report;
    }

    /**
     * Batch analyze multiple users
     */
    async batchAnalyze(userIds, timeWindowMinutes = 60) {
        const results = [];

        for (const userId of userIds) {
            try {
                const analysis = await this.analyzeUser(userId, timeWindowMinutes);
                
                if (analysis.suspicious) {
                    // Create reports for each flag
                    for (const flag of analysis.flags) {
                        await this.createReport(userId, flag);
                    }
                }

                results.push({
                    userId,
                    ...analysis,
                });
            } catch (error) {
                results.push({
                    userId,
                    error: error.message,
                });
            }
        }

        return results;
    }
}

export default new IntegrityService();
