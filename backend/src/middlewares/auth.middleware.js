import jwt from "jsonwebtoken";
import { AppError, ERROR_CODES } from "../utils/appError.js";
import { asyncMiddleware } from "../utils/asyncWrapper.js";
import config from "../config/env.js";
import User from "../models/user.model.js";

export const protect = asyncMiddleware(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Fetch user with role
      const user = await User.findById(decoded.id).select("role");
      if (!user) {
        throw new AppError("User not found", 401, ERROR_CODES.INVALID_TOKEN);
      }
      
      req.user = { id: decoded.id, role: user.role };

      next();
    } catch (error) {
      throw new AppError("Not authorized, token failed", 401, ERROR_CODES.INVALID_TOKEN);
    }
  } else {
    throw new AppError("Not authorized, no token", 401, ERROR_CODES.INVALID_TOKEN);
  }
});

/**
 * Restrict access to specific roles
 * Usage: restrictTo('admin', 'moderator')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new AppError(
        "You are not authorized to access this resource",
        403,
        ERROR_CODES.FORBIDDEN
      );
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Required role: ${roles.join(" or ")}`,
        403,
        ERROR_CODES.FORBIDDEN
      );
    }

    next();
  };
};
