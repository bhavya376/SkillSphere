import mongoose from "mongoose";

const gigSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    skills: [
      {
        type: String,
      },
    ],

    budget: {
      type: Number,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed", "Cancelled"],
      default: "Open",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

gigSchema.index({ createdAt: -1 });

const Gig = mongoose.model("Gig", gigSchema);

export default Gig;