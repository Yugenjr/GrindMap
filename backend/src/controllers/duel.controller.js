import DuelService from "../services/duel.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.helper.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

class DuelController {
    /**
     * Challenge a user to a duel
     * POST /api/duels/challenge
     */
    challenge = asyncHandler(async (req, res) => {
        const { opponentId, problemId } = req.body;
        const challengerId = req.user.id;

        const duel = await DuelService.createDuel(challengerId, opponentId, problemId);

        sendSuccess(res, duel, "Duel challenge sent successfully", HTTP_STATUS.CREATED);
    });

    /**
     * Accept a duel invitation
     * POST /api/duels/:id/accept
     */
    accept = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const duel = await DuelService.acceptDuel(id, userId);

        sendSuccess(res, duel, "Duel accepted successfully");
    });

    /**
     * Start a duel
     * POST /api/duels/:id/start
     */
    start = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const duel = await DuelService.startDuel(id, userId);

        sendSuccess(res, duel, "Duel started successfully");
    });

    /**
     * Submit a solution in the duel
     * POST /api/duels/:id/submit
     */
    submit = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const submissionData = req.body;

        const duel = await DuelService.submitSolution(id, userId, submissionData);

        sendSuccess(res, duel, "Solution submitted successfully");
    });

    /**
     * Forfeit a duel
     * POST /api/duels/:id/forfeit
     */
    forfeit = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const duel = await DuelService.forfeitDuel(id, userId);

        sendSuccess(res, duel, "Duel forfeited successfully");
    });

    /**
     * Get user's duels
     * GET /api/duels
     */
    getUserDuels = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const duels = await DuelService.getUserDuels(userId);

        sendSuccess(res, duels, "User duels retrieved successfully");
    });

    /**
     * Get a specific duel
     * GET /api/duels/:id
     */
    getDuel = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const duel = await DuelService.getDuel(id);

        sendSuccess(res, duel, "Duel retrieved successfully");
    });

    /**
     * Find waiting duels for matchmaking
     * GET /api/duels/waiting
     */
    getWaitingDuels = asyncHandler(async (req, res) => {
        const duels = await DuelService.findWaitingDuels();

        sendSuccess(res, duels, "Waiting duels retrieved successfully");
    });
}

export default new DuelController();