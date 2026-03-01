import User from "../models/user.model.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, RESPONSE_MESSAGES, ERROR_CODES } from "../utils/response.util.js";

export const updateUserProfile = asyncHandler(async (req, res, next) => {
  const { name, email, bio } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404, true, ERROR_CODES.USER_NOT_FOUND));
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.bio = bio || user.bio;

  const updated = await user.save();

  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.PROFILE_UPDATE_SUCCESS,
    data: {
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        bio: updated.bio,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    },
  });
});

export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404, true, ERROR_CODES.USER_NOT_FOUND));
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.PROFILE_FETCH_SUCCESS,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404, true, ERROR_CODES.USER_NOT_FOUND));
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.USER_DELETE_SUCCESS,
    data: null,
  });
});
