import Sprint from "../models/sprint.model.js";
import ActivityLog from "../models/activityLog.model.js";
import WebSocketManager from "../utils/websocketManager.js";
import Logger from "../utils/logger.js";

class SprintService {
    /**
     * Sync sprint progress with activity logs
     */
    async syncSprintProgress(userId) {
        const activeSprints = await Sprint.find({ userId, status: "active" });

        for (const sprint of activeSprints) {
            // Check if sprint has expired
            if (new Date() > sprint.endDate) {
                await this.finalizeSprint(sprint);
                continue;
            }

            let sprintUpdated = false;
            let totalTargets = sprint.targets.length;
            let totalProgress = 0;

            for (const target of sprint.targets) {
                const query = {
                    userId,
                    platform: target.platform,
                    date: { $gte: sprint.startDate, $lte: sprint.endDate },
                };

                if (target.difficulty !== "any") {
                    query.difficulty = target.difficulty;
                }

                const activities = await ActivityLog.find(query);
                const achievedCount = activities.reduce((sum, act) => sum + act.count, 0);

                if (target.achieved !== achievedCount) {
                    target.achieved = achievedCount;
                    sprintUpdated = true;
                }

                // Percentage progress for this target
                totalProgress += Math.min((achievedCount / target.count) * 100, 100);
            }

            const overallProgress = Math.round(totalProgress / totalTargets);

            // Check milestones (50%, 80%, 100%)
            await this.checkMilestones(sprint, overallProgress);

            if (overallProgress === 100) {
                sprint.status = "completed";
                sprintUpdated = true;
            }

            if (sprintUpdated) {
                await sprint.save();
            }
        }
    }

    /**
     * Finalize a sprint that has ended
     */
    async finalizeSprint(sprint) {
        let allAchieved = true;
        for (const target of sprint.targets) {
            if (target.achieved < target.count) {
                allAchieved = false;
                break;
            }
        }
        sprint.status = allAchieved ? "completed" : "failed";
        await sprint.save();

        WebSocketManager.sendNotificationToUser(sprint.userId, {
            type: 'sprint_ended',
            status: sprint.status,
            message: `Your sprint has ${sprint.status}!`
        });
    }

    /**
     * Send notification if a milestone is reached
     */
    async checkMilestones(sprint, currentProgress) {
        const milestones = [50, 80, 100];
        const reached = milestones.filter(m => currentProgress >= m && sprint.lastNotifiedProgress < m);

        if (reached.length > 0) {
            const highest = Math.max(...reached);
            sprint.lastNotifiedProgress = highest;

            WebSocketManager.sendNotificationToUser(sprint.userId, {
                type: 'sprint_milestone',
                progress: highest,
                message: `Sprint progress reached ${highest}%! Keep grinding!`
            });

            Logger.info('Sprint milestone reached', { userId: sprint.userId, progress: highest });
        }
    }

    /**
     * Create a new sprint
     */
    async createSprint(userId, data) {
        const { targets, days } = data;
        const startDate = new Date();
        const endDate = new Date(Date.now() + days * 86400000);

        const sprint = await Sprint.create({
            userId,
            targets,
            startDate,
            endDate
        });

        // Initial sync
        await this.syncSprintProgress(userId);
        return sprint;
    }
}

export default new SprintService();
