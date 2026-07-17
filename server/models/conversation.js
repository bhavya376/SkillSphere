import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
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

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate conversations for the same client-freelancer pair.
// If a duplicate already exists in the DB, this index will block future ones
// without affecting existing data (MongoDB won't retroactively enforce uniqueness
// on already-stored documents, but will reject any new duplicate inserts).
conversationSchema.index({ client: 1, freelancer: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;