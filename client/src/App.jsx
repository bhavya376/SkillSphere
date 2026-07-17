import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMe } from "./features/auth/authThunks";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import { PageLoader } from "./components/SkeletonLoaders";
import { Sidebar } from "./components/ui";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Lazy-load page components
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/login"));
const Register = lazy(() => import("./pages/register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Profile = lazy(() => import("./pages/Profile"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Chat = lazy(() => import("./pages/Chat"));
const Payments = lazy(() => import("./pages/Payments"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  
  // Collapsible Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
  }, [dispatch, token, user]);

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      {/* Dynamic layout wrapper containing collapsible sidebar */}
      <div className="app-container" style={{ display: "flex", minHeight: "100vh" }}>
        {user && (
          <Sidebar 
            collapsed={sidebarCollapsed} 
            setCollapsed={setSidebarCollapsed} 
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
        )}
        
        <main 
          className={`main-content ${user ? (sidebarCollapsed ? "sidebar-collapsed" : "sidebar-open") : "no-sidebar"}`}
          style={{
            flexGrow: 1,
            padding: "32px",
            boxSizing: "border-box",
            marginTop: "70px",
            minWidth: 0
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              
              {/* Authenticated user routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              
              {/* Admin dashboard protection route */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;