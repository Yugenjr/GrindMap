import LeaderboardService from "../services/leaderboard.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";

class LeaderboardController {
  /**
   * Get global leaderboard
   * GET /api/leaderboard/global
   */
  getGlobalLeaderboard = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await LeaderboardService.getGlobalLeaderboard(page, limit);
    const userPercentile = await LeaderboardService.getUserPercentile(req.user.id);

    sendSuccess(res, { leaderboard, userPercentile }, "Global leaderboard retrieved");
  });

  /**
   * Get friend-only leaderboard
   * GET /api/leaderboard/friends
   */
  getFriendsLeaderboard = asyncHandler(async (req, res) => {
    const leaderboard = await LeaderboardService.getFriendsLeaderboard(req.user.id);
    sendSuccess(res, leaderboard, "Friends leaderboard retrieved");
  });
}

export default new LeaderboardController();
