import express from "express";
import { createClientProfile, getClientProfile } from "../controllers/client.controller.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/me", protect, authorize("client"), getClientProfile);
router.post("/", protect, authorize("client"), createClientProfile);

export default router;