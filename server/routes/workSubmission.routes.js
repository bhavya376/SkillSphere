import express from "express";
import protect from "../middleware/authMiddleware.js";
import { submitWork, getSubmissionsForContract, reviewWork } from "../controllers/workSubmission.controller.js";

const router = express.Router();

router.post("/", protect, submitWork);
router.get("/contract/:contractId", protect, getSubmissionsForContract);
router.post("/review", protect, reviewWork);

export default router;
