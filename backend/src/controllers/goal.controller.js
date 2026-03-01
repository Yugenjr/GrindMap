import GoalService from "../services/goal.service.js";

export const initializeGoalTemplates = async (req, res) => {
  try {
    await GoalService.initializeGoalTemplates();
    res.json({ message: "Goal templates initialized successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGoalTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    const templates = await GoalService.getGoalTemplates(category);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category } = req.query;
    const goals = await GoalService.getUserGoals(userId, { status, category });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalData = req.body;
    const userGoal = await GoalService.createCustomGoal(userId, goalData);
    res.status(201).json(userGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGoalFromTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId, customizations } = req.body;
    const userGoal = await GoalService.createGoalFromTemplate(userId, templateId, customizations);
    res.status(201).json(userGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGoalProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;
    const { newValue, note } = req.body;
    const updatedGoal = await GoalService.updateGoalProgress(userId, goalId, newValue, note);
    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;
    const updates = req.body;
    const updatedGoal = await GoalService.updateGoal(userId, goalId, updates);
    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;
    await GoalService.deleteGoal(userId, goalId);
    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getGoalStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await GoalService.getGoalStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGoalsNeedingReminders = async (req, res) => {
  try {
    const goals = await GoalService.getGoalsNeedingReminders();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markReminderSent = async (req, res) => {
  try {
    const { goalId } = req.params;
    await GoalService.markReminderSent(goalId);
    res.json({ message: "Reminder marked as sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};