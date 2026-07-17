import User from "../models/user.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { sendVerificationOTP } from "../services/email.service.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── OTP helpers ───────────────────────────────────────────────────────────────

/** Generate a cryptographically secure 6-digit numeric OTP */
const generateOTP = () => {
  // crypto.randomInt(min, max) generates a random integer in [min, max)
  const otp = crypto.randomInt(100000, 1000000).toString(); // always 6 digits
  return otp;
};

/** Hash OTP with bcrypt (cost 10) before storing */
const hashOTP = async (otp) => bcrypt.hash(otp, 10);

/** Compare plaintext OTP against stored hash */
const compareOTP = async (otp, hash) => bcrypt.compare(otp, hash);

// ── Register ──────────────────────────────────────────────────────────────────

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (role === "admin") {
      return res.status(400).json({ message: "Registration as admin is not allowed." });
    }

    const allowedRoles = ["client", "freelancer"];
    const finalRole = allowedRoles.includes(role) ? role : "client";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If already verified, reject outright
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Unverified account exists — regenerate OTP and resend
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      existingUser.emailVerificationOTPHash = otpHash;
      existingUser.emailVerificationOTPExpires = expires;
      existingUser.otpResendCooldown = new Date();
      await existingUser.save();

      try {
        await sendVerificationOTP(email, existingUser.name, otp);
      } catch (mailErr) {
        console.error("OTP email send failed:", mailErr.message);
        return res.status(500).json({ message: "Account exists but failed to send verification email. Please try again." });
      }

      return res.status(200).json({
        emailVerificationRequired: true,
        userId: existingUser._id,
        message: "Verification code resent to your email.",
      });
    }

    // New user — hash password and create account (unverified)
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      isEmailVerified: false,
      emailVerificationOTPHash: otpHash,
      emailVerificationOTPExpires: expires,
      otpResendCooldown: new Date(),
    });

    try {
      await sendVerificationOTP(email, name, otp);
    } catch (mailErr) {
      // Roll back the user creation to allow retry
      await User.deleteOne({ _id: user._id });
      console.error("OTP email send failed during register, rolled back user creation:", mailErr.message);
      return res.status(500).json({
        message: `Failed to send verification email: ${mailErr.message}. Please check your email and try again.`
      });
    }

    res.status(201).json({
      emailVerificationRequired: true,
      userId: user._id,
      email: user.email,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Verify Email OTP ──────────────────────────────────────────────────────────

export const verifyEmailOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "userId and otp are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      // Already verified — just issue token
      return res.status(200).json({
        message: "Email already verified",
        token: generateToken(user._id),
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      });
    }

    if (!user.emailVerificationOTPHash || !user.emailVerificationOTPExpires) {
      return res.status(400).json({ message: "No verification code found. Please request a new one." });
    }

    if (new Date() > user.emailVerificationOTPExpires) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one.", otpExpired: true });
    }

    const isMatch = await compareOTP(otp.toString().trim(), user.emailVerificationOTPHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid verification code. Please check and try again." });
    }

    // Mark verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailVerificationOTPHash = "";
    user.emailVerificationOTPExpires = null;
    user.otpResendCooldown = null;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully!",
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Resend Verification OTP ───────────────────────────────────────────────────

export const resendVerificationOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Enforce 60-second resend cooldown
    if (user.otpResendCooldown) {
      const cooldownMs = 60 * 1000;
      const elapsed = Date.now() - new Date(user.otpResendCooldown).getTime();
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${remaining} seconds before requesting a new code.`,
          retryAfter: remaining,
        });
      }
    }

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationOTPHash = otpHash;
    user.emailVerificationOTPExpires = expires;
    user.otpResendCooldown = new Date();
    await user.save();

    try {
      await sendVerificationOTP(user.email, user.name, otp);
    } catch (mailErr) {
      console.error("OTP resend email failed:", mailErr.message);
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    res.status(200).json({ message: "New verification code sent to your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Block unverified email/password accounts
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in.",
        emailVerificationRequired: true,
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
        userId: user._id,
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(200).json({
        twoFactorRequired: true,
        userId: user._id,
      });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Google OAuth Login / Register ─────────────────────────────────────────────

export const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({
        message: "Google Client ID is not configured on the server. Please check environment configuration.",
      });
    }

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Backend verifies the Google ID token — never trust frontend-provided email
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch (err) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      if (role === "admin") {
        return res.status(400).json({ message: "Admin role not allowed" });
      }
      const allowedRoles = ["client", "freelancer"];
      const finalRole = allowedRoles.includes(role) ? role : "client";

      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: finalRole,
        avatar: picture || "",
        // Google verifies email server-side — mark as verified immediately
        isEmailVerified: true,
      });
    } else if (!user.isEmailVerified) {
      // Existing unverified email/password account — link and verify via Google
      user.isEmailVerified = true;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save();
    }

    if (user.twoFactorEnabled) {
      return res.status(200).json({
        twoFactorRequired: true,
        userId: user._id,
      });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 2FA ───────────────────────────────────────────────────────────────────────

export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const secret = speakeasy.generateSecret({
      name: `SkillSphere (${user.email})`,
    });

    user.twoFactorTempSecret = secret.base32;
    await user.save();

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({ message: "2FA setup has not been initiated" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = "";
    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Two-Factor Authentication enabled successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.twoFactorSecret = "";
    user.twoFactorEnabled = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Two-Factor Authentication disabled successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginVerify2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "Invalid verification request" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};