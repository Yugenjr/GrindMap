import IntegrityService from "../services/integrity.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/response.helper.js";
import { HTTP_STATUS } from "../constants/app.constants.js";
import { AppError } from "../utils/appError.js";

class IntegrityController {
    /**
     * Analyze a specific user's activity
     * POST /api/integrity/analyze/:userId
     * Admin only
     */
    analyzeUser = asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const { timeWindow = 60 } = req.query;

        const analysis = await IntegrityService.analyzeUser(userId, parseInt(timeWindow));

        if (analysis.suspicious) {
            // Create reports for detected flags
            const reports = [];
            for (const flag of analysis.flags) {
                const report = await IntegrityService.createReport(userId, flag, "manual");
                reports.push(report);
            }

            sendSuccess(
                res,
                {
                    analysis,
                    reportsCreated: reports.length,
                    reports,
                },
                "Analysis complete - suspicious activity detected",
                HTTP_STATUS.OK
            );
        } else {
            sendSuccess(
                res,
                analysis,
                "Analysis complete - no suspicious activity detected",
                HTTP_STATUS.OK
            );
        }
    });

    /**
     * Batch analyze multiple users
     * POST /api/integrity/analyze/batch
     * Admin only
     */
    batchAnalyze = asyncHandler(async (req, res) => {
        const { userIds, timeWindow = 60 } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new AppError("userIds array is required", HTTP_STATUS.BAD_REQUEST);
        }

        const results = await IntegrityService.batchAnalyze(userIds, timeWindow);

        const summary = {
            total: results.length,
            suspicious: results.filter((r) => r.suspicious).length,
            clean: results.filter((r) => !r.suspicious && !r.error).length,
            errors: results.filter((r) => r.error).length,
        };

        sendSuccess(
            res,
            {
                summary,
                results,
            },
            "Batch analysis complete",
            HTTP_STATUS.OK
        );
    });

    /**
     * Get all cheat reports
     * GET /api/integrity/reports
     * Admin only
     */
    getReports = asyncHandler(async (req, res) => {
        const { status, severity, userId, limit } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (severity) filters.severity = severity;
        if (userId) filters.userId = userId;
        if (limit) filters.limit = parseInt(limit);

        const reports = await IntegrityService.getAllReports(filters);

        sendSuccess(
            res,
            {
                count: reports.length,
                reports,
            },
            "Reports retrieved successfully",
            HTTP_STATUS.OK
        );
    });

    /**
     * Get user's own reports
     * GET /api/integrity/my-reports
     * Authenticated user
     */
    getMyReports = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const reports = await IntegrityService.getUserReports(userId);

        sendSuccess(
            res,
            {
                count: reports.length,
                reports,
            },
            "Your reports retrieved successfully",
            HTTP_STATUS.OK
        );
    });

    /**
     * Submit an appeal
     * POST /api/integrity/appeal
     * Authenticated user
     */
    submitAppeal = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { reportId, message } = req.body;

        if (!reportId || !message) {
            throw new AppError("reportId and message are required", HTTP_STATUS.BAD_REQUEST);
        }

        if (message.length < 20) {
            throw new AppError(
                "Appeal message must be at least 20 characters",
                HTTP_STATUS.BAD_REQUEST
            );
        }

        const report = await IntegrityService.submitAppeal(userId, reportId, message);

        sendSuccess(res, report, "Appeal submitted successfully", HTTP_STATUS.OK);
    });

    /**
     * Review a report (admin action)
     * PUT /api/integrity/reports/:reportId/review
     * Admin only
     */
    reviewReport = asyncHandler(async (req, res) => {
        const { reportId } = req.params;
        const { decision, notes } = req.body;
        const reviewerId = req.user.id;

        const validDecisions = ["dismissed", "warned", "shadow_banned", "banned"];
        if (!validDecisions.includes(decision)) {
            throw new AppError(
                `Invalid decision. Must be one of: ${validDecisions.join(", ")}`,
                HTTP_STATUS.BAD_REQUEST
            );
        }

        const report = await IntegrityService.reviewReport(
            reportId,
            reviewerId,
            decision,
            notes
        );

        sendSuccess(res, report, "Report reviewed successfully", HTTP_STATUS.OK);
    });

    /**
     * Check if a user is shadow banned
     * GET /api/integrity/check/:userId
     * Admin only
     */
    checkUserStatus = asyncHandler(async (req, res) => {
        const { userId } = req.params;

        const [isShadowBanned, isTournamentBanned] = await Promise.all([
            IntegrityService.isUserShadowBanned(userId),
            IntegrityService.isUserBannedFromTournaments(userId),
        ]);

        sendSuccess(
            res,
            {
                userId,
                isShadowBanned,
                isTournamentBanned,
            },
            "User status retrieved",
            HTTP_STATUS.OK
        );
    });

    /**
     * Manual report submission
     * POST /api/integrity/report
     * Admin or Moderator
     */
    createManualReport = asyncHandler(async (req, res) => {
        const { userId, reason, severity, evidence, notes } = req.body;
        const reporterId = req.user.id;

        if (!userId || !reason || !severity || !evidence) {
            throw new AppError(
                "userId, reason, severity, and evidence are required",
                HTTP_STATUS.BAD_REQUEST
            );
        }

        const flag = {
            type: reason,
            severity,
            confidence: 75, // Manual reports get medium-high confidence
            details: {
                ...evidence,
                reportedBy: reporterId,
                reportedAt: new Date(),
                manualNotes: notes,
            },
        };

        const report = await IntegrityService.createReport(userId, flag, "manual");

        sendSuccess(res, report, "Manual report created successfully", HTTP_STATUS.CREATED);
    });

    /**
     * Get integrity statistics
     * GET /api/integrity/stats
     * Admin only
     */
    getStatistics = asyncHandler(async (req, res) => {
        const reports = await IntegrityService.getAllReports({});

        const stats = {
            total: reports.length,
            byStatus: {},
            bySeverity: {},
            byReason: {},
            recentTrend: {
                last24Hours: 0,
                last7Days: 0,
                last30Days: 0,
            },
        };

        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        reports.forEach((report) => {
            // By status
            stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;

            // By severity
            stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;

            // By reason
            stats.byReason[report.reason] = (stats.byReason[report.reason] || 0) + 1;

            // Recent trend
            if (report.createdAt >= oneDayAgo) {
                stats.recentTrend.last24Hours++;
            }
            if (report.createdAt >= sevenDaysAgo) {
                stats.recentTrend.last7Days++;
            }
            if (report.createdAt >= thirtyDaysAgo) {
                stats.recentTrend.last30Days++;
            }
        });

        sendSuccess(res, stats, "Integrity statistics retrieved", HTTP_STATUS.OK);
    });
}

export default new IntegrityController();
