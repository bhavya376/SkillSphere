import Gig from "../models/Gig.js";
import Client from "../models/client.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};

// Create Gig
export const createGig = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    skills,
    budget,
    duration,
  } = req.body;

  const client = await Client.findOne({
    user: req.user._id,
  });

  if (!client) {
    throw new ApiError(404, "Client profile not found");
  }

  const job = await Gig.create({
    client: client._id,
    title,
    description,
    category,
    skills,
    budget,
    duration,
  });

  return res.status(201).json({
    success: true,
    message: "Job posted successfully",
    job,
  });
});

// Get All Gigs with Filters
export const getAllGigs = asyncHandler(async (req, res) => {
  const { category, search, minBudget, maxBudget, status } = req.query;

  const query = {};

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    const escapedSearch = escapeRegex(search);
    query.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
      { skills: { $in: [new RegExp(escapedSearch, "i")] } }
    ];
  }

  if (minBudget || maxBudget) {
    query.budget = {};
    if (minBudget) query.budget.$gte = Number(minBudget);
    if (maxBudget) query.budget.$lte = Number(maxBudget);
  }

  const gigs = await Gig.find(query)
    .populate({
      path: "client",
      populate: { path: "user", select: "name email avatar" }
    })
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    gigs,
  });
});

// Get Gig By ID
export const getGigById = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id)
    .populate({
      path: "client",
      populate: { path: "user", select: "name email avatar" }
    });

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  return res.status(200).json({
    success: true,
    gig,
  });
});

// Update Gig
export const updateGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  const client = await Client.findOne({ user: req.user._id });
  if (!client || gig.client.toString() !== client._id.toString()) {
    throw new ApiError(403, "Access denied. You do not own this gig.");
  }

  Object.assign(gig, req.body);

  await gig.save();

  return res.status(200).json({
    success: true,
    message: "Gig updated successfully",
    gig,
  });
});

// Delete Gig
export const deleteGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  const client = await Client.findOne({ user: req.user._id });
  if (!client || gig.client.toString() !== client._id.toString()) {
    throw new ApiError(403, "Access denied. You do not own this gig.");
  }

  await gig.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Gig deleted successfully",
  });
});