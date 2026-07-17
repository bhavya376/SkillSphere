import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, googleLogin, loginVerify2FA } from "../features/auth/authThunks";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button, Input } from "../components/ui";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 2FA login states
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [userId, setUserId] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  const validateEmail = (emailVal) => {
    if (!emailVal) {
      setEmailError("Email is required");
      return "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setEmailError("Please enter a valid email address");
      return "Please enter a valid email address";
    } else {
      setEmailError("");
      return "";
    }
  };

  const validatePassword = (passVal) => {
    if (!passVal) {
      setPasswordError("Password is required");
      return "Password is required";
    } else if (passVal.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return "Password must be at least 6 characters long";
    } else {
      setPasswordError("");
      return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "email") validateEmail(value);
    if (name === "password") validatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);

    if (emailErr || passwordErr) {
      toast.error("Please correct the form errors before logging in.");
      return;
    }

    const resultAction = await dispatch(login(formData));
    if (login.fulfilled.match(resultAction)) {
      if (resultAction.payload?.twoFactorRequired) {
        setTwoFactorRequired(true);
        setUserId(resultAction.payload.userId);
        toast.success("Two-Factor Authentication required. Enter code.");
      } else {
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } else {
      const payload = resultAction.payload;
      if (payload && (payload.code === "EMAIL_NOT_VERIFIED" || payload.emailVerificationRequired)) {
        toast.error(payload.message || "Please verify your email address.");
        navigate("/verify-email", { state: { email: payload.email || formData.email, userId: payload.userId } });
      } else {
        toast.error(typeof payload === "string" ? payload : payload?.message || "Login failed");
      }
    }
  };

  const handleGoogleCallback = async (response) => {
    const resultAction = await dispatch(
      googleLogin({ credential: response.credential, role: "client" })
    );
    if (googleLogin.fulfilled.match(resultAction)) {
      if (resultAction.payload?.twoFactorRequired) {
        setTwoFactorRequired(true);
        setUserId(resultAction.payload.userId);
        toast.success("Two-Factor Authentication required. Enter code.");
      } else {
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } else {
      toast.error(resultAction.payload || "Google authentication failed");
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otpToken) {
      toast.error("Please enter your verification code");
      return;
    }

    setVerifyingOTP(true);
    const resultAction = await dispatch(loginVerify2FA({ userId, token: otpToken }));
    setVerifyingOTP(false);

    if (loginVerify2FA.fulfilled.match(resultAction)) {
      toast.success("Login successful!");
      navigate("/dashboard");
    } else {
      toast.error(resultAction.payload || "Invalid verification code");
    }
  };

  // Google OAuth script initialization
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-login-btn"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (user && !twoFactorRequired) {
      navigate("/dashboard");
    }
  }, [user, navigate, twoFactorRequired]);

  return (
    <div className="auth-page-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {twoFactorRequired ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1" }}>
                <ShieldCheck size={26} />
              </div>
            </div>
            <h2 className="auth-title">Two-Factor Verification</h2>
            <p className="auth-subtitle">Enter the 6-digit code from your authenticator app</p>

            <form onSubmit={handleOTPSubmit} className="auth-form">
              <Input
                label="Verification Code"
                type="text"
                placeholder="e.g. 123456"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />

              <Button 
                type="submit" 
                loading={verifyingOTP} 
                variant="primary"
                style={{ width: "100%", marginTop: "16px" }}
              >
                Verify Code & Login
              </Button>
            </form>

            <button
              onClick={() => {
                setTwoFactorRequired(false);
                setUserId("");
                setOtpToken("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                marginTop: "16px",
                fontSize: "13.5px"
              }}
            >
              Back to credentials login
            </button>
          </>
        ) : (
          <>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Login to connect with local freelancers & clients</p>
            
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="johndoe@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) => validateEmail(e.target.value)}
                error={emailError}
                icon={<Mail size={18} />}
                required
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={(e) => validatePassword(e.target.value)}
                error={passwordError}
                icon={<Lock size={18} />}
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Button 
                type="submit" 
                loading={isLoading} 
                variant="primary"
                className="btn-auth-submit" 
                style={{ width: "100%", marginTop: "12px" }}
                icon={<LogIn size={16} />}
              >
                Login
              </Button>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div style={{ display: "flex", alignItems: "center", margin: "20px 0", width: "100%" }}>
                  <div style={{ flexGrow: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", padding: "0 10px" }}>or continue with</span>
                  <div style={{ flexGrow: 1, height: "1px", background: "var(--border)" }} />
                </div>

                <div id="google-login-btn" style={{ width: "100%", display: "flex", justifyContent: "center" }} />
              </>
            )}
            
            <p className="auth-switch-text" style={{ marginTop: "24px" }}>
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Login;