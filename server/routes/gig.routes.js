import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
} from "../controllers/gig.controller.js";

const router = express.Router();

router.post("/", protect, authorize("client"), createGig);
router.get("/", getAllGigs);
router.get("/:id", getGigById);
router.put("/:id", protect, authorize("client"), updateGig);
router.delete("/:id", protect, authorize("client"), deleteGig);

export default router;