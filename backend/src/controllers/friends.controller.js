import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";

/**
 * Send a friend request
 * POST /api/friends/request
 */
export const sendFriendRequest = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;

  if (senderId === receiverId) {
    return res.status(400).json({ success: false, message: "Cannot send request to yourself" });
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Check if already friends
  const sender = await User.findById(senderId);
  if (sender.friends.includes(receiverId)) {
    return res.status(400).json({ success: false, message: "Already friends" });
  }

  // Check if request already exists
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId }
    ]
  });

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      return res.status(400).json({ success: false, message: "Friend request already pending" });
    }
    if (existingRequest.status === "rejected") {
      // Allow re-sending after rejection
      existingRequest.status = "pending";
      existingRequest.sender = senderId;
      existingRequest.receiver = receiverId;
      await existingRequest.save();
      return res.json({ success: true, message: "Friend request sent" });
    }
  }

  await FriendRequest.create({ sender: senderId, receiver: receiverId });
  res.status(201).json({ success: true, message: "Friend request sent" });
};

/**
 * Accept a friend request
 * POST /api/friends/accept/:requestId
 */
export const acceptFriendRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.id;

  const request = await FriendRequest.findById(requestId);
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  if (request.receiver.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  if (request.status !== "pending") {
    return res.status(400).json({ success: false, message: "Request already processed" });
  }

  // Update request status
  request.status = "accepted";
  await request.save();

  // Add each other as friends (bidirectional)
  await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
  await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

  res.json({ success: true, message: "Friend request accepted" });
};

/**
 * Reject a friend request
 * POST /api/friends/reject/:requestId
 */
export const rejectFriendRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.id;

  const request = await FriendRequest.findById(requestId);
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  if (request.receiver.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  request.status = "rejected";
  await request.save();

  res.json({ success: true, message: "Friend request rejected" });
};

/**
 * Get pending friend requests (incoming)
 * GET /api/friends/requests/pending
 */
export const getPendingRequests = async (req, res) => {
  const userId = req.user.id;

  const requests = await FriendRequest.find({
    receiver: userId,
    status: "pending"
  }).populate("sender", "name email avatar");

  res.json({ success: true, data: requests });
};

/**
 * Get sent friend requests
 * GET /api/friends/requests/sent
 */
export const getSentRequests = async (req, res) => {
  const userId = req.user.id;

  const requests = await FriendRequest.find({
    sender: userId,
    status: "pending"
  }).populate("receiver", "name email avatar");

  res.json({ success: true, data: requests });
};

/**
 * Get all friends
 * GET /api/friends
 */
export const getFriends = async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId).populate("friends", "name email avatar");
  res.json({ success: true, data: user.friends || [] });
};

/**
 * Remove a friend
 * DELETE /api/friends/:friendId
 */
export const removeFriend = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  // Remove from both users' friends list
  await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

  // Delete the friend request record
  await FriendRequest.deleteOne({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId }
    ]
  });

  res.json({ success: true, message: "Friend removed" });
};

/**
 * Cancel a sent friend request
 * DELETE /api/friends/request/:requestId
 */
export const cancelFriendRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.id;

  const request = await FriendRequest.findById(requestId);
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  if (request.sender.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  await FriendRequest.findByIdAndDelete(requestId);
  res.json({ success: true, message: "Friend request cancelled" });
};