import Contract from "../models/contract.js";
import Proposal from "../models/proposal.js";
import Client from "../models/client.js";
import Freelancer from "../models/Freelancer.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Create Contract
export const createContract = asyncHandler(async (req, res) => {
  const { proposalId, endDate } = req.body;

  const proposal = await Proposal.findById(proposalId);

  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  if (proposal.status !== "Accepted") {
    throw new ApiError(400, "Proposal must be accepted first");
  }

  const contract = await Contract.create({
    proposal: proposal._id,
    client: proposal.client,
    freelancer: proposal.freelancer,
    amount: proposal.proposedBudget,
    endDate,
  });

  try {
    const { createNotification } = await import("../services/notification.service.js");
    const Freelancer = (await import("../models/Freelancer.js")).default;
    const freelancerInfo = await Freelancer.findById(contract.freelancer);
    if (freelancerInfo) {
      await createNotification({
        recipient: freelancerInfo.user,
        type: "system",
        title: "Contract Created",
        message: `A new contract has been created for your proposal.`
      });
    }
  } catch (notifErr) {
    console.error("Contract creation notification failed:", notifErr.message);
  }

  return res.status(201).json({
    success: true,
    message: "Contract created successfully",
    contract,
  });
});

// Get All Contracts
export const getAllContracts = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role !== "admin") {
    if (req.user.role === "client") {
      const clientProfile = await Client.findOne({ user: req.user._id });
      if (!clientProfile) {
        return res.status(200).json({ success: true, contracts: [] });
      }
      filter = { client: clientProfile._id };
    } else if (req.user.role === "freelancer") {
      const freelancerProfile = await Freelancer.findOne({ user: req.user._id });
      if (!freelancerProfile) {
        return res.status(200).json({ success: true, contracts: [] });
      }
      filter = { freelancer: freelancerProfile._id };
    } else {
      // Unknown role
      return res.status(200).json({ success: true, contracts: [] });
    }
  }

  const contracts = await Contract.find(filter)
    .populate("proposal")
    .populate({
      path: "client",
      populate: { path: "user", select: "name email" }
    })
    .populate({
      path: "freelancer",
      populate: { path: "user", select: "name email" }
    })
    .lean();

  return res.status(200).json({
    success: true,
    contracts,
  });
});

// Get Contract By ID
export const getContractById = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id)
    .populate("proposal")
    .populate({
      path: "client",
      populate: { path: "user", select: "name email" }
    })
    .populate({
      path: "freelancer",
      populate: { path: "user", select: "name email" }
    })
    .lean();

  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  // Verify access authorization
  let isAuthorized = req.user.role === "admin";
  if (!isAuthorized) {
    if (req.user.role === "client") {
      const clientProfile = await Client.findOne({ user: req.user._id });
      if (clientProfile && contract.client._id.toString() === clientProfile._id.toString()) {
        isAuthorized = true;
      }
    } else if (req.user.role === "freelancer") {
      const freelancerProfile = await Freelancer.findOne({ user: req.user._id });
      if (freelancerProfile && contract.freelancer._id.toString() === freelancerProfile._id.toString()) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    throw new ApiError(403, "Access denied: You do not participate in this contract.");
  }

  return res.status(200).json({
    success: true,
    contract,
  });
});

// Update Contract
export const updateContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  // Verify update authorization
  let isAuthorized = req.user.role === "admin";
  if (!isAuthorized) {
    if (req.user.role === "client") {
      const clientProfile = await Client.findOne({ user: req.user._id });
      if (clientProfile && contract.client.toString() === clientProfile._id.toString()) {
        isAuthorized = true;
      }
    } else if (req.user.role === "freelancer") {
      const freelancerProfile = await Freelancer.findOne({ user: req.user._id });
      if (freelancerProfile && contract.freelancer.toString() === freelancerProfile._id.toString()) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    throw new ApiError(403, "Access denied: You are not authorized to update this contract.");
  }

  const originalStatus = contract.status;
  Object.assign(contract, req.body);
  await contract.save();

  if (req.body.status && req.body.status !== originalStatus) {
    try {
      const { createNotification } = await import("../services/notification.service.js");
      const ClientModel = (await import("../models/client.js")).default;
      const FreelancerModel = (await import("../models/Freelancer.js")).default;
      
      let recipientUser;
      if (req.user.role === "client") {
        const freelancerInfo = await FreelancerModel.findById(contract.freelancer);
        if (freelancerInfo) recipientUser = freelancerInfo.user;
      } else {
        const clientInfo = await ClientModel.findById(contract.client);
        if (clientInfo) recipientUser = clientInfo.user;
      }

      if (recipientUser) {
        await createNotification({
          recipient: recipientUser,
          type: "system",
          title: "Contract Status Updated",
          message: `Your contract status has been changed to: ${contract.status}.`
        });
      }
    } catch (notifErr) {
      console.error("Contract update notification failed:", notifErr.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Contract updated successfully",
    contract,
  });
});

// Delete Contract
export const deleteContract = asyncHandler(async (req, res) => {
  // Only admins can delete contracts
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied: Only administrators can delete contracts.");
  }

  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  await contract.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Contract deleted successfully",
  });
});