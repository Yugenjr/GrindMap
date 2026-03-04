import Goal from "../models/goal.model.js";
import UserGoal from "../models/userGoal.model.js";
import User from "../models/user.model.js";

class GoalService {
  // Initialize default goal templates
  static async initializeGoalTemplates() {
    const defaultGoals = [
      // Problem-solving goals
      {
        title: "Problem Solving Beginner",
        description: "Solve 25 problems this month",
        category: "problems",
        targetValue: 25,
        targetUnit: "problems",
        difficulty: "easy",
        estimatedDuration: 30,
        isTemplate: true,
        reward: { points: 25 }
      },
      {
        title: "Problem Solving Enthusiast",
        description: "Solve 50 problems this month",
        category: "problems",
        targetValue: 50,
        targetUnit: "problems",
        difficulty: "medium",
        estimatedDuration: 30,
        isTemplate: true,
        reward: { points: 50 }
      },
      {
        title: "Problem Solving Expert",
        description: "Solve 100 problems this month",
        category: "problems",
        targetValue: 100,
        targetUnit: "problems",
        difficulty: "hard",
        estimatedDuration: 30,
        isTemplate: true,
        reward: { points: 100 }
      },

      // Rating goals
      {
        title: "Rating Climber",
        description: "Increase rating by 200 points",
        category: "rating",
        targetValue: 200,
        targetUnit: "points",
        difficulty: "medium",
        estimatedDuration: 60,
        isTemplate: true,
        reward: { points: 75 }
      },
      {
        title: "Rating Master",
        description: "Reach expert rating (1800+)",
        category: "rating",
        targetValue: 1800,
        targetUnit: "rating",
        difficulty: "hard",
        estimatedDuration: 90,
        isTemplate: true,
        reward: { points: 150 }
      },

      // Streak goals
      {
        title: "Consistency Builder",
        description: "Maintain a 14-day coding streak",
        category: "streak",
        targetValue: 14,
        targetUnit: "days",
        difficulty: "medium",
        estimatedDuration: 21,
        isTemplate: true,
        reward: { points: 40 }
      },
      {
        title: "Streak Champion",
        description: "Maintain a 30-day coding streak",
        category: "streak",
        targetValue: 30,
        targetUnit: "days",
        difficulty: "hard",
        estimatedDuration: 45,
        isTemplate: true,
        reward: { points: 100 }
      },

      // Time-based goals
      {
        title: "Speed Runner",
        description: "Solve 10 problems in under 30 minutes each",
        category: "time",
        targetValue: 10,
        targetUnit: "fast_solves",
        difficulty: "hard",
        estimatedDuration: 14,
        isTemplate: true,
        reward: { points: 80 }
      }
    ];

    for (const goalData of defaultGoals) {
      await Goal.findOneAndUpdate(
        { title: goalData.title, isTemplate: true },
        goalData,
        { upsert: true, new: true }
      );
    }
  }

  // Create a custom goal for a user
  static async createCustomGoal(userId, goalData) {
    const userGoal = new UserGoal({
      user: userId,
      customTitle: goalData.title,
      customDescription: goalData.description,
      customTargetValue: goalData.targetValue,
      customTargetUnit: goalData.targetUnit,
      customCategory: goalData.category,
      targetDate: goalData.targetDate,
      priority: goalData.priority || "medium",
      reminderFrequency: goalData.reminderFrequency || "weekly"
    });

    return await userGoal.save();
  }

  // Create a goal from template for a user
  static async createGoalFromTemplate(userId, templateId, customizations = {}) {
    const template = await Goal.findById(templateId);
    if (!template) {
      throw new Error("Goal template not found");
    }

    const userGoal = new UserGoal({
      user: userId,
      goal: templateId,
      targetDate: customizations.targetDate || new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000),
      priority: customizations.priority || "medium",
      reminderFrequency: customizations.reminderFrequency || "weekly"
    });

    return await userGoal.save();
  }

  // Update goal progress
  static async updateGoalProgress(userId, goalId, newValue, note = null) {
    const userGoal = await UserGoal.findOne({ _id: goalId, user: userId });
    if (!userGoal) {
      throw new Error("Goal not found");
    }

    if (userGoal.status !== "active") {
      throw new Error("Goal is not active");
    }

    const targetValue = userGoal.customTargetValue || (await Goal.findById(userGoal.goal))?.targetValue || 0;
    userGoal.currentValue = newValue;
    userGoal.progressPercentage = Math.min((newValue / targetValue) * 100, 100);

    // Check for completion
    if (userGoal.progressPercentage >= 100) {
      userGoal.status = "completed";
      userGoal.completedDate = new Date();
    }

    // Add progress note if provided
    if (note) {
      userGoal.notes.push({
        content: note,
        createdAt: new Date()
      });
    }

    // Check for milestone achievements
    await this.checkMilestones(userGoal, targetValue);

    return await userGoal.save();
  }

  // Check and create milestones
  static async checkMilestones(userGoal, targetValue) {
    const milestonePercentages = [25, 50, 75, 90];

    for (const percentage of milestonePercentages) {
      const milestoneValue = Math.floor((percentage / 100) * targetValue);
      const existingMilestone = userGoal.milestones.find(m => m.value === milestoneValue);

      if (!existingMilestone && userGoal.currentValue >= milestoneValue) {
        userGoal.milestones.push({
          value: milestoneValue,
          achievedAt: new Date(),
          message: `${percentage}% of goal achieved!`
        });
      }
    }
  }

  // Get user's goals with progress
  static async getUserGoals(userId, filters = {}) {
    const query = { user: userId };

    if (filters.status) query.status = filters.status;
    if (filters.category) query.customCategory = filters.category;

    const userGoals = await UserGoal.find(query)
      .populate("goal")
      .sort({ createdAt: -1 });

    const goalsWithDetails = await Promise.all(
      userGoals.map(async (userGoal) => {
        const goal = userGoal.goal || {
          title: userGoal.customTitle,
          description: userGoal.customDescription,
          category: userGoal.customCategory,
          targetValue: userGoal.customTargetValue,
          targetUnit: userGoal.customTargetUnit,
          difficulty: "custom",
          reward: { points: 50 }
        };

        // Calculate days remaining
        const daysRemaining = userGoal.targetDate
          ? Math.max(0, Math.ceil((userGoal.targetDate - new Date()) / (1000 * 60 * 60 * 24)))
          : null;

        // Check if goal is overdue
        const isOverdue = userGoal.targetDate && userGoal.status === "active" && daysRemaining < 0;

        return {
          ...userGoal.toObject(),
          goal: goal,
          daysRemaining,
          isOverdue,
          progressPercentage: userGoal.progressPercentage || 0
        };
      })
    );

    return goalsWithDetails;
  }

  // Get goal templates
  static async getGoalTemplates(category = null) {
    const query = { isTemplate: true, isActive: true };
    if (category) query.category = category;

    return await Goal.find(query).sort({ difficulty: 1, estimatedDuration: 1 });
  }

  // Update goal settings
  static async updateGoal(userId, goalId, updates) {
    const userGoal = await UserGoal.findOne({ _id: goalId, user: userId });
    if (!userGoal) {
      throw new Error("Goal not found");
    }

    const allowedUpdates = [
      "customTitle", "customDescription", "customTargetValue", "customTargetUnit",
      "targetDate", "priority", "reminderFrequency", "status"
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        userGoal[field] = updates[field];
      }
    });

    return await userGoal.save();
  }

  // Delete a goal
  static async deleteGoal(userId, goalId) {
    const result = await UserGoal.findOneAndDelete({ _id: goalId, user: userId });
    if (!result) {
      throw new Error("Goal not found");
    }
    return result;
  }

  // Get goals needing reminders
  static async getGoalsNeedingReminders() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const reminderQuery = {
      status: "active",
      reminderFrequency: { $ne: "none" },
      $or: [
        { reminderFrequency: "daily", $or: [{ lastReminderSent: { $lt: dayAgo } }, { lastReminderSent: { $exists: false } }] },
        { reminderFrequency: "weekly", $or: [{ lastReminderSent: { $lt: weekAgo } }, { lastReminderSent: { $exists: false } }] }
      ]
    };

    return await UserGoal.find(reminderQuery)
      .populate("user", "name email")
      .populate("goal", "title");
  }

  // Mark reminder as sent
  static async markReminderSent(goalId) {
    return await UserGoal.findByIdAndUpdate(goalId, {
      lastReminderSent: new Date()
    });
  }

  // Get goal statistics for a user
  static async getGoalStats(userId) {
    const goals = await UserGoal.find({ user: userId });

    const stats = {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === "active").length,
      completedGoals: goals.filter(g => g.status === "completed").length,
      completionRate: goals.length > 0 ? (goals.filter(g => g.status === "completed").length / goals.length) * 100 : 0,
      averageProgress: goals.length > 0 ? goals.reduce((sum, g) => sum + (g.progressPercentage || 0), 0) / goals.length : 0,
      overdueGoals: goals.filter(g => g.targetDate && g.status === "active" && g.targetDate < new Date()).length
    };

    return stats;
  }
}

export default GoalService;