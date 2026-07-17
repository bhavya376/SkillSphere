import express from "express";
import { 
  register, 
  login, 
  getMe, 
  googleLogin, 
  setup2FA, 
  verify2FA, 
  disable2FA, 
  loginVerify2FA,
  verifyEmailOTP,
  resendVerificationOTP
} from "../controllers/auth.controller.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/2fa/setup", protect, setup2FA);
router.post("/2fa/verify", protect, verify2FA);
router.post("/2fa/disable", protect, disable2FA);
router.post("/2fa/login-verify", loginVerify2FA);
router.post("/verify-email", verifyEmailOTP);
router.post("/resend-otp", resendVerificationOTP);
router.get("/me", protect, getMe);

export default router;