import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },

    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    evidence: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Resolved", "Cancelled"],
      default: "Pending",
    },

    resolutionDetails: {
      type: String,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;
