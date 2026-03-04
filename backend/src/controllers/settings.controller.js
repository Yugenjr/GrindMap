import User from "../models/user.model.js";
import { AppError, ERROR_CODES } from "../utils/appError.js";
import { sendSuccess } from "../utils/response.helper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

/**
 * Get user settings
 * @route GET /api/settings
 */
export const getUserSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('profileVisibility bio avatar');

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  sendSuccess(res, {
    profileVisibility: user.profileVisibility,
    bio: user.bio,
    avatar: user.avatar
  }, "Settings retrieved successfully");
});

/**
 * Update user settings
 * @route PUT /api/settings
 */
export const updateUserSettings = asyncHandler(async (req, res) => {
  const { profileVisibility, bio, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profileVisibility, bio, avatar },
    { new: true, runValidators: true }
  ).select('profileVisibility bio avatar');

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  sendSuccess(res, {
    profileVisibility: user.profileVisibility,
    bio: user.bio,
    avatar: user.avatar
  }, "Settings updated successfully");
});
