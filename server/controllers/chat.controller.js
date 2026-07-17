import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import Freelancer from "../models/Freelancer.js";
import Client from "../models/client.js";

export const getConversations = async (req, res) => {
  try {
    let profileId;
    let roleField;

    if (req.user.role === "freelancer") {
      const freelancer = await Freelancer.findOne({ user: req.user._id });
      if (!freelancer) return res.status(404).json({ message: "Freelancer profile not found" });
      profileId = freelancer._id;
      roleField = "freelancer";
    } else if (req.user.role === "client") {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) return res.status(404).json({ message: "Client profile not found" });
      profileId = client._id;
      roleField = "client";
    } else {
      return res.status(400).json({ message: "Invalid role for chat" });
    }

    const conversations = await Conversation.find({ [roleField]: profileId })
      .populate({
        path: "client",
        populate: { path: "user", select: "name email avatar" }
      })
      .populate({
        path: "freelancer",
        populate: { path: "user", select: "name email avatar" }
      })
      .sort({ lastMessageAt: -1 });

    // ── Deduplicate by participant pair ──────────────────────────────────────
    // If the DB contains multiple conversation documents for the same
    // client+freelancer (created before the unique index existed), we
    // collapse them here so the sidebar only shows ONE entry per participant.
    // The most-recent conversation (already sorted by lastMessageAt DESC) wins.
    const seen = new Set();
    const uniqueConversations = conversations.filter((conv) => {
      const key = [conv.client?._id?.toString(), conv.freelancer?._id?.toString()]
        .sort()
        .join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const conversationsWithUnread = await Promise.all(
      uniqueConversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          isRead: false
        });
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.status(200).json({ success: true, conversations: conversationsWithUnread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    let profileId;
    if (req.user.role === "freelancer") {
      const freelancer = await Freelancer.findOne({ user: req.user._id });
      if (!freelancer) return res.status(404).json({ message: "Freelancer profile not found" });
      profileId = freelancer._id.toString();
    } else if (req.user.role === "client") {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) return res.status(404).json({ message: "Client profile not found" });
      profileId = client._id.toString();
    } else {
      return res.status(403).json({ message: "Access denied: Invalid role" });
    }

    if (conversation.client.toString() !== profileId && conversation.freelancer.toString() !== profileId) {
      return res.status(403).json({ message: "Access denied. You do not participate in this conversation." });
    }

    // Mark messages in this conversation sent by other participant as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, message } = req.body;
    let convId = conversationId;

    let profileId;
    if (req.user.role === "freelancer") {
      const freelancer = await Freelancer.findOne({ user: req.user._id });
      if (!freelancer) return res.status(404).json({ message: "Freelancer profile not found" });
      profileId = freelancer._id.toString();
    } else if (req.user.role === "client") {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) return res.status(404).json({ message: "Client profile not found" });
      profileId = client._id.toString();
    } else {
      return res.status(403).json({ message: "Access denied: Invalid role" });
    }

    if (!convId) {
      let clientProfileId, freelancerProfileId;
      if (req.user.role === "client") {
        clientProfileId = profileId;
        freelancerProfileId = receiverId;
      } else {
        freelancerProfileId = profileId;
        clientProfileId = receiverId;
      }

      // Atomic find-or-create: prevents race-condition duplicates.
      // findOneAndUpdate with upsert will find the existing conversation or
      // create exactly one new one — never two — even under concurrent requests.
      const conv = await Conversation.findOneAndUpdate(
        { client: clientProfileId, freelancer: freelancerProfileId },
        {
          $setOnInsert: {
            client: clientProfileId,
            freelancer: freelancerProfileId,
            lastMessage: "",
            lastMessageAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      convId = conv._id;
    } else {
      const conv = await Conversation.findById(convId);
      if (!conv) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      if (conv.client.toString() !== profileId && conv.freelancer.toString() !== profileId) {
        return res.status(403).json({ message: "Access denied. You do not participate in this conversation." });
      }
    }

    // Only create a message if there is actual text content
    if (!message || !message.trim()) {
      // Caller just wanted to initialize the conversation — return it without a message
      const conv = await Conversation.findById(convId)
        .populate({ path: "client", populate: { path: "user", select: "name email avatar" } })
        .populate({ path: "freelancer", populate: { path: "user", select: "name email avatar" } });
      return res.status(200).json({ success: true, conversationId: convId, conversation: conv });
    }

    const newMessage = await Message.create({
      conversation: convId,
      sender: req.user._id,
      message
    });

    await Conversation.findByIdAndUpdate(convId, {
      lastMessage: message,
      lastMessageAt: new Date()
    });

    const populatedMessage = await Message.findById(newMessage._id).populate("sender", "name email avatar");

    try {
      const conv = await Conversation.findById(convId);
      if (conv) {
        const clientInfo = await Client.findById(conv.client);
        const freelancerInfo = await Freelancer.findById(conv.freelancer);
        let recipientUserId;
        if (req.user._id.toString() === clientInfo?.user?.toString()) {
          recipientUserId = freelancerInfo?.user;
        } else {
          recipientUserId = clientInfo?.user;
        }

        if (recipientUserId) {
          const { createNotification } = await import("../services/notification.service.js");
          await createNotification({
            recipient: recipientUserId,
            type: "message",
            title: "New Message",
            message: `New message from ${req.user.name}: "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"`
          });
        }
      }
    } catch (notifErr) {
      console.error("Message notification trigger failed:", notifErr.message);
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

