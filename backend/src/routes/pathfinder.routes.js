import express from "express";
import PathfinderController from "../controllers/pathfinder.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/analysis", PathfinderController.getAnalysis);
router.get("/suggestions", PathfinderController.getSuggestions);
router.post("/accept/:id", PathfinderController.acceptSuggestion);

export default router;
