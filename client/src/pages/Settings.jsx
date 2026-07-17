import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  CreditCard,
  Sun,
  Moon,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { Card, Button, Input, SectionTitle } from "../components/ui";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import API from "../api";
import { getMe } from "../features/auth/authThunks";

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company: "",
    location: "",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailProposals: true,
    emailMilestones: true,
    smsAlerts: false,
    marketingUpdates: false
  });

  // 2FA local states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);

  // Access global theme context
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(user.twoFactorEnabled || false);
    }
  }, [user]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    toast.success("Profile credentials updated successfully!");
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    toast.success("Password updated successfully!");
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const toggleNotification = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 2FA Setup
  const handleStart2FASetup = async () => {
    try {
      setLoading2FA(true);
      const res = await API.post("/auth/2fa/setup");
      setQrCode(res.data.qrCode);
      setSecretKey(res.data.secret);
      setIsSettingUp(true);
      setOtpToken("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate 2FA setup");
    } finally {
      setLoading2FA(false);
    }
  };

  const handleVerify2FASetup = async (e) => {
    e.preventDefault();
    if (!otpToken) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }

    try {
      setLoading2FA(true);
      const res = await API.post("/auth/2fa/verify", { token: otpToken });
      if (res.data.success) {
        toast.success("Two-Factor Authentication enabled successfully!");
        setTwoFactorEnabled(true);
        setIsSettingUp(false);
        setOtpToken("");
        dispatch(getMe());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP verification code");
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!otpToken) {
      toast.error("Please enter OTP code to verify disabling");
      return;
    }

    try {
      setLoading2FA(true);
      const res = await API.post("/auth/2fa/disable", { token: otpToken });
      if (res.data.success) {
        toast.success("Two-Factor Authentication disabled.");
        setTwoFactorEnabled(false);
        setOtpToken("");
        dispatch(getMe());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP code");
    } finally {
      setLoading2FA(false);
    }
  };

  return (
    <div className="settings-page-root" style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "left" }}>
      <SectionTitle
        title="Settings & Preferences"
        subtitle="Manage account credentials, set notification thresholds, and modify theme settings."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" }}>
        {/* Left Side: Sidebar controls & Theme */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Theme Preference Option */}
          <Card>
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              {theme === "dark" ? <Moon size={16} style={{ color: "var(--accent)" }} /> : <Sun size={16} style={{ color: "var(--accent)" }} />}
              <span>App Color Theme</span>
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div 
                onClick={() => setTheme("dark")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: theme === "dark" ? "rgba(37,99,235,0.08)" : "transparent",
                  border: `1px solid ${theme === "dark" ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer"
                }}
              >
                <span style={{ fontSize: "13.5px", fontWeight: theme === "dark" ? "700" : "500" }}>Dark Mode</span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Linear Premium</span>
              </div>

              <div 
                onClick={() => setTheme("light")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: theme === "light" ? "rgba(37,99,235,0.08)" : "transparent",
                  border: `1px solid ${theme === "light" ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer"
                }}
              >
                <span style={{ fontSize: "13.5px", fontWeight: theme === "light" ? "700" : "500" }}>Light Mode</span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>High Contrast</span>
              </div>
            </div>
          </Card>

          {/* Email Notification Checklist */}
          <Card>
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={16} style={{ color: "var(--accent)" }} />
              <span>Notification Alerts</span>
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13.5px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={notificationSettings.emailProposals} 
                  onChange={() => toggleNotification("emailProposals")}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span>Email on new Proposals</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={notificationSettings.emailMilestones} 
                  onChange={() => toggleNotification("emailMilestones")}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span>Email on Escrow Milestones</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={notificationSettings.smsAlerts} 
                  onChange={() => toggleNotification("smsAlerts")}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span>SMS on contract updates</span>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Side: Account Forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Account Details Form */}
          <Card>
            <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} style={{ color: "var(--accent)" }} />
              <span>Profile Credentials</span>
            </h3>
            
            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Input
                  label="Display Name *"
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address *"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Input
                  label="Company Name"
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                />
                <Input
                  label="Location"
                  type="text"
                  placeholder="e.g. Austin, TX"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                />
              </div>
              <Button type="submit" variant="primary" style={{ marginTop: "8px" }}>
                Save Profile Changes
              </Button>
            </form>
          </Card>

          {/* Password Security Form */}
          <Card>
            <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={18} style={{ color: "var(--accent)" }} />
              <span>Security Credentials</span>
            </h3>
            
            <form onSubmit={handleSecuritySubmit}>
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={securityForm.currentPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                />
              </div>
              <Button type="submit" variant="secondary" style={{ marginTop: "8px" }}>
                Update Password Key
              </Button>
            </form>
          </Card>

          {/* Two-Factor Authentication Card */}
          <Card>
            <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} style={{ color: "var(--success)" }} />
              <span>Two-Factor Authentication (2FA)</span>
            </h3>

            {!twoFactorEnabled && !isSettingUp && (
              <div>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                  Protect your SkillSphere account with an extra layer of security. Once enabled, you will be prompted for a TOTP validation token from your authenticator app (Google Authenticator, Duo, Microsoft Authenticator, etc.) whenever you login.
                </p>
                <Button onClick={handleStart2FASetup} loading={loading2FA} variant="primary">
                  Enable Two-Factor Authentication
                </Button>
              </div>
            )}

            {!twoFactorEnabled && isSettingUp && (
              <div>
                <p style={{ fontSize: "13.5px", color: "var(--text-primary)", margin: "0 0 16px 0", fontWeight: "600" }}>
                  1. Scan the QR code below using your authenticator app:
                </p>
                <div style={{ background: "#fff", padding: "16px", display: "inline-block", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "16px" }}>
                  {qrCode && <img src={qrCode} alt="2FA Scan QR" style={{ display: "block", width: "180px", height: "180px" }} />}
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
                  Or enter the text key manually: <code style={{ background: "rgba(var(--surface-rgb), 0.3)", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>{secretKey}</code>
                </p>
                <p style={{ fontSize: "13.5px", color: "var(--text-primary)", margin: "0 0 12px 0", fontWeight: "600" }}>
                  2. Enter the 6-digit OTP code to verify and enable:
                </p>
                <form onSubmit={handleVerify2FASetup} style={{ display: "flex", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
                  <div style={{ flexGrow: 1, maxWidth: "240px" }}>
                    <Input
                      label="OTP Code"
                      type="text"
                      placeholder="e.g. 123456"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px", height: "42px", marginTop: "8px" }}>
                    <Button type="submit" loading={loading2FA} variant="primary">
                      Verify & Enable
                    </Button>
                    <Button type="button" onClick={() => setIsSettingUp(false)} variant="secondary">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {twoFactorEnabled && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--success)", fontWeight: "bold", fontSize: "14.5px", marginBottom: "12px" }}>
                  <ShieldCheck size={18} />
                  <span>Two-Factor Authentication is Active</span>
                </div>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: "0 0 20px 0", lineHeight: "1.5" }}>
                  Your account is protected by TOTP verification. To disable 2FA, please enter your current authenticator code below.
                </p>
                <form onSubmit={handleDisable2FA} style={{ display: "flex", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
                  <div style={{ flexGrow: 1, maxWidth: "240px" }}>
                    <Input
                      label="Current OTP Code"
                      type="text"
                      placeholder="e.g. 123456"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                    />
                  </div>
                  <Button type="submit" loading={loading2FA} variant="danger" style={{ height: "42px", marginTop: "8px" }}>
                    Disable 2FA
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
