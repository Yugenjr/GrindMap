import express from "express";
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getPendingRequests,
    getSentRequests,
    getFriends,
    removeFriend,
    cancelFriendRequest
} from "../controllers/friends.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateFriendRequest } from "../middlewares/validation.middleware.js";
import { param } from "express-validator";
import { handleValidationErrors } from "../middlewares/validation.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/friends/request
 * @desc    Send a friend request
 * @access  Private
 */
router.post("/request", validateFriendRequest, sendFriendRequest);

/**
 * @route   POST /api/friends/accept/:requestId
 * @desc    Accept a friend request
 * @access  Private
 */
router.post("/accept/:requestId", [
  param('requestId').isMongoId().withMessage('Invalid request ID format').escape(),
  handleValidationErrors
], acceptFriendRequest);

/**
 * @route   POST /api/friends/reject/:requestId
 * @desc    Reject a friend request
 * @access  Private
 */
router.post("/reject/:requestId", [
  param('requestId').isMongoId().withMessage('Invalid request ID format').escape(),
  handleValidationErrors
], rejectFriendRequest);

/**
 * @route   GET /api/friends/requests/pending
 * @desc    Get pending incoming friend requests
 * @access  Private
 */
router.get("/requests/pending", getPendingRequests);

/**
 * @route   GET /api/friends/requests/sent
 * @desc    Get sent friend requests
 * @access  Private
 */
router.get("/requests/sent", getSentRequests);

/**
 * @route   DELETE /api/friends/request/:requestId
 * @desc    Cancel a sent friend request
 * @access  Private
 */
router.delete("/request/:requestId", [
  param('requestId').isMongoId().withMessage('Invalid request ID format').escape(),
  handleValidationErrors
], cancelFriendRequest);

/**
 * @route   GET /api/friends
 * @desc    Get all friends
 * @access  Private
 */
router.get("/", getFriends);

/**
 * @route   DELETE /api/friends/:friendId
 * @desc    Remove a friend
 * @access  Private
 */
router.delete("/:friendId", [
  param('friendId').isMongoId().withMessage('Invalid friend ID format').escape(),
  handleValidationErrors
], removeFriend);

export default router;