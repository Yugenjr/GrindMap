import express from "express";
import TournamentController from "../controllers/tournament.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateTournament } from "../middlewares/validation.middleware.js";
import { param } from "express-validator";
import { handleValidationErrors } from "../middlewares/validation.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", validateTournament, TournamentController.create);

router.post("/:code/join", [
  param('code').trim().isLength({ min: 6, max: 10 }).withMessage('Invalid tournament code format').escape(),
  handleValidationErrors
], TournamentController.join);

router.get("/:id/leaderboard", [
  param('id').isMongoId().withMessage('Invalid tournament ID format').escape(),
  handleValidationErrors
], TournamentController.getLeaderboard);

export default router;
