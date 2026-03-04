import express from "express";
import GrindRoomController from "../controllers/grindRoom.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateGrindRoom } from "../middlewares/validation.middleware.js";
import { param } from "express-validator";
import { handleValidationErrors } from "../middlewares/validation.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/rooms/create
 * @desc    Create a new Grind Room
 */
router.post("/create", validateGrindRoom, GrindRoomController.createRoom);

/**
 * @route   POST /api/rooms/join/:code
 * @desc    Join a room via invite code
 */
router.post("/join/:code", [
  param('code').trim().isLength({ min: 6, max: 10 }).withMessage('Invalid invite code format').escape(),
  handleValidationErrors
], GrindRoomController.joinRoom);

/**
 * @route   GET /api/rooms/:id/stats
 * @desc    Get real-time room session stats
 */
router.get("/:id/stats", [
  param('id').isMongoId().withMessage('Invalid room ID format').escape(),
  handleValidationErrors
], GrindRoomController.getRoomStats);

/**
 * @route   POST /api/rooms/:id/leave
 * @desc    Leave a Grind Room
 */
router.post("/:id/leave", [
  param('id').isMongoId().withMessage('Invalid room ID format').escape(),
  handleValidationErrors
], GrindRoomController.leaveRoom);

export default router;
