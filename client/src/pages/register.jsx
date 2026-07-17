import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register, googleLogin } from "../features/auth/authThunks";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, UserCheck, Briefcase, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button, Input } from "../components/ui";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "freelancer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateName = (nameVal) => {
    if (!nameVal) {
      setNameError("Full name is required");
      return "Full name is required";
    } else if (nameVal.trim().length < 2) {
      setNameError("Name must be at least 2 characters long");
      return "Name must be at least 2 characters long";
    } else {
      setNameError("");
      return "";
    }
  };

  const validateEmail = (emailVal) => {
    if (!emailVal) {
      setEmailError("Email address is required");
      return "Email address is required";
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

    if (name === "name") validateName(value);
    if (name === "email") validateEmail(value);
    if (name === "password") validatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameErr = validateName(formData.name);
    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);

    if (nameErr || emailErr || passwordErr) {
      toast.error("Please correct all form errors before registering.");
      return;
    }

    const resultAction = await dispatch(register(formData));
    if (register.fulfilled.match(resultAction)) {
      const payload = resultAction.payload;
      if (payload?.emailVerificationRequired) {
        toast.success(payload.message || "Account created! Verification code sent.");
        navigate("/verify-email", { state: { email: payload.email || formData.email, userId: payload.userId } });
      } else {
        toast.success("Account created successfully!");
        navigate("/profile");
      }
    } else {
      toast.error(typeof resultAction.payload === "string" ? resultAction.payload : resultAction.payload?.message || "Registration failed");
    }
  };

  const handleGoogleCallback = async (response) => {
    const resultAction = await dispatch(
      googleLogin({ credential: response.credential, role: formData.role })
    );
    if (googleLogin.fulfilled.match(resultAction)) {
      toast.success("Google registration / link successful!");
      navigate("/dashboard");
    } else {
      toast.error(resultAction.payload || "Google authentication failed");
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
          document.getElementById("google-register-btn"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [formData.role]); // Reload callback to bind correctly to the selected role

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="auth-page-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ maxWidth: "520px" }}
      >
        <h2 className="auth-title">Get Started</h2>
        <p className="auth-subtitle">Join SkillSphere hyperlocal gig economy today</p>
        
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            onBlur={(e) => validateName(e.target.value)}
            error={nameError}
            icon={<User size={18} />}
            required
          />

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

          <div className="form-group" style={{ textAlign: "left", marginBottom: "20px" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              I want to join as a
            </label>
            <div style={{ position: "relative" }}>
              <Briefcase 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: "14px", 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  color: "var(--text-secondary)",
                  zIndex: 2
                }} 
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select input-field"
                style={{ paddingLeft: "42px" }}
              >
                <option value="freelancer">Freelancer (Provide Services)</option>
                <option value="client">Client (Hire Freelancers)</option>
              </select>
            </div>
          </div>

          <Button 
            type="submit" 
            loading={isLoading} 
            variant="primary"
            style={{ width: "100%", marginTop: "12px" }}
            icon={<UserCheck size={16} />}
          >
            Create Account
          </Button>
        </form>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <>
            <div style={{ display: "flex", alignItems: "center", margin: "20px 0", width: "100%" }}>
              <div style={{ flexGrow: 1, height: "1px", background: "var(--border)" }} />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", padding: "0 10px" }}>or continue with</span>
              <div style={{ flexGrow: 1, height: "1px", background: "var(--border)" }} />
            </div>

            <div id="google-register-btn" style={{ width: "100%", display: "flex", justifyContent: "center" }} />
          </>
        )}
        
        <p className="auth-switch-text" style={{ marginTop: "24px" }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;