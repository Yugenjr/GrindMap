import TournamentService from "../services/tournament.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

class TournamentController {
    /**
     * Create Tournament
     * POST /api/tournaments
     */
    create = asyncHandler(async (req, res) => {
        const { name, description, startTime, endTime, scoringRules } = req.body;
        const userId = req.user.id;

        const tournament = await TournamentService.createTournament(userId, {
            name,
            description,
            startTime,
            endTime,
            scoringRules,
        });

        sendSuccess(res, tournament, "Tournament created successfully", HTTP_STATUS.CREATED);
    });

    /**
     * Join Tournament
     * POST /api/tournaments/:code/join
     */
    join = asyncHandler(async (req, res) => {
        const { code } = req.params;
        const userId = req.user.id;

        const tournament = await TournamentService.joinTournament(userId, code);
        sendSuccess(res, tournament, "Joined tournament successfully");
    });

    /**
     * Get Leaderboard
     * GET /api/tournaments/:id/leaderboard
     */
    getLeaderboard = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const leaderboard = await TournamentService.getLeaderboard(id);
        sendSuccess(res, leaderboard, "Tournament leaderboard retrieved");
    });
}

export default new TournamentController();
