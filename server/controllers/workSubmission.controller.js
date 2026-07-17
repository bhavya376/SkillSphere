import WorkSubmission from "../models/workSubmission.js";
import Contract from "../models/contract.js";
import Freelancer from "../models/Freelancer.js";
import Client from "../models/client.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Helper to validate URLs
const isValidUrl = (urlStr) => {
  try {
    const url = new URL(urlStr);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
};

// ── Submit Work ───────────────────────────────────────────────────────────────
export const submitWork = asyncHandler(async (req, res) => {
  const { contractId, message, deliverableUrl, additionalLinks = [] } = req.body;

  if (!contractId || !message || !deliverableUrl) {
    throw new ApiError(400, "contractId, message, and deliverableUrl are required");
  }

  if (!isValidUrl(deliverableUrl)) {
    throw new ApiError(400, "Deliverable link must be a valid HTTP/HTTPS URL");
  }

  for (const link of additionalLinks) {
    if (link && !isValidUrl(link)) {
      throw new ApiError(400, "Additional links must be valid HTTP/HTTPS URLs");
    }
  }

  // 1. Fetch contract
  const contract = await Contract.findById(contractId);
  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  // 2. Validate contract status is Active or Revision Requested
  if (contract.status !== "Active" && contract.status !== "Revision Requested") {
    throw new ApiError(400, "Work can only be submitted for active contracts or those requesting revision.");
  }

  // 3. Verify user is the assigned Freelancer
  const freelancerProfile = await Freelancer.findOne({ user: req.user._id });
  if (!freelancerProfile || contract.freelancer.toString() !== freelancerProfile._id.toString()) {
    throw new ApiError(403, "Access denied: You are not the assigned freelancer for this contract.");
  }

  // 4. Determine revision number
  const previousSubmissionsCount = await WorkSubmission.countDocuments({ contract: contract._id });
  const revisionNumber = previousSubmissionsCount + 1;

  // 5. Create work submission
  const submission = await WorkSubmission.create({
    contract: contract._id,
    freelancer: freelancerProfile._id,
    message: message.trim(),
    deliverableUrl: deliverableUrl.trim(),
    additionalLinks: additionalLinks.filter(Boolean),
    status: "Submitted",
    revisionNumber,
  });

  // 6. Update contract status to Submitted
  contract.status = "Submitted";
  await contract.save();

  // 7. Notify Client
  try {
    const { createNotification } = await import("../services/notification.service.js");
    const clientProfile = await Client.findById(contract.client);
    if (clientProfile) {
      await createNotification({
        recipient: clientProfile.user,
        type: "system",
        title: "Work Deliverable Submitted",
        message: `Work submission v${revisionNumber} received for contract.`,
      });
    }
  } catch (notifErr) {
    console.error("Submission notification failed:", notifErr.message);
  }

  res.status(201).json({
    success: true,
    message: "Work submitted successfully!",
    submission,
  });
});

// ── Get Submissions ───────────────────────────────────────────────────────────
export const getSubmissionsForContract = asyncHandler(async (req, res) => {
  const { contractId } = req.params;

  const contract = await Contract.findById(contractId);
  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  // Verify participation (Client, Freelancer, or Admin)
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
    throw new ApiError(403, "Access denied: You do not participate in this contract.");
  }

  const submissions = await WorkSubmission.find({ contract: contractId }).sort({ revisionNumber: 1 });

  res.status(200).json({
    success: true,
    submissions,
  });
});

// ── Review Work (Accept or Request Revision) ──────────────────────────────────
export const reviewWork = asyncHandler(async (req, res) => {
  const { submissionId, action, revisionInstructions } = req.body;

  if (!submissionId || !action) {
    throw new ApiError(400, "submissionId and action are required");
  }

  if (action !== "accept" && action !== "revision") {
    throw new ApiError(400, "Invalid action. Must be 'accept' or 'revision'.");
  }

  const submission = await WorkSubmission.findById(submissionId);
  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  const contract = await Contract.findById(submission.contract);
  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  // 1. Verify user is the Client on the contract
  const clientProfile = await Client.findOne({ user: req.user._id });
  if (!clientProfile || contract.client.toString() !== clientProfile._id.toString()) {
    throw new ApiError(403, "Access denied: Only the contract client can review submissions.");
  }

  if (submission.status !== "Submitted") {
    throw new ApiError(400, "This submission has already been reviewed.");
  }

  const freelancerProfile = await Freelancer.findById(contract.freelancer);

  if (action === "accept") {
    // Mark submission accepted
    submission.status = "Accepted";
    await submission.save();

    // Mark contract completed
    contract.status = "Completed";
    await contract.save();

    // Notify Freelancer
    if (freelancerProfile) {
      try {
        const { createNotification } = await import("../services/notification.service.js");
        await createNotification({
          recipient: freelancerProfile.user,
          type: "system",
          title: "Work Deliverable Accepted",
          message: `Your work submission has been accepted! Contract is marked completed.`,
        });
      } catch (notifErr) {
        console.error("Accept notification failed:", notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Work accepted successfully. Project marked completed.",
      submission,
      contract,
    });
  } else if (action === "revision") {
    if (!revisionInstructions || !revisionInstructions.trim()) {
      throw new ApiError(400, "Revision instructions are required when requesting revision.");
    }

    // Update submission
    submission.status = "RevisionRequested";
    submission.revisionInstructions = revisionInstructions.trim();
    await submission.save();

    // Update contract
    contract.status = "Revision Requested";
    await contract.save();

    // Notify Freelancer
    if (freelancerProfile) {
      try {
        const { createNotification } = await import("../services/notification.service.js");
        await createNotification({
          recipient: freelancerProfile.user,
          type: "system",
          title: "Revision Requested on Work",
          message: `Client requested a revision: "${revisionInstructions.substring(0, 45)}..."`,
        });
      } catch (notifErr) {
        console.error("Revision notification failed:", notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Revision requested successfully.",
      submission,
      contract,
    });
  }
});
