import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import { createDispute, getDisputes, resolveDispute } from "../controllers/dispute.controller.js";

const router = express.Router();

router.post("/", protect, createDispute);
router.get("/", protect, getDisputes);
router.post("/:id/resolve", protect, authorize("admin"), resolveDispute);

export default router;
