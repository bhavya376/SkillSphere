import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { 
  LayoutDashboard, 
  BriefcaseBusiness, 
  FolderKanban, 
  FileText, 
  ScrollText, 
  MessageSquare, 
  Wallet, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  Menu,
  User
} from "lucide-react";

// 1. Button
export const Button = ({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  loading = false,
  className = "",
  onClick,
  style = {},
  icon,
  ...props
}) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "10px",
    border: "1px solid transparent",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "all 0.2s ease-in-out",
    fontFamily: "var(--font-sans)",
    opacity: disabled || loading ? 0.6 : 1,
    ...style
  };

  const variants = {
    primary: {
      background: "var(--accent)",
      color: "#ffffff",
      boxShadow: "0 4px 12px 0 rgba(37, 99, 235, 0.2)",
      border: "1px solid transparent"
    },
    secondary: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text-primary)",
      boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)"
    },
    success: {
      background: "#10B981",
      color: "#ffffff",
      boxShadow: "0 4px 12px 0 rgba(16, 185, 129, 0.2)",
      border: "1px solid transparent"
    },
    danger: {
      background: "var(--danger)",
      color: "#ffffff",
      boxShadow: "0 4px 12px 0 rgba(239, 68, 68, 0.2)",
      border: "1px solid transparent"
    },
    warning: {
      background: "#F59E0B",
      color: "#ffffff",
      boxShadow: "0 4px 12px 0 rgba(245, 158, 11, 0.2)",
      border: "1px solid transparent"
    },
    outline: {
      background: "transparent",
      border: "1px solid var(--border)",
      color: "var(--text-primary)",
    },
    ghost: {
      background: "transparent",
      border: "1px solid transparent",
      color: "var(--text-primary)",
    }
  };

  const activeVariant = variants[variant] || variants.primary;

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={disabled || loading ? null : onClick}
      style={{ ...baseStyle, ...activeVariant }}
      className={`btn-ui ${className}`}
      whileHover={disabled || loading ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      {...props}
    >
      {loading ? (
        <span className="premium-loader" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
      ) : (
        <>
          {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
};

// 2. Card
export const Card = ({
  children,
  interactive = false,
  className = "",
  style = {},
  onClick,
  ...props
}) => {
  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "24px",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 12px -3px rgba(0, 0, 0, 0.03)",
    boxSizing: "border-box",
    cursor: onClick || interactive ? "pointer" : "default",
    ...style
  };

  return (
    <motion.div
      style={cardStyle}
      onClick={onClick}
      className={`card-ui ${className}`}
      whileHover={onClick || interactive ? { 
        y: -4, 
        borderColor: "var(--accent)", 
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)" 
      } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// 3. SectionTitle
export const SectionTitle = ({ title, subtitle, actions }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
      <div style={{ textAlign: "left" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 6px 0", letterSpacing: "-0.03em" }}>{title}</h2>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14.5px" }}>{subtitle}</p>
      </div>
      {actions && <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>{actions}</div>}
    </div>
  );
};

// 4. Badge
export const Badge = ({
  children,
  variant = "progress",
  className = "",
  style = {},
  ...props
}) => {
  const baseBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "9999px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    fontFamily: "var(--font-sans)",
    ...style
  };

  const badgeVariants = {
    open: {
      background: "rgba(16, 185, 129, 0.1)",
      color: "#10B981",
      border: "1px solid rgba(16, 185, 129, 0.2)"
    },
    progress: {
      background: "rgba(37, 99, 235, 0.1)",
      color: "var(--accent)",
      border: "1px solid rgba(37, 99, 235, 0.2)"
    },
    completed: {
      background: "rgba(16, 185, 129, 0.1)",
      color: "#10B981",
      border: "1px solid rgba(16, 185, 129, 0.2)"
    },
    cancelled: {
      background: "rgba(239, 68, 68, 0.1)",
      color: "var(--danger)",
      border: "1px solid rgba(239, 68, 68, 0.2)"
    },
    pending: {
      background: "rgba(245, 158, 11, 0.1)",
      color: "#F59E0B",
      border: "1px solid rgba(245, 158, 11, 0.2)"
    },
    rejected: {
      background: "rgba(239, 68, 68, 0.1)",
      color: "var(--danger)",
      border: "1px solid rgba(239, 68, 68, 0.2)"
    },
    active: {
      background: "rgba(37, 99, 235, 0.1)",
      color: "var(--accent)",
      border: "1px solid rgba(37, 99, 235, 0.2)"
    },
    featured: {
      background: "rgba(139, 92, 246, 0.1)",
      color: "#8B5CF6",
      border: "1px solid rgba(139, 92, 246, 0.2)"
    }
  };

  const activeVariant = badgeVariants[variant] || badgeVariants.progress;

  return (
    <span style={{ ...baseBadgeStyle, ...activeVariant }} className={`badge-ui ${className}`} {...props}>
      {children}
    </span>
  );
};

// 5. StatCard
export const StatCard = ({
  title,
  value,
  icon,
  description,
  trend,
  className = "",
  style = {},
  iconColor,
  iconBg,
  ...props
}) => {
  return (
    <Card className={`stat-card-ui ${className}`} style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "start", ...style }} {...props}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }}>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </span>
        <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          {value}
        </h3>
        {description && (
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {description}
          </span>
        )}
        {trend && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", marginTop: "4px" }}>
            <span style={{ color: trend.type === "up" ? "var(--success)" : "var(--danger)", fontWeight: "700" }}>
              {trend.type === "up" ? "↑" : "↓"} {trend.value}
            </span>
            <span style={{ color: "var(--text-secondary)" }}>vs last month</span>
          </div>
        )}
      </div>
      {icon && (
        <div style={{
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          background: iconBg || "var(--bg)",
          border: iconBg ? "1px solid transparent" : "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconColor || "var(--accent)",
          flexShrink: 0
        }}>
          {icon}
        </div>
      )}
    </Card>
  );
};

// 4. Input
export const Input = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  icon,
  suffix,
  required = false,
  className = "",
  style = {},
  ...props
}) => {
  const [focused, setFocused] = React.useState(false);

  const handleFocus = (e) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: "20px", width: "100%", textAlign: "left", ...style }}>
      {label && (
        <label 
          className="form-label" 
          style={{ 
            display: "block", 
            fontSize: "12px", 
            fontWeight: "600", 
            color: error ? "var(--danger)" : (focused ? "var(--accent)" : "var(--text-secondary)"), 
            textTransform: "uppercase", 
            letterSpacing: "0.05em", 
            marginBottom: "8px",
            transition: "color 0.2s"
          }}
        >
          {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && (
          <div style={{ position: "absolute", left: "14px", color: focused ? "var(--accent)" : "var(--text-secondary)", display: "flex", alignItems: "center", pointerEvents: "none", zIndex: 2, transition: "color 0.2s" }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="input-field"
          style={{
            width: "100%",
            background: "var(--bg)",
            border: `1px solid ${error ? "var(--danger)" : (focused ? "var(--accent)" : "var(--border)")}`,
            color: "var(--text-primary)",
            borderRadius: "10px",
            padding: "12px 14px",
            paddingLeft: icon ? "42px" : "14px",
            paddingRight: suffix ? "42px" : "14px",
            fontSize: "14px",
            fontFamily: "var(--font-sans)",
            transition: "all 0.2s ease-in-out",
            boxShadow: focused ? "0 0 0 3px var(--accent-glow)" : "none",
            boxSizing: "border-box",
            outline: "none"
          }}
          required={required}
          {...props}
        />
        {suffix && (
          <div style={{ position: "absolute", right: "12px", display: "flex", alignItems: "center", zIndex: 2 }}>
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <span className="form-validation-error" style={{ color: "var(--danger)", fontSize: "12px", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
          <AlertCircle size={12} />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
};



// 6. Modal
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  maxWidth = "480px"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "28px",
              width: "100%",
              maxWidth,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              position: "relative",
              zIndex: 10000,
              boxSizing: "border-box"
            }}
            className={`modal-ui ${className}`}
          >
            {title && (
              <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 20px 0", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                right: "20px",
                top: "20px",
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px"
              }}
              title="Close modal"
            >
              ✕
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 7. Loader
export const Loader = ({ size = "24px", style = {}, className = "" }) => {
  return (
    <div
      className={`premium-loader ${className}`}
      style={{
        width: size,
        height: size,
        border: "2px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        ...style
      }}
    />
  );
};

// 8. Skeleton
export const Skeleton = ({ width = "100%", height = "16px", style = {}, className = "" }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: "6px",
        background: "var(--border)",
        opacity: 0.5,
        ...style
      }}
    />
  );
};



// 10. Avatar
export const Avatar = ({ name, size = "md", src, className = "", style = {} }) => {
  const getInitials = (n) => {
    if (!n) return "?";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const sizes = {
    xs: { width: "24px", height: "24px", fontSize: "10px" },
    sm: { width: "32px", height: "32px", fontSize: "12px" },
    md: { width: "42px", height: "42px", fontSize: "14px" },
    lg: { width: "56px", height: "56px", fontSize: "18px" },
    xl: { width: "80px", height: "80px", fontSize: "24px" }
  };

  const activeSize = sizes[size] || sizes.md;

  return (
    <div
      style={{
        width: activeSize.width,
        height: activeSize.height,
        borderRadius: "50%",
        background: "var(--accent-grad)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: activeSize.fontSize,
        border: "2px solid var(--border)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        overflow: "hidden",
        position: "relative",
        boxSizing: "border-box",
        ...style
      }}
      className={`avatar-ui ${className}`}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

// 11. Sidebar
export const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && mobileOpen) setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("clientProfile");
    if (setMobileOpen) setMobileOpen(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { name: "Dashboard",   path: "/dashboard",  icon: LayoutDashboard },
    { name: "Marketplace", path: "/marketplace", icon: BriefcaseBusiness },
    { name: "My Gigs",     path: "/dashboard",  icon: FolderKanban },
    { name: "Proposals",   path: "/dashboard",  icon: FileText },
    { name: "Contracts",   path: "/contracts",  icon: ScrollText },
    { name: "Messages",    path: "/chat",        icon: MessageSquare },
    { name: "Payments",    path: "/payments",    icon: Wallet },
    { name: "Profile",     path: "/profile",     icon: User },
    ...(user?.role === "admin" ? [{ name: "Analytics", path: "/admin", icon: BarChart3 }] : []),
    { name: "Settings",    path: "/settings",   icon: Settings },
  ];

  // ── Shared menu content ─────────────────────────────────────────────────
  const MenuContent = ({ forceExpanded = false }) => {
    const showLabels = forceExpanded || !collapsed;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Mobile header with logo + close */}
        {forceExpanded && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px 14px", borderBottom: "1px solid var(--border)",
          }}>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: "800",
              color: "var(--text-primary)", letterSpacing: "-0.03em",
            }}>
              Skill<span style={{ color: "var(--accent)" }}>Sphere</span>
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                background: "none", border: "none", color: "var(--text-secondary)",
                cursor: "pointer", padding: "4px", display: "flex", borderRadius: "6px",
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", overflowX: "hidden" }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <div key={item.name} style={{ position: "relative" }}>
                <Link
                  to={item.path}
                  style={{ textDecoration: "none", display: "block" }}
                  onClick={() => { if (forceExpanded && setMobileOpen) setMobileOpen(false); }}
                >
                  <motion.div
                    whileHover={!active ? {
                      y: -2,
                      backgroundColor: "rgba(100, 116, 139, 0.08)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                    } : {}}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      marginBottom: "4px",
                      background: active
                        ? "var(--secondary-bg)"
                        : "transparent",
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: active ? "600" : "500",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                      boxShadow: "none",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box"
                    }}
                  >
                    <Icon
                      size={20}
                      style={{
                        flexShrink: 0,
                        color: "currentColor",
                        transition: "color 0.2s",
                      }}
                    />

                    <AnimatePresence initial={false}>
                      {showLabels && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden", display: "block", color: active ? "var(--text-primary)" : "inherit" }}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>

                {/* Tooltip — only when desktop-collapsed */}
                {!showLabels && (
                  <div style={{
                    position: "absolute",
                    left: "calc(100% + 10px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    padding: "5px 10px",
                    borderRadius: "7px",
                    fontSize: "12px",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    pointerEvents: "none",
                    opacity: 0,
                    zIndex: 999,
                    transition: "opacity 0.15s ease",
                  }} className="sidebar-item-tooltip">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer: User profile and logout */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 12px" }}>
          {showLabels ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                <Avatar name={user?.name} size="sm" style={{ border: "1.5px solid var(--border)" }} />
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.name || "User Name"}
                  </span>
                  <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.email || "user@example.com"}
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(239,68,68,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--danger)",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
                title="Logout"
              >
                <LogOut size={16} />
              </motion.button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
              <div className="sidebar-menu-item" style={{ position: "relative" }}>
                <Avatar name={user?.name} size="sm" style={{ border: "1.5px solid var(--border)" }} />
                <div style={{
                  position: "absolute",
                  left: "calc(100% + 10px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  padding: "6px 12px",
                  borderRadius: "7px",
                  fontSize: "11.5px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  pointerEvents: "none",
                  opacity: 0,
                  zIndex: 999,
                  transition: "opacity 0.15s ease",
                }} className="sidebar-item-tooltip">
                  <div style={{ fontWeight: "700" }}>{user?.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "500" }}>{user?.email}</div>
                </div>
              </div>
              
              <div className="sidebar-menu-item" style={{ position: "relative" }}>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(239,68,68,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--danger)",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <LogOut size={20} />
                </motion.button>
                <div style={{
                  position: "absolute",
                  left: "calc(100% + 10px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--danger)",
                  padding: "5px 10px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  pointerEvents: "none",
                  opacity: 0,
                  zIndex: 999,
                  transition: "opacity 0.15s ease",
                }} className="sidebar-item-tooltip">
                  Logout
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Mobile: off-canvas drawer ─────────────────────────────────────────
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 998,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(3px)",
              }}
            />
            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "fixed",
                top: 0, left: 0, bottom: 0,
                width: "260px",
                zIndex: 999,
                background: "var(--surface)",
                borderRight: "1px solid var(--border)",
                boxShadow: "8px 0 32px rgba(0,0,0,0.2)",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <MenuContent forceExpanded={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // ── Desktop: sticky sidebar, collapses to 78px ─────────────────────────
  return (
    <motion.aside
      animate={{ width: collapsed ? 78 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "sticky",
        top: "70px",
        height: "calc(100vh - 70px)",
        flexShrink: 0,
        zIndex: 90,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        overflowX: "hidden",
        overflowY: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 20px rgba(0,0,0,0.06)",
      }}
    >
      <MenuContent forceExpanded={false} />
    </motion.aside>
  );
};
