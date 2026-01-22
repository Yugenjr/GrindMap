import User from "../models/user.model.js";
import Activity from "../models/activity.model.js";
import IntegrityService from "../services/integrity.service.js";

export const getLeaderboard = async (req, res) => {
  const { type = 'global', limit = 50 } = req.query;
  const userId = req.user.id;

  let users;

  if (type === 'friends') {
    const user = await User.findById(userId).populate('friends');
    const friendIds = user.friends.map(f => f._id);
    friendIds.push(userId); // include self

    users = await User.find({ 
      _id: { $in: friendIds }, 
      isPublic: true,
      shadowBanned: { $ne: true } // Exclude shadow banned users
    })
      .select('name username totalScore')
      .sort({ totalScore: -1 })
      .limit(parseInt(limit));
  } else {
    users = await User.find({ 
      isPublic: true,
      shadowBanned: { $ne: true } // Exclude shadow banned users
    })
      .select('name username totalScore')
      .sort({ totalScore: -1 })
      .limit(parseInt(limit));
  }

  res.json(users);
};

export const getUserRank = async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user.isPublic) {
    return res.json({ rank: null, message: "User profile is private" });
  }

  // Check if user is shadow banned
  if (user.shadowBanned) {
    return res.json({ 
      rank: null, 
      totalScore: user.totalScore,
      message: "Your account is under review" 
    });
  }

  const higherScoreCount = await User.countDocuments({ 
    totalScore: { $gt: user.totalScore }, 
    isPublic: true,
    shadowBanned: { $ne: true } // Only count non-banned users
  });
  const rank = higherScoreCount + 1;

  res.json({ rank, totalScore: user.totalScore });
};