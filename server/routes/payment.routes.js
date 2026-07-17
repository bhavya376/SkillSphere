import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

import {
  createPayment,
  getAllPayments,
  getPaymentById,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/", protect, createPayment);
// Only clients can create Razorpay wallet-funding orders
router.post("/create-order", protect, authorize("client"), createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);

router.get("/", protect, getAllPayments);
router.get("/:id", protect, getPaymentById);

export default router;