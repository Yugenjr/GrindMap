import User from "../models/user.model.js";
import ProgressHistory from "../models/progressHistory.model.js";
import { AppError, ERROR_CODES } from "../utils/appError.js";
import { sendSuccess } from "../utils/response.helper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/app.constants.js";
import mongoose from "mongoose";

/**
 * Update user profile including platform usernames
 * @route PUT /api/user/profile
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, bio, platformUsernames, profileVisibility } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name,
      bio,
      profileVisibility,
      platformUsernames: {
        leetcode: platformUsernames?.leetcode || "",
        codeforces: platformUsernames?.codeforces || "",
        codechef: platformUsernames?.codechef || "",
        hackerearth: platformUsernames?.hackerearth || "",
      },
    },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  sendSuccess(res, user, "Profile updated successfully");
});

/**
 * Get user profile including platform usernames
 * @route GET /api/user/profile
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  sendSuccess(res, user, "Profile retrieved successfully");
});

/**
 * Get user's progress history
 * @route GET /api/user/progress-history
 */
export const getProgressHistory = asyncHandler(async (req, res) => {
  const { platform, limit = 30 } = req.query;

  const query = { userId: req.user.id };
  if (platform) {
    query.platform = platform;
  }

  const history = await ProgressHistory.find(query)
    .sort({ date: -1 })
    .limit(parseInt(limit));

  sendSuccess(res, history, "Progress history retrieved successfully");
});

/**
 * Save daily progress for user
 * @route POST /api/user/progress
 */
export const saveDailyProgress = asyncHandler(async (req, res) => {
  const { platform, username, data, submittedToday } = req.body;

  const progressEntry = await ProgressHistory.create({
    userId: req.user.id,
    date: new Date(),
    platform,
    username,
    data,
    submittedToday: submittedToday || false,
  });

  sendSuccess(res, progressEntry, "Progress saved successfully");
});

/**
 * Add a friend
 * @route POST /api/user/friends/:friendId
 */
export const addFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    throw new AppError("Invalid friend ID", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT);
  }

  if (req.user.id === friendId) {
    throw new AppError("Cannot add yourself as a friend", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT);
  }

  const friend = await User.findById(friendId);
  if (!friend) {
    throw new AppError("Friend not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  const user = await User.findById(req.user.id);
  if (user.friends.includes(friendId)) {
    throw new AppError("Already friends", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT);
  }

  user.friends.push(friendId);
  await user.save();

  sendSuccess(res, { friend: { id: friend._id, name: friend.name, avatar: friend.avatar } }, "Friend added successfully");
});

/**
 * Remove a friend
 * @route DELETE /api/user/friends/:friendId
 */
export const removeFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    throw new AppError("Invalid friend ID", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT);
  }

  const user = await User.findById(req.user.id);
  user.friends = user.friends.filter(id => id.toString() !== friendId);
  await user.save();

  sendSuccess(res, null, "Friend removed successfully");
});

/**
 * Get user's friends list
 * @route GET /api/user/friends
 */
export const getFriends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('friends', 'name avatar email profileVisibility');

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  // Filter out private profiles if not friends (but since these are friends, they should be visible)
  const friends = user.friends.filter(friend => friend.profileVisibility === 'public');

  sendSuccess(res, friends, "Friends retrieved successfully");
});
