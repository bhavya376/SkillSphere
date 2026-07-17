import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { logout } from "../features/auth/authSlice";
import API from "../api";
import toast from "react-hot-toast";
import socket from "../socket";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Menu,
  Sparkles,
  Inbox,
  CreditCard
} from "lucide-react";
import { Button, Avatar } from "./ui";
import { useTheme } from "../context/ThemeContext";

const Navbar = ({ sidebarCollapsed, setSidebarCollapsed, mobileOpen, setMobileOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifications(true);
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications || []);
      
      const countRes = await API.get("/notifications/unread-count");
      setUnreadCount(countRes.data.count || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleNewNotification = (notif) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await API.patch(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await API.patch("/notifications/read-all");
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("clientProfile");
    setDropdownOpen(false);
    navigate("/login");
  };

  return (
    <header 
      className="navbar-header" 
      style={{
        height: "64px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "rgba(var(--surface-rgb), 0.75)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 100,
        boxSizing: "border-box",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)",
        transition: "background-color 0.25s, border-color 0.25s"
      }}
    >
      {/* Brand & Left Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {user && (
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(!mobileOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
              borderRadius: "8px",
              outline: "none",
              transition: "all 0.2s"
            }}
            className="navbar-hamburger-btn"
            title="Toggle Menu"
          >
            <Menu size={18} />
          </button>
        )}
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <div style={{
            background: "var(--accent-grad)",
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "none"
          }}>
            <Sparkles size={14} style={{ color: "#fff" }} />
          </div>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            fontWeight: "800",
            color: "var(--text-primary)",
            letterSpacing: "-0.03em"
          }}>
            Skill<span style={{ color: "var(--accent)" }}>Sphere</span>
          </span>
        </Link>
      </div>

      {/* Search Field (Only shown for authenticated users) */}
      {user && (
        <div 
          className="nav-search-container" 
          style={{ 
            position: "relative", 
            width: "320px",
            display: "flex",
            alignItems: "center"
          }}
        >
          <Search 
            size={14} 
            style={{ 
              position: "absolute", 
              left: "12px", 
              color: searchFocused ? "var(--accent)" : "var(--text-secondary)",
              transition: "color 0.2s"
            }} 
          />
          <input 
            type="text" 
            placeholder="Search hyperlocal gigs..." 
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 34px",
              borderRadius: "8px",
              border: `1px solid ${searchFocused ? "var(--accent)" : "var(--border)"}`,
              background: searchFocused ? "var(--bg)" : "rgba(var(--surface-rgb), 0.4)",
              color: "var(--text-primary)",
              fontSize: "12.5px",
              fontFamily: "var(--font-sans)",
              outline: "none",
              boxShadow: searchFocused ? "0 0 0 3px var(--accent-glow)" : "none",
              transition: "all 0.2s ease-in-out"
            }}
            className="nav-search-input"
          />
          <span style={{
            position: "absolute",
            right: "10px",
            background: "var(--border)",
            color: "var(--text-secondary)",
            fontSize: "9px",
            fontWeight: "700",
            padding: "2px 5px",
            borderRadius: "4px",
            pointerEvents: "none",
            opacity: searchFocused ? 0 : 0.7,
            transition: "opacity 0.15s"
          }}>
            ⌘K
          </span>
        </div>
      )}

      {/* Right Side Control Hub */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        
        {/* Theme Toggle Button */}
        <motion.button 
          onClick={toggleTheme} 
          whileTap={{ scale: 0.95 }}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            cursor: "pointer",
            outline: "none",
            transition: "all 0.2s"
          }}
          className="theme-toggle-btn"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>

        {user ? (
          <>
            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <motion.button 
                onClick={() => { setNotificationsOpen(!notificationsOpen); setDropdownOpen(false); }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  outline: "none",
                  position: "relative"
                }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "6px",
                    height: "6px",
                    background: "var(--accent)",
                    borderRadius: "50%",
                    boxShadow: "0 0 8px var(--accent)"
                  }} />
                )}
              </motion.button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 101 }} onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "40px",
                        width: "320px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                        zIndex: 102,
                        textAlign: "left"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid var(--border)" }}>
                        <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700" }}>Notifications</h4>
                        {unreadCount > 0 && (
                          <span onClick={handleMarkAllAsRead} style={{ fontSize: "10px", color: "var(--accent)", fontWeight: "600", cursor: "pointer" }}>Mark all as read</span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
                        {loadingNotifications ? (
                          <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)", textAlign: "center", padding: "10px" }}>Loading...</p>
                        ) : notifications.length === 0 ? (
                          <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)", textAlign: "center", padding: "16px 8px" }}>No notifications yet</p>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                              style={{ 
                                display: "flex", 
                                gap: "10px", 
                                padding: "8px", 
                                borderRadius: "8px", 
                                background: !notif.isRead ? "rgba(var(--surface-rgb), 0.3)" : "transparent", 
                                cursor: !notif.isRead ? "pointer" : "default",
                                transition: "background 0.2s" 
                              }}
                            >
                              <div style={{ marginTop: "2px" }}>
                                <Inbox size={14} style={{ color: !notif.isRead ? "var(--accent)" : "var(--text-secondary)" }} />
                              </div>
                              <div style={{ flexGrow: 1 }}>
                                <p style={{ margin: "0 0 3px 0", color: "var(--text-primary)", fontSize: "11.5px", lineHeight: "1.4" }}>
                                  <strong style={{ fontWeight: "700", marginRight: "4px" }}>{notif.title}:</strong>
                                  {notif.message}
                                </p>
                                <span style={{ color: "var(--text-secondary)", fontSize: "9.5px" }}>
                                  {new Date(notif.createdAt).toLocaleDateString("en-IN", { month: "short", day: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Trigger */}
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => { setDropdownOpen(!dropdownOpen); setNotificationsOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  padding: "3px 8px 3px 3px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  background: dropdownOpen ? "var(--secondary-bg)" : "rgba(var(--surface-rgb), 0.4)",
                  transition: "all 0.2s"
                }}
                className="nav-profile-trigger"
              >
                <Avatar name={user.name} size="sm" />
                <ChevronDown size={13} style={{ color: "var(--text-secondary)" }} />
              </div>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 101 }} onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "44px",
                        width: "210px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "6px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                        zIndex: 102,
                        textAlign: "left"
                      }}
                    >
                      {/* Dropdown Header user name */}
                      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", marginBottom: "4px" }}>
                        <p style={{ margin: 0, fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", textTransform: "capitalize", fontWeight: "500" }}>{user.role}</span>
                      </div>

                      {/* Menu list options */}
                      <Link to="/profile" style={{ textDecoration: "none" }} onClick={() => setDropdownOpen(false)}>
                        <div className="nav-dropdown-item" style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}>
                          <User size={13} />
                          <span>My Profile</span>
                        </div>
                      </Link>

                      <Link to="/payments" style={{ textDecoration: "none" }} onClick={() => setDropdownOpen(false)}>
                        <div className="nav-dropdown-item" style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}>
                          <CreditCard size={13} />
                          <span>Billing & Payments</span>
                        </div>
                      </Link>

                      <Link to="/settings" style={{ textDecoration: "none" }} onClick={() => setDropdownOpen(false)}>
                        <div className="nav-dropdown-item" style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}>
                          <Settings size={13} />
                          <span>Settings</span>
                        </div>
                      </Link>

                      <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />

                      <div 
                        onClick={handleLogout} 
                        className="nav-dropdown-item" 
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          color: "var(--danger)",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <LogOut size={13} />
                        <span>Logout</span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link to="/login" style={{
              fontSize: "13.5px",
              fontWeight: "600",
              color: "var(--text-secondary)",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              transition: "color 0.2s"
            }} onMouseOver={(e) => e.target.style.color = "var(--text-primary)"} onMouseOut={(e) => e.target.style.color = "var(--text-secondary)"}>
              Login
            </Link>
            <Link to="/register" style={{ textDecoration: "none" }}>
              <Button variant="primary" style={{ padding: "6px 12px", fontSize: "13px" }}>Register</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
