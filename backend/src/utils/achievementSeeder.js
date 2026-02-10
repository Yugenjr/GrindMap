import Achievement from "../models/achievement.model.js";
import Logger from "../utils/logger.js";

const achievements = [
    // Consistency Tier
    {
        name: "Consistency Bronze",
        description: "Code for 3 days straight",
        category: "consistency",
        tier: "bronze",
        criteria: { action: "streak", targetValue: 3 },
        points: 10
    },
    {
        name: "Consistency Silver",
        description: "Code for 7 days straight",
        category: "consistency",
        tier: "silver",
        criteria: { action: "streak", targetValue: 7 },
        points: 25
    },
    {
        name: "Consistency Gold",
        description: "Code for 15 days straight",
        category: "consistency",
        tier: "gold",
        criteria: { action: "streak", targetValue: 15 },
        points: 60
    },
    {
        name: "Consistency Diamond",
        description: "Code for 30 days straight",
        category: "consistency",
        tier: "diamond",
        criteria: { action: "streak", targetValue: 30 },
        points: 150
    },

    // Platform Tier - LeetCode
    {
        name: "LeetCode Bronze",
        description: "Solve 10 problems on LeetCode",
        category: "platform",
        tier: "bronze",
        criteria: { platform: "leetcode", targetValue: 10 },
        points: 15
    },
    {
        name: "LeetCode Silver",
        description: "Solve 50 problems on LeetCode",
        category: "platform",
        tier: "silver",
        criteria: { platform: "leetcode", targetValue: 50 },
        points: 40
    },

    // Difficulty Tier
    {
        name: "Hard Hitter Bronze",
        description: "Solve 5 Hard problems",
        category: "difficulty",
        tier: "bronze",
        criteria: { difficulty: "hard", targetValue: 5 },
        points: 30
    },
    {
        name: "Hard Hitter Gold",
        description: "Solve 25 Hard problems",
        category: "difficulty",
        tier: "gold",
        criteria: { difficulty: "hard", targetValue: 25 },
        points: 100
    }
];

export const seedAchievements = async () => {
    try {
        for (const ach of achievements) {
            await Achievement.findOneAndUpdate(
                { name: ach.name },
                ach,
                { upsert: true, new: true }
            );
        }
        Logger.info("Achievements seeded successfully");
    } catch (error) {
        Logger.error("Failed to seed achievements", { error: error.message });
    }
};
