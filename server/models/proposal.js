import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
      index: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
  },

    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
      index: true,
    },

    coverLetter: {
      type: String,
      required: true,
    },

    proposedBudget: {
      type: Number,
      required: true,
    },

    deliveryTime: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

proposalSchema.index({ createdAt: -1 });

const Proposal = mongoose.model("Proposal", proposalSchema);

export default Proposal;