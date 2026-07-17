import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import gigRoutes from "./routes/gig.routes.js";
import connectDB from "./config/db.js";
import proposalRoutes from "./routes/proposal.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import freelancerroutes from "./routes/freelancer.routes.js";
import clientRoutes from "./routes/client.routes.js";
import errorHandler from "./middleware/errorMiddleware.js";
import contractRoutes from "./routes/contract.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { Server } from "socket.io";
import { initSocket } from "./socket/socket.js";
import chatRoutes from "./routes/chat.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import disputeRoutes from "./routes/dispute.routes.js";
import submissionRoutes from "./routes/workSubmission.routes.js";
import { startContractScheduler } from "./services/scheduler.js";
import jwt from "jsonwebtoken";
import User from "./models/user.js";

dotenv.config();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://skillsphere-l2nn.vercel.app"
];
if (process.env.FRONTEND_URL) {
  // Allow env variable to extend allowed origins list
  const extra = process.env.FRONTEND_URL.split(",");
  extra.forEach(origin => {
    if (origin && !allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

const app = express();

import { createServer } from "http";

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
initSocket(io);

// Track online users: userId string -> Set of socket.id strings
const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }
    socket.user = user;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  socket.join(userId);
  console.log(`User Connected: ${userId} (${socket.id})`);

  // Add to online presence map
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Broadcast presence updates
  io.emit("user_status", { userId, status: "online" });

  // Handle client room joining explicitly
  socket.on("join", () => {
    socket.join(userId);
  });

  socket.on("check_online", (targetUserId) => {
    const isOnline = onlineUsers.has(targetUserId);
    socket.emit("user_status", { userId: targetUserId, status: isOnline ? "online" : "offline" });
  });

  socket.on("typing", (data) => {
    if (data.receiverUserId) {
      io.to(data.receiverUserId).emit("typing", {
        conversationId: data.conversationId,
        senderUserId: userId
      });
    }
  });

  socket.on("stop_typing", (data) => {
    if (data.receiverUserId) {
      io.to(data.receiverUserId).emit("stop_typing", {
        conversationId: data.conversationId,
        senderUserId: userId
      });
    }
  });

  socket.on("send_message", async (data) => {
    // Enforce participation checks on real-time routing
    try {
      const Conversation = (await import("./models/conversation.js")).default;
      const Freelancer = (await import("./models/Freelancer.js")).default;
      const Client = (await import("./models/client.js")).default;

      const conversation = await Conversation.findById(data.conversationId);
      if (!conversation) return;

      let senderProfileId;
      if (socket.user.role === "freelancer") {
        const freelancer = await Freelancer.findOne({ user: socket.user._id });
        if (freelancer) senderProfileId = freelancer._id.toString();
      } else {
        const client = await Client.findOne({ user: socket.user._id });
        if (client) senderProfileId = client._id.toString();
      }

      if (
        conversation.client.toString() !== senderProfileId &&
        conversation.freelancer.toString() !== senderProfileId
      ) {
        console.log(`Blocked unauthorized message routing from user ${userId}`);
        return;
      }

      if (data.receiverUserId) {
        io.to(data.receiverUserId).emit("receive_message", {
          ...data,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        });
      }
    } catch (err) {
      console.error("Socket send_message verification error:", err);
    }
  });

  socket.on("disconnect", () => {
    if (onlineUsers.has(userId)) {
      const userSockets = onlineUsers.get(userId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit("user_status", { userId, status: "offline" });
      }
    }
    console.log(`User Disconnected: ${userId} (${socket.id})`);
  });
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());

// Health Check Endpoint (unauthenticated)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillSphere API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/freelancers", freelancerroutes);
app.use("/api/clients", clientRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api", userRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/submissions", submissionRoutes);

// Fallback for unknown API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startContractScheduler();
});