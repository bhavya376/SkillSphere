import mongoose from "mongoose";

const workSubmissionSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },

    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    deliverableUrl: {
      type: String,
      required: true,
    },

    additionalLinks: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["Submitted", "Accepted", "RevisionRequested"],
      default: "Submitted",
    },

    revisionInstructions: {
      type: String,
      default: "",
    },

    revisionNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const WorkSubmission = mongoose.model("WorkSubmission", workSubmissionSchema);

export default WorkSubmission;
