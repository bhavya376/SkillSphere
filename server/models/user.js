import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["client", "freelancer", "admin"],
      default: "client",
    },

    avatar: {
      type: String,
      default: "",
    },

    twoFactorSecret: {
      type: String,
      default: "",
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorTempSecret: {
      type: String,
      default: "",
    },

    // ── Email OTP Verification ────────────────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // bcrypt hash of the 6-digit OTP — never store plaintext
    emailVerificationOTPHash: {
      type: String,
      default: "",
    },

    // UTC timestamp when the OTP expires (10 minutes after generation)
    emailVerificationOTPExpires: {
      type: Date,
      default: null,
    },

    // UTC timestamp of last OTP send — used to enforce resend cooldown
    otpResendCooldown: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;