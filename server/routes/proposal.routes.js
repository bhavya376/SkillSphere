import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

import {
  createProposal,
  getAllProposals,
  getProposalById,
  updateProposal,
  deleteProposal,
  acceptProposal,
  rejectProposal,
} from "../controllers/proposal.controller.js";

const router = express.Router();

router.post("/", protect, authorize("freelancer"), createProposal);

router.get("/", getAllProposals);

router.get("/:id", getProposalById);

router.put("/:id", protect, authorize("freelancer"), updateProposal);

router.delete("/:id", protect, authorize("freelancer"), deleteProposal);

router.patch("/:id/accept", protect, authorize("client"), acceptProposal);
router.patch("/:id/reject", protect, authorize("client"), rejectProposal);

export default router;