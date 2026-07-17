import Dispute from "../models/dispute.js";
import Contract from "../models/contract.js";
import Client from "../models/client.js";
import Freelancer from "../models/Freelancer.js";
import Payment from "../models/Payment.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Create Dispute
export const createDispute = asyncHandler(async (req, res) => {
  const { contractId, reason, evidence } = req.body;

  if (!contractId || !reason || !evidence) {
    throw new ApiError(400, "contractId, reason, and evidence are required");
  }

  // 1. Fetch real contract
  const contract = await Contract.findById(contractId);
  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  // 2. Validate contract is active
  if (contract.status !== "Active") {
    throw new ApiError(400, "Disputes can only be raised on active contracts.");
  }

  // 3. Resolve user profile and check authorization
  let isAuthorized = false;
  let counterpartyUser = null;

  if (req.user.role === "client") {
    const clientProfile = await Client.findOne({ user: req.user._id });
    if (clientProfile && contract.client.toString() === clientProfile._id.toString()) {
      isAuthorized = true;
      const freelancerProfile = await Freelancer.findById(contract.freelancer);
      if (freelancerProfile) counterpartyUser = freelancerProfile.user;
    }
  } else if (req.user.role === "freelancer") {
    const freelancerProfile = await Freelancer.findOne({ user: req.user._id });
    if (freelancerProfile && contract.freelancer.toString() === freelancerProfile._id.toString()) {
      isAuthorized = true;
      const clientProfile = await Client.findById(contract.client);
      if (clientProfile) counterpartyUser = clientProfile.user;
    }
  }

  if (!isAuthorized) {
    throw new ApiError(403, "Access denied: You are not a participant in this contract.");
  }

  // 4. Create dispute
  const dispute = await Dispute.create({
    contract: contract._id,
    initiator: req.user._id,
    reason,
    evidence,
    status: "Pending",
  });

  // 5. Update contract status to Disputed
  contract.status = "Disputed";
  await contract.save();

  // 6. Notify counterparty
  if (counterpartyUser) {
    try {
      const { createNotification } = await import("../services/notification.service.js");
      await createNotification({
        recipient: counterpartyUser,
        type: "system",
        title: "Contract Disputed",
        message: `A dispute has been raised on your contract: "${reason.substring(0, 40)}${reason.length > 40 ? '...' : ''}"`
      });
    } catch (notifErr) {
      console.error("Dispute notification failed:", notifErr.message);
    }
  }

  return res.status(201).json({
    success: true,
    message: "Dispute submitted successfully. An administrator will review your evidence.",
    dispute,
  });
});

// Get Disputes
export const getDisputes = asyncHandler(async (req, res) => {
  let disputes = [];

  if (req.user.role === "admin") {
    // Admin gets all disputes
    disputes = await Dispute.find()
      .populate({
        path: "contract",
        populate: [
          { path: "client" },
          { path: "freelancer" }
        ]
      })
      .populate("initiator", "name email role");
  } else {
    // Regular users get disputes on contracts they participate in
    let profileId;
    if (req.user.role === "client") {
      const client = await Client.findOne({ user: req.user._id });
      if (client) profileId = client._id;
    } else if (req.user.role === "freelancer") {
      const freelancer = await Freelancer.findOne({ user: req.user._id });
      if (freelancer) profileId = freelancer._id;
    }

    if (profileId) {
      const userContracts = await Contract.find({
        $or: [{ client: profileId }, { freelancer: profileId }],
      });
      const contractIds = userContracts.map((c) => c._id);
      disputes = await Dispute.find({ contract: { $in: contractIds } })
        .populate({
          path: "contract",
          populate: [
            { path: "client" },
            { path: "freelancer" }
          ]
        })
        .populate("initiator", "name email role");
    }
  }

  return res.status(200).json({
    success: true,
    disputes,
  });
});

// Resolve Dispute (Admin Only)
export const resolveDispute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutionDetails, outcome } = req.body; // outcome = "refund_client" | "pay_freelancer" | "cancel"

  if (!resolutionDetails || !outcome) {
    throw new ApiError(400, "resolutionDetails and outcome are required");
  }

  const dispute = await Dispute.findById(id);
  if (!dispute) {
    throw new ApiError(404, "Dispute not found");
  }

  if (dispute.status !== "Pending") {
    throw new ApiError(400, "Dispute is already resolved.");
  }

  const contract = await Contract.findById(dispute.contract);
  if (!contract) {
    throw new ApiError(404, "Contract associated with dispute not found");
  }

  // Update contract status and resolve based on outcome
  if (outcome === "refund_client") {
    contract.status = "Cancelled";
    // Mark associated payment failed/refunded in DB
    await Payment.findOneAndUpdate(
      { contract: contract._id },
      { paymentStatus: "Failed" }
    );
  } else if (outcome === "pay_freelancer") {
    contract.status = "Completed";
    // Mark associated payment completed in DB
    await Payment.findOneAndUpdate(
      { contract: contract._id },
      { paymentStatus: "Completed" }
    );
  } else {
    contract.status = "Cancelled";
  }

  await contract.save();

  // Update dispute details
  dispute.status = "Resolved";
  dispute.resolutionDetails = resolutionDetails;
  dispute.resolvedAt = new Date();
  dispute.resolvedBy = req.user._id;
  await dispute.save();

  // Send notifications to client and freelancer
  try {
    const { createNotification } = await import("../services/notification.service.js");
    const clientProfile = await Client.findById(contract.client);
    const freelancerProfile = await Freelancer.findById(contract.freelancer);

    if (clientProfile) {
      await createNotification({
        recipient: clientProfile.user,
        type: "system",
        title: "Dispute Resolved",
        message: `Dispute on contract has been resolved by Admin. Outcome: ${outcome}. Notes: ${resolutionDetails}`
      });
    }

    if (freelancerProfile) {
      await createNotification({
        recipient: freelancerProfile.user,
        type: "system",
        title: "Dispute Resolved",
        message: `Dispute on contract has been resolved by Admin. Outcome: ${outcome}. Notes: ${resolutionDetails}`
      });
    }
  } catch (notifErr) {
    console.error("Dispute resolution notification failed:", notifErr.message);
  }

  return res.status(200).json({
    success: true,
    message: "Dispute resolved successfully.",
    dispute,
  });
});
