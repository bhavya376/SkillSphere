import Notification from "../models/notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Fetch user's own notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    notifications
  });
});

// Fetch unread count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });

  return res.status(200).json({
    success: true,
    count
  });
});

// Mark single notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  // Security Check: Enforce ownership validation
  if (notification.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied: You do not own this notification");
  }

  notification.isRead = true;
  await notification.save();

  return res.status(200).json({
    success: true,
    message: "Notification marked as read",
    notification
  });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  return res.status(200).json({
    success: true,
    message: "All notifications marked as read"
  });
});

// Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  // Security Check: Enforce ownership validation
  if (notification.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied: You do not own this notification");
  }

  await notification.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Notification deleted successfully"
  });
});
