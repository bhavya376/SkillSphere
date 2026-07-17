import Notification from "../models/notification.js";
import { getIO } from "../socket/socket.js";

export const createNotification = async ({ recipient, type, title, message }) => {
  try {
    // 1. Save to MongoDB
    const notification = await Notification.create({
      user: recipient,
      type,
      title,
      message,
      isRead: false
    });

    // 2. Emit in real time via Socket.IO
    try {
      const io = getIO();
      const recipientIdStr = recipient.toString();
      io.to(recipientIdStr).emit("new_notification", notification);
      console.log(`Socket notification emitted to user ${recipientIdStr}`);
    } catch (socketErr) {
      console.error("Failed to emit socket notification:", socketErr.message);
    }

    return notification;
  } catch (err) {
    console.error("Failed to create notification in service:", err.message);
  }
};
