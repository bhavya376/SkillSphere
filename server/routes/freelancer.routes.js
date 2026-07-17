import express from "express";
import { createFreelancerProfile, getFreelancerProfile, getFreelancers } from "../controllers/freelancer.controller.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("freelancer"), createFreelancerProfile);
router.get("/me", protect, authorize("freelancer"), getFreelancerProfile);
router.get("/", protect, getFreelancers);

export default router;