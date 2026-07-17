import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import { getRecommendations } from "../controllers/recommendation.controller.js";

const router = express.Router();

router.get("/", protect, authorize("freelancer"), getRecommendations);

export default router;
