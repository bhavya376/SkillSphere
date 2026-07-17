import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

import {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getFreelancerReviews,
  getClientReviews,
} from "../controllers/review.controller.js";

const router = express.Router();

// Create Review (Supports two-way: client and freelancer)
router.post("/", protect, authorize("client", "freelancer"), createReview);

// Get received reviews for dynamic profile lookups
router.get("/freelancer/:freelancerId", getFreelancerReviews);
router.get("/client/:clientId", getClientReviews);

// Get All Reviews
router.get("/", getAllReviews);

// Get Review By ID
router.get("/:id", getReviewById);

// Update Review
router.put("/:id", protect, updateReview);

// Delete Review
router.delete("/:id", protect, deleteReview);

export default router;