import Payment from "../models/Payment.js";
import Contract from "../models/contract.js";
import Client from "../models/client.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { processMockPayment } from "../services/paymentService.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Create Payment
export const createPayment = asyncHandler(async (req, res) => {
  const { contractId, paymentMethod = "Mock" } = req.body;

  const contract = await Contract.findById(contractId);

  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }
const existingPayment = await Payment.findOne({
  contract: contract._id,
});

if (existingPayment) {
  throw new ApiError(
    400,
    "Payment already exists for this contract"
  );
}
  const payment = await Payment.create({
    contract: contract._id,
    client: contract.client,
    freelancer: contract.freelancer,
    amount: contract.amount,
    paymentMethod,
  });

  const completedPayment = await processMockPayment(payment);

  return res.status(201).json({
    success: true,
    message: "Payment completed successfully",
    payment: completedPayment,
  });
});

// Get All Payments
export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("contract")
    .populate("client")
    .populate("freelancer");

  return res.status(200).json({
    success: true,
    payments,
  });
});

// Get Payment By ID
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return res.status(200).json({
    success: true,
    payment,
  });
});

// Create Razorpay Order
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new ApiError(500, "Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing on the server.");
  }

  const parsedAmount = parseFloat(amount);
  if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new ApiError(400, "A valid positive amount is required to add funds.");
  }

  const clientProfile = await Client.findOne({ user: req.user._id });
  if (!clientProfile) {
    throw new ApiError(404, "Client profile not found. Only clients can add funds.");
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const amountInPaise = Math.round(parsedAmount * 100);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_funds_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);

    await Payment.create({
      client: clientProfile._id,
      amount: parsedAmount,
      paymentStatus: "Pending",
      paymentMethod: "Razorpay",
      transactionId: order.id,
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    throw new ApiError(500, err.message || "Failed to create Razorpay order.");
  }
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new ApiError(500, "Razorpay key secret is not configured on the server.");
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing required verification parameters.");
  }

  // 1. Idempotency Check: check if already completed
  let payment = await Payment.findOne({ transactionId: razorpay_payment_id, paymentStatus: "Completed" });
  if (payment) {
    return res.status(200).json({
      success: true,
      message: "Payment already verified.",
      payment,
    });
  }

  // 2. Signature verification
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    await Payment.findOneAndUpdate(
      { transactionId: razorpay_order_id },
      { paymentStatus: "Failed" }
    );
    throw new ApiError(400, "Payment verification signature mismatch.");
  }

  // 3. Update pending payment record
  payment = await Payment.findOneAndUpdate(
    { transactionId: razorpay_order_id },
    { 
      paymentStatus: "Completed",
      transactionId: razorpay_payment_id,
    },
    { new: true }
  );

  if (!payment) {
    throw new ApiError(404, "Pending payment transaction record not found.");
  }

  try {
    const { createNotification } = await import("../services/notification.service.js");
    const Client = (await import("../models/client.js")).default;
    const clientInfo = await Client.findById(payment.client);
    if (clientInfo) {
      await createNotification({
        recipient: clientInfo.user,
        type: "payment",
        title: "Payment Successful",
        message: `Your payment of ₹${payment.amount} has been successfully verified.`
      });
    }
  } catch (notifErr) {
    console.error("Payment notification failed:", notifErr.message);
  }

  return res.status(200).json({
    success: true,
    message: "Payment verified successfully.",
    payment,
  });
});