import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    target: {
      type: String,
      default: "",
    },

    details: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const AdminLog = mongoose.model("AdminLog", adminLogSchema);

export default AdminLog;