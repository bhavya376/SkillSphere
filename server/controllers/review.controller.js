import Review from "../models/Review.js";
import Contract from "../models/contract.js";
import Client from "../models/client.js";
import Freelancer from "../models/Freelancer.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Create Review
export const createReview = asyncHandler(async (req, res) => {
  const { contractId, rating, comment } = req.body;

  // 1. Fetch real contract
  const contract = await Contract.findById(contractId);
  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  // 2. Validate contract status is Completed
  if (contract.status !== "Completed") {
    throw new ApiError(400, "Reviews can only be submitted for completed contracts.");
  }

  // 3. Resolve reviewer profile according to role
  let reviewerProfileId;
  if (req.user.role === "client") {
    const clientProfile = await Client.findOne({ user: req.user._id });
    if (!clientProfile) {
      throw new ApiError(404, "Client profile not found");
    }
    reviewerProfileId = clientProfile._id.toString();

    // Verify participation
    if (contract.client.toString() !== reviewerProfileId) {
      throw new ApiError(403, "Access denied: You are not the client on this contract.");
    }
  } else if (req.user.role === "freelancer") {
    const freelancerProfile = await Freelancer.findOne({ user: req.user._id });
    if (!freelancerProfile) {
      throw new ApiError(404, "Freelancer profile not found");
    }
    reviewerProfileId = freelancerProfile._id.toString();

    // Verify participation
    if (contract.freelancer.toString() !== reviewerProfileId) {
      throw new ApiError(403, "Access denied: You are not the freelancer on this contract.");
    }
  } else {
    throw new ApiError(403, "Access denied: Invalid role for review creation.");
  }

  // 4. Prevent self-review (redundant due to role constraints but safe)
  if (req.user.role === "client" && contract.client.toString() === contract.freelancer.toString()) {
    throw new ApiError(400, "You cannot review yourself.");
  }

  // 5. Prevent duplicate review checking
  const existingReview = await Review.findOne({ contract: contract._id, reviewer: req.user._id });
  if (existingReview) {
    throw new ApiError(409, "You have already submitted a review for this contract.");
  }

  // 6. Backend Comment validation
  if (typeof comment !== "string") {
    throw new ApiError(400, "Comment must be a valid string.");
  }
  const trimmedComment = comment.trim();
  if (trimmedComment.length < 10) {
    throw new ApiError(400, "Review comments must be at least 10 characters long.");
  }
  if (trimmedComment.length > 500) {
    throw new ApiError(400, "Review comments cannot exceed 500 characters.");
  }

  // 7. Save to MongoDB
  const review = await Review.create({
    contract: contract._id,
    client: contract.client,
    freelancer: contract.freelancer,
    reviewer: req.user._id,
    reviewerRole: req.user.role,
    rating,
    comment: trimmedComment,
  });

  try {
    const { createNotification } = await import("../services/notification.service.js");
    let recipientUser;
    if (req.user.role === "client") {
      const freelancerInfo = await Freelancer.findById(contract.freelancer);
      if (freelancerInfo) recipientUser = freelancerInfo.user;
    } else {
      const clientInfo = await Client.findById(contract.client);
      if (clientInfo) recipientUser = clientInfo.user;
    }

    if (recipientUser) {
      await createNotification({
        recipient: recipientUser,
        type: "system",
        title: "New Review Received",
        message: `You received a new ${rating}-star review: "${trimmedComment.substring(0, 40)}${trimmedComment.length > 40 ? '...' : ''}"`
      });
    }
  } catch (notifErr) {
    console.error("Review notification failed:", notifErr.message);
  }

  return res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    review,
  });
});

// Get All Reviews
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("client")
    .populate("freelancer")
    .populate("contract")
    .populate("reviewer", "name email avatar");

  return res.status(200).json({
    success: true,
    reviews,
  });
});

// Get Review By ID
export const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate("reviewer", "name email avatar");

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  return res.status(200).json({
    success: true,
    review,
  });
});

// Update Review
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Verify ownership
  if (review.reviewer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied: You are not authorized to update this review.");
  }

  // Comment validation
  if (req.body.comment) {
    if (typeof req.body.comment !== "string") {
      throw new ApiError(400, "Comment must be a valid string.");
    }
    const trimmed = req.body.comment.trim();
    if (trimmed.length < 10) {
      throw new ApiError(400, "Review comments must be at least 10 characters long.");
    }
    if (trimmed.length > 500) {
      throw new ApiError(400, "Review comments cannot exceed 500 characters.");
    }
    req.body.comment = trimmed;
  }

  Object.assign(review, req.body);
  await review.save();

  return res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review,
  });
});

// Delete Review
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Verify ownership
  if (review.reviewer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied: You are not authorized to delete this review.");
  }

  await review.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

// Get Reviews received by Freelancer
export const getFreelancerReviews = asyncHandler(async (req, res) => {
  const { freelancerId } = req.params;

  // Find reviews written by client for this freelancer
  const reviews = await Review.find({ freelancer: freelancerId, reviewerRole: "client" })
    .populate({
      path: "client",
      populate: { path: "user", select: "name email avatar" }
    })
    .populate("contract")
    .sort({ createdAt: -1 });

  const count = reviews.length;
  const avg = count > 0 ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 0;

  return res.status(200).json({
    success: true,
    reviews,
    averageRating: avg,
    reviewCount: count
  });
});

// Get Reviews received by Client
export const getClientReviews = asyncHandler(async (req, res) => {
  const { clientId } = req.params;

  // Find reviews written by freelancer for this client
  const reviews = await Review.find({ client: clientId, reviewerRole: "freelancer" })
    .populate({
      path: "freelancer",
      populate: { path: "user", select: "name email avatar" }
    })
    .populate("contract")
    .sort({ createdAt: -1 });

  const count = reviews.length;
  const avg = count > 0 ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 0;

  return res.status(200).json({
    success: true,
    reviews,
    averageRating: avg,
    reviewCount: count
  });
});