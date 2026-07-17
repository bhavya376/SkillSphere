import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Submitted", "Revision Requested", "Completed", "Cancelled", "Disputed"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Contract = mongoose.model("Contract", contractSchema);

export default Contract;