import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return next(new AppError("User already exists", 400));

  const user = await User.create({ name, email, password });

  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("Invalid credentials", 401));

  const match = await bcrypt.compare(password, user.password);
  if (!match) return next(new AppError("Invalid credentials", 401));

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});
