import BadgeService from "../services/badge.service.js";
import UserBadge from "../models/userBadge.model.js";
import Badge from "../models/badge.model.js";

export const initializeBadges = async (req, res) => {
  try {
    await BadgeService.initializeBadges();
    res.json({ message: "Badges initialized successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    const badgesData = await BadgeService.getUserBadgesWithProgress(userId);
    res.json(badgesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkAndAwardBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userStats } = req.body;

    const awardedBadges = await BadgeService.checkAndAwardBadges(userId, userStats);

    res.json({
      message: awardedBadges.length > 0 ? "Badges awarded!" : "No new badges earned",
      awardedBadges: awardedBadges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markBadgesAsSeen = async (req, res) => {
  try {
    const userId = req.user.id;
    const { badgeIds } = req.body;

    const success = await BadgeService.markBadgesAsSeen(userId, badgeIds);

    if (success) {
      res.json({ message: "Badges marked as seen" });
    } else {
      res.status(400).json({ message: "Failed to mark badges as seen" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ rarity: -1, points: -1 });
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBadgeStats = async (req, res) => {
  try {
    const totalBadges = await Badge.countDocuments({ isActive: true });
    const badgesByRarity = await Badge.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$rarity", count: { $sum: 1 } } }
    ]);

    const totalEarned = await UserBadge.countDocuments();

    res.json({
      totalBadges,
      badgesByRarity,
      totalEarned
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};