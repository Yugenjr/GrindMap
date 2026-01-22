import express from "express";
import TournamentController from "../controllers/tournament.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", TournamentController.create);
router.post("/:code/join", TournamentController.join);
router.get("/:id/leaderboard", TournamentController.getLeaderboard);

export default router;
