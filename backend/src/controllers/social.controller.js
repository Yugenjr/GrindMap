import User from "../models/user.model.js";
import ProgressHistory from "../models/progressHistory.model.js";
import { AppError, ERROR_CODES } from "../utils/appError.js";
import { sendSuccess } from "../utils/response.helper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

/**
 * Get leaderboard based on total problems solved
 * @route GET /api/social/leaderboard
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { sortBy = 'solved', platform, limit = 50 } = req.query;

  let sortCriteria = {};
  let groupBy = '$userId';

  if (sortBy === 'solved') {
    sortCriteria = { totalSolved: -1 };
  } else if (sortBy === 'rating') {
    sortCriteria = { maxRating: -1 };
  } else if (sortBy === 'streaks') {
    // For streaks, we need to calculate current streak
    // This is a simplified version - in production, you'd calculate actual streaks
    sortCriteria = { totalSolved: -1 };
  }

  let matchStage = {};
  if (platform) {
    matchStage.platform = platform;
  }

  const leaderboard = await ProgressHistory.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        totalSolved: { $max: '$data.solved' },
        maxRating: { $max: '$data.rating' },
        platforms: { $addToSet: '$platform' },
        lastUpdated: { $max: '$date' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $match: { 'user.profileVisibility': 'public' } },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        avatar: '$user.avatar',
        totalSolved: 1,
        maxRating: 1,
        platforms: 1,
        lastUpdated: 1
      }
    },
    { $sort: sortCriteria },
    { $limit: parseInt(limit) }
  ]);

  sendSuccess(res, leaderboard, "Leaderboard retrieved successfully");
});

/**
 * Get user's ranking compared to friends
 * @route GET /api/social/friends-comparison
 */
export const getFriendsComparison = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('friends', 'name avatar');

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  const friendIds = user.friends.map(friend => friend._id);

  // Get current user's stats
  const userStats = await ProgressHistory.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: '$userId',
        totalSolved: { $max: '$data.solved' },
        maxRating: { $max: '$data.rating' },
        platforms: { $addToSet: '$platform' }
      }
    }
  ]);

  // Get friends' stats
  const friendsStats = await ProgressHistory.aggregate([
    { $match: { userId: { $in: friendIds } } },
    {
      $group: {
        _id: '$userId',
        totalSolved: { $max: '$data.solved' },
        maxRating: { $max: '$data.rating' },
        platforms: { $addToSet: '$platform' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        avatar: '$user.avatar',
        totalSolved: 1,
        maxRating: 1,
        platforms: 1
      }
    }
  ]);

  const comparison = {
    user: userStats[0] || { totalSolved: 0, maxRating: 0, platforms: [] },
    friends: friendsStats
  };

  sendSuccess(res, comparison, "Friends comparison retrieved successfully");
});
