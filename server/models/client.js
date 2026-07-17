import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    companyName: {
      type: String,
      default: "",
    },

    industry: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model("Client", clientSchema);

export default Client;