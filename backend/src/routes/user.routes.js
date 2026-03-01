import express from "express";
import { updateUserProfile, getUserProfile } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateProfileUpdate } from "../middlewares/validation.middleware.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, validateProfileUpdate, updateUserProfile);

export default router;
