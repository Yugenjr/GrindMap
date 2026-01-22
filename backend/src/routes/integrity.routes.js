import express from "express";
import IntegrityController from "../controllers/integrity.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes - accessible to authenticated users
router.get("/my-reports", IntegrityController.getMyReports);
router.post("/appeal", IntegrityController.submitAppeal);

// Admin/Moderator routes
router.get(
    "/reports",
    restrictTo("admin", "moderator"),
    IntegrityController.getReports
);

router.get(
    "/stats",
    restrictTo("admin", "moderator"),
    IntegrityController.getStatistics
);

router.get(
    "/check/:userId",
    restrictTo("admin", "moderator"),
    IntegrityController.checkUserStatus
);

router.post(
    "/report",
    restrictTo("admin", "moderator"),
    IntegrityController.createManualReport
);

router.post(
    "/analyze/:userId",
    restrictTo("admin", "moderator"),
    IntegrityController.analyzeUser
);

router.post(
    "/analyze/batch",
    restrictTo("admin"),
    IntegrityController.batchAnalyze
);

router.put(
    "/reports/:reportId/review",
    restrictTo("admin", "moderator"),
    IntegrityController.reviewReport
);

export default router;
