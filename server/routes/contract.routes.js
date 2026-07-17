import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

import {
  createContract,
  getAllContracts,
  getContractById,
  updateContract,
  deleteContract,
} from "../controllers/contract.controller.js";

const router = express.Router();

// Create Contract
router.post("/", protect, authorize("client"), createContract);

// Get All Contracts
router.get("/", protect, getAllContracts);

// Get Contract By ID
router.get("/:id", protect, getContractById);

// Update Contract
router.put("/:id", protect, updateContract);

// Delete Contract
router.delete("/:id", protect, deleteContract);

export default router;