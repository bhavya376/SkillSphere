import Proposal from "../models/proposal.js";
import Freelancer from "../models/Freelancer.js";
import Gig from "../models/Gig.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Client from "../models/client.js";

// Create Proposal
export const createProposal = asyncHandler(async (req, res) => {
  const {
    gig,
    coverLetter,
    proposedBudget,
    deliveryTime,
  } = req.body;

  const freelancer = await Freelancer.findOne({
    user: req.user._id,
  });

  if (!freelancer) {
    throw new ApiError(404, "Freelancer profile not found");
  }

  const job = await Gig.findById(gig);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const existingProposal = await Proposal.findOne({
    gig: job._id,
    freelancer: freelancer._id,
  });

  if (existingProposal) {
    throw new ApiError(409, "You have already submitted a proposal for this gig");
  }

  const proposal = await Proposal.create({
    gig: job._id,
    client: job.client,
    freelancer: freelancer._id,
    coverLetter,
    proposedBudget,
    deliveryTime,
  });

  try {
    const { createNotification } = await import("../services/notification.service.js");
    const clientInfo = await Client.findById(job.client);
    if (clientInfo) {
      await createNotification({
        recipient: clientInfo.user,
        type: "proposal",
        title: "New Proposal Received",
        message: `New proposal received from ${req.user.name} for your gig: "${job.title}"`
      });
    }
  } catch (notifErr) {
    console.error("Proposal notification failed:", notifErr.message);
  }

  return res.status(201).json({
    success: true,
    message: "Proposal submitted successfully",
    proposal,
  });
});

// Get All Proposals
export const getAllProposals = asyncHandler(async (req, res) => {
  const proposals = await Proposal.find()
    .populate("gig")
    .populate("freelancer")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    proposals,
  });
});

// Get Proposal By ID
export const getProposalById = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id)
    .populate("gig")
    .populate("freelancer")
    .lean();

  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  return res.status(200).json({
    success: true,
    proposal,
  });
});

// Update Proposal
export const updateProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  const freelancer = await Freelancer.findOne({ user: req.user._id });
  if (!freelancer || proposal.freelancer.toString() !== freelancer._id.toString()) {
    throw new ApiError(403, "Access denied. You do not own this proposal.");
  }

  Object.assign(proposal, req.body);

  await proposal.save();

  return res.status(200).json({
    success: true,
    message: "Proposal updated successfully",
    proposal,
  });
});

// Delete Proposal
export const deleteProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  const freelancer = await Freelancer.findOne({ user: req.user._id });
  if (!freelancer || proposal.freelancer.toString() !== freelancer._id.toString()) {
    throw new ApiError(403, "Access denied. You do not own this proposal.");
  }

  if (proposal.status !== "Pending") {
    throw new ApiError(400, `You cannot withdraw a proposal that is already ${proposal.status.toLowerCase()}`);
  }

  await proposal.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Proposal deleted successfully",
  });
});
export const acceptProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }
  if (proposal.status !== "Pending") {
    throw new ApiError(
      400,
      `Proposal is already ${proposal.status.toLowerCase()}`
    );
  }

  const client = await Client.findOne({ user: req.user._id });
  const gig = await Gig.findById(proposal.gig);
  if (!gig) {
    throw new ApiError(404, "Associated gig not found");
  }

  if (!client || gig.client.toString() !== client._id.toString()) {
    throw new ApiError(403, "Access denied. You do not own the gig for this proposal.");
  }

  const acceptedProposal = await Proposal.findOne({
    gig: proposal.gig,
    status: "Accepted",
  });

  if (acceptedProposal) {
    throw new ApiError(
      400,
      "This job already has an accepted proposal"
    );
  }

  proposal.status = "Accepted";
  await proposal.save();

  gig.status = "In Progress";
  await gig.save();

  const otherProposals = await Proposal.find({
    gig: proposal.gig,
    _id: { $ne: proposal._id }
  });

  await Proposal.updateMany(
    {
      gig: proposal.gig,
      _id: { $ne: proposal._id },
    },
    {
      status: "Rejected",
    }
  );

  try {
    const { createNotification } = await import("../services/notification.service.js");
    
    // Notify the accepted freelancer
    const freelancerInfo = await Freelancer.findById(proposal.freelancer);
    if (freelancerInfo) {
      await createNotification({
        recipient: freelancerInfo.user,
        type: "proposal",
        title: "Proposal Accepted!",
        message: `Your proposal for the gig "${gig.title}" has been accepted!`
      });
    }

    // Notify auto-rejected freelancers
    const otherFreelancers = await Freelancer.find({
      _id: { $in: otherProposals.map((p) => p.freelancer) }
    }).select("user").lean();

    const notifPromises = otherFreelancers.map((otherFreelancer) => {
      return createNotification({
        recipient: otherFreelancer.user,
        type: "proposal",
        title: "Proposal Closed",
        message: `The gig "${gig.title}" has accepted another bid.`
      }).catch((err) => console.error("Notification failed for auto-reject:", err.message));
    });
    await Promise.all(notifPromises);
  } catch (notifErr) {
    console.error("Proposal accept notifications failed:", notifErr.message);
  }

  return res.status(200).json({
    success: true,
    message: "Proposal accepted",
    proposal,
  });
});

export const rejectProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  const gig = await Gig.findById(proposal.gig);
  if (!gig) {
    throw new ApiError(404, "Associated gig not found");
  }

  const client = await Client.findOne({ user: req.user._id });
  if (!client || gig.client.toString() !== client._id.toString()) {
    throw new ApiError(403, "Access denied. You do not own the gig for this proposal.");
  }

  if (proposal.status !== "Pending") {
    throw new ApiError(400, `Proposal is already ${proposal.status.toLowerCase()}`);
  }

  proposal.status = "Rejected";
  await proposal.save();

  try {
    const { createNotification } = await import("../services/notification.service.js");
    const freelancerInfo = await Freelancer.findById(proposal.freelancer);
    if (freelancerInfo) {
      await createNotification({
        recipient: freelancerInfo.user,
        type: "proposal",
        title: "Proposal Rejected",
        message: `Your proposal for the gig "${gig.title}" has been rejected.`
      });
    }
  } catch (notifErr) {
    console.error("Proposal reject notification failed:", notifErr.message);
  }

  return res.status(200).json({
    success: true,
    message: "Proposal rejected successfully",
    proposal,
  });
});