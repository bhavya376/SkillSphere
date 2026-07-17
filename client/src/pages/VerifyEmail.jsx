import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button, Input } from "../components/ui";
import API from "../api";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Safely restore email and userId from navigation state or sessionStorage
  const [email, setEmail] = useState(() => {
    return location.state?.email || sessionStorage.getItem("pending_verify_email") || "";
  });
  const [userId, setUserId] = useState(() => {
    return location.state?.userId || sessionStorage.getItem("pending_verify_user_id") || "";
  });

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Store variables in sessionStorage to preserve state on page reload
  useEffect(() => {
    if (location.state?.email) {
      sessionStorage.setItem("pending_verify_email", location.state.email);
      setEmail(location.state.email);
    }
    if (location.state?.userId) {
      sessionStorage.setItem("pending_verify_user_id", location.state.userId);
      setUserId(location.state.userId);
    }
  }, [location.state]);

  // If userId is missing, redirect to login after a brief check
  useEffect(() => {
    if (!userId) {
      toast.error("No pending verification session found. Please login to verify.");
      navigate("/login");
    }
  }, [userId, navigate]);

  // Handle countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await API.post("/auth/verify-email", { userId, otp });
      if (res.data.success || res.status === 200) {
        toast.success(res.data.message || "Email verified successfully!");
        // Clear pending verify session info
        sessionStorage.removeItem("pending_verify_email");
        sessionStorage.removeItem("pending_verify_user_id");
        // Redirect to login page as required by workflow
        navigate("/login");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Verification failed";
      toast.error(errMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    try {
      const res = await API.post("/auth/resend-otp", { userId });
      toast.success(res.data.message || "Verification code resent successfully!");
      // Reset the 60-second cooldown on frontend
      setCooldown(60);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to resend code";
      toast.error(errMsg);
      // If server provides a retry time, update cooldown
      if (err.response?.status === 429 && err.response?.data?.retryAfter) {
        setCooldown(err.response.data.retryAfter);
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="auth-page-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ maxWidth: "480px" }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1" }}>
            <ShieldCheck size={26} />
          </div>
        </div>

        <h2 className="auth-title">Verify Your Email</h2>
        <p className="auth-subtitle" style={{ marginBottom: "24px" }}>
          We sent a 6-digit verification code to <strong style={{ color: "var(--accent)" }}>{email || "your email"}</strong>
        </p>

        <form onSubmit={handleVerify} className="auth-form">
          <Input
            label="Verification Code"
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            style={{ textAlign: "center", letterSpacing: "0.2em", fontSize: "18px", fontWeight: "700" }}
          />

          <Button
            type="submit"
            loading={isVerifying}
            variant="primary"
            style={{ width: "100%", marginTop: "20px" }}
          >
            Verify Email
          </Button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", marginTop: "24px" }}>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            style={{
              background: "none",
              border: "none",
              color: cooldown > 0 ? "var(--text-secondary)" : "var(--accent)",
              cursor: cooldown > 0 ? "not-allowed" : "pointer",
              fontSize: "13.5px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
            {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend OTP"}
          </button>

          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              marginTop: "8px"
            }}
          >
            <ArrowLeft size={12} />
            <span>Back to Login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
