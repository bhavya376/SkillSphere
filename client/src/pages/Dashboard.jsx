import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusCircle, 
  Search, 
  User, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  AlertCircle,
  Plus,
  Coins,
  ArrowRight,
  MapPin,
  Clock,
  IndianRupee,
  Sparkles,
  CreditCard,
  Wallet,
  Edit3,
  Trash2
} from "lucide-react";
import { StatsSkeleton, GigCardsSkeleton, Shimmer } from "../components/SkeletonLoaders";
import { Button, Card, StatCard, Input, Badge, Modal, SectionTitle } from "../components/ui";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Post Gig state
  const [showPostForm, setShowPostForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [newGig, setNewGig] = useState({
    title: "",
    description: "",
    category: "",
    skills: "",
    budget: "",
    duration: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [editingGigId, setEditingGigId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const checkProfileAndFetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(false);
      
      // Freelancer profile loading
      if (user.role === "freelancer") {
        try {
          const res = await API.get("/freelancers/me");
          setProfile(res.data.profile);
        } catch (err) {
          if (err.response?.status === 404) {
            setProfile(null);
          } else {
            console.error("Error loading freelancer profile:", err);
          }
        }
      } else if (user.role === "client") {
        try {
          const res = await API.get("/clients/me");
          setProfile(res.data.client);
        } catch (err) {
          if (err.response?.status === 404) {
            setProfile(null);
          } else {
            console.error("Error loading client profile:", err);
          }
        }
      }
      setProfileChecked(true);

      // Fetch Gigs, Proposals, and Contracts
      const gigsRes = await API.get("/gigs");
      setGigs(gigsRes.data.gigs);

      if (user.role === "client") {
        const myGig = gigsRes.data.gigs.find((g) => g.client?.user?._id === user._id || g.client?.user === user._id);
        if (myGig && myGig.client) {
          setProfile(myGig.client);
        }
      }

      const proposalsRes = await API.get("/proposals");
      setProposals(proposalsRes.data.proposals);

      const contractsRes = await API.get("/contracts");
      setContracts(contractsRes.data.contracts);

      if (user.role === "freelancer") {
        try {
          setLoadingRecommendations(true);
          const recRes = await API.get("/recommendations");
          setRecommendations(recRes.data.recommendations || []);
          setProfileIncomplete(recRes.data.profileIncomplete || false);
        } catch (recErr) {
          console.error("Error loading recommendations:", recErr);
        } finally {
          setLoadingRecommendations(false);
        }
      }

      try {
        const conversationsRes = await API.get("/chat/conversations");
        setConversations(conversationsRes.data.conversations || []);
      } catch (chatErr) {
        console.error("Error fetching conversations in dashboard:", chatErr);
      }

    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "admin") {
      navigate("/admin");
      return;
    }
    checkProfileAndFetchData();
  }, [user, navigate]);

  const validatePostGigField = (name, value) => {
    let error = "";
    if (name === "title" && !value.trim()) {
      error = "Job Title is required";
    }
    if (name === "category" && !value) {
      error = "Category is required";
    }
    if (name === "budget" && (!value || Number(value) <= 0)) {
      error = "Budget must be a positive number greater than 0";
    }
    if (name === "duration" && (!value || Number(value) <= 0)) {
      error = "Duration must be a positive number greater than 0";
    }
    if (name === "description" && !value.trim()) {
      error = "Detailed Description is required";
    } else if (name === "description" && value.trim().length < 20) {
      error = "Description must be at least 20 characters long";
    }

    setFormErrors((prev) => ({
      ...prev,
      [name]: error
    }));
    return error;
  };

  const handlePostGigChange = (e) => {
    const { name, value } = e.target;
    setNewGig({
      ...newGig,
      [name]: value,
    });
    validatePostGigField(name, value);
  };

  const handlePostGigSubmit = async (e) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Please set up your Client Profile first!");
      navigate("/profile");
      return;
    }

    // Local validation check on all fields
    const tErr = validatePostGigField("title", newGig.title);
    const cErr = validatePostGigField("category", newGig.category);
    const bErr = validatePostGigField("budget", newGig.budget);
    const dErr = validatePostGigField("duration", newGig.duration);
    const descErr = validatePostGigField("description", newGig.description);

    if (tErr || cErr || bErr || dErr || descErr) {
      toast.error("Please fix all form validation errors");
      return;
    }

    try {
      setPosting(true);
      const formattedSkills = newGig.skills.split(",").map((s) => s.trim()).filter((s) => s);
      const payload = {
        ...newGig,
        skills: formattedSkills,
        budget: Number(newGig.budget),
        duration: Number(newGig.duration),
      };

      if (editingGigId) {
        const res = await API.put(`/gigs/${editingGigId}`, payload);
        if (res.data.success) {
          toast.success("Gig updated successfully!");
          setGigs(gigs.map((g) => (g._id === editingGigId ? res.data.gig : g)));
          setNewGig({
            title: "",
            description: "",
            category: "",
            skills: "",
            budget: "",
            duration: "",
          });
          setFormErrors({});
          setEditingGigId(null);
          setShowPostForm(false);
        }
      } else {
        const res = await API.post("/gigs", payload);
        if (res.data.success) {
          toast.success("Job posted successfully!");
          setGigs([res.data.job, ...gigs]);
          setNewGig({
            title: "",
            description: "",
            category: "",
            skills: "",
            budget: "",
            duration: "",
          });
          setFormErrors({});
          setShowPostForm(false);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save gig");
    } finally {
      setPosting(false);
    }
  };

  const handleEditGigClick = (gig) => {
    setEditingGigId(gig._id);
    setNewGig({
      title: gig.title,
      description: gig.description,
      category: gig.category,
      skills: gig.skills ? gig.skills.join(", ") : "",
      budget: gig.budget.toString(),
      duration: gig.duration.toString(),
    });
    setShowPostForm(true);
  };

  const handleDeleteGigClick = async (gigId) => {
    if (window.confirm("Are you sure you want to delete this gig? This action cannot be undone.")) {
      try {
        const res = await API.delete(`/gigs/${gigId}`);
        if (res.data.success) {
          toast.success("Gig deleted successfully!");
          setGigs(gigs.filter((g) => g._id !== gigId));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete gig");
      }
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    try {
      const res = await API.patch(`/proposals/${proposalId}/accept`);
      if (res.data.success) {
        toast.success("Proposal accepted! Establishing contract...");
        // Auto create contract
        const contractRes = await API.post("/contracts", {
          proposalId,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        });
        if (contractRes.data.success) {
          toast.success("Milestone Contract created!");
          navigate("/contracts");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept proposal");
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      const res = await API.patch(`/proposals/${proposalId}/reject`);
      if (res.data.success) {
        toast.success("Proposal rejected successfully!");
        setProposals(proposals.map((p) => p._id === proposalId ? { ...p, status: "Rejected" } : p));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject proposal");
    }
  };

  const handleWithdrawProposal = async (proposalId) => {
    if (window.confirm("Are you sure you want to withdraw this proposal?")) {
      try {
        const res = await API.delete(`/proposals/${proposalId}`);
        if (res.data.success) {
          toast.success("Proposal withdrawn successfully!");
          setProposals(proposals.filter((p) => p._id !== proposalId));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to withdraw proposal");
      }
    }
  };

  if (error) {
    return (
      <div className="dashboard-container" style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Card style={{ maxWidth: "460px", padding: "32px", textAlign: "center" }}>
          <AlertCircle size={48} style={{ color: "var(--danger)", marginBottom: "16px" }} />
          <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Network Connection Issue</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
            We had trouble reaching the SkillSphere indexing API. Please check your network connectivity.
          </p>
          <button onClick={checkProfileAndFetchData} className="btn btn-primary" style={{ display: "inline-flex", gap: "8px" }}>
            <RefreshCw size={14} />
            <span>Retry Connection</span>
          </button>
        </Card>
      </div>
    );
  }

  // Filter lists
  const myGigs = user?.role === "client"
    ? gigs.filter((g) => g.client?.user?._id === user._id || g.client?.user === user._id)
    : [];

  const myProposals = user?.role === "freelancer"
    ? proposals.filter((p) => p.freelancer?.user?._id === user._id || p.freelancer?.user === user._id)
    : [];

  const incomingProposals = user?.role === "client"
    ? proposals.filter((p) => (p.gig?.client?.user?._id === user._id || p.gig?.client?.user === user._id) && p.status === "Pending")
    : [];

  const myActiveContracts = contracts.filter((c) =>
    (user?.role === "client" && (c.client?.user?._id === user._id || c.client?.user === user._id)) ||
    (user?.role === "freelancer" && (c.freelancer?.user?._id === user._id || c.freelancer?.user === user._id))
  );

  // Dynamic activities log compilation
  const recentActivities = [];
  if (user) {
    myActiveContracts.slice(0, 3).forEach((c) => {
      recentActivities.push({
        id: `c-${c._id}`,
        text: `Active contract for "${c.gig?.title || "Hyperlocal Project"}" is ${c.status.toLowerCase()}`,
        time: new Date(c.startDate).toLocaleDateString(),
        icon: <FileText size={14} />
      });
    });

    if (user.role === "client") {
      myGigs.slice(0, 2).forEach((g) => {
        recentActivities.push({
          id: `g-${g._id}`,
          text: `You posted hyperlocal opportunity "${g.title}"`,
          time: new Date(g.createdAt || Date.now()).toLocaleDateString(),
          icon: <Briefcase size={14} />
        });
      });
      incomingProposals.slice(0, 2).forEach((p) => {
        recentActivities.push({
          id: `p-${p._id}`,
          text: `Received proposal bidding ₹${p.proposedBudget?.toLocaleString("en-IN")} from ${p.freelancer?.user?.name || "Freelancer"}`,
          time: new Date(p.createdAt || Date.now()).toLocaleDateString(),
          icon: <User size={14} />
        });
      });
    } else {
      myProposals.slice(0, 3).forEach((p) => {
        recentActivities.push({
          id: `p-${p._id}`,
          text: `You placed a bid of ₹${p.proposedBudget?.toLocaleString("en-IN")} on "${p.gig?.title}"`,
          time: new Date(p.createdAt || Date.now()).toLocaleDateString(),
          icon: <TrendingUp size={14} />
        });
      });
    }
  }

  // Sort activities by time descending
  recentActivities.sort((a, b) => b.id.localeCompare(a.id));
  const latestActivities = recentActivities.slice(0, 5);

  const isDashboardEmpty = profileChecked && myActiveContracts.length === 0 && (
    user?.role === "client" ? myGigs.length === 0 : myProposals.length === 0
  );

  const [walletBalance] = useState(() => Number(localStorage.getItem("walletBalance") || 0));

  const activeGigsCount = myGigs.filter(g => g.status === "Open" || g.status === "Active").length;
  const activeContractsCount = myActiveContracts.filter(c => c.status === "Active").length;
  const pendingProposalsCount = incomingProposals.length;

  if (user?.role === "client") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="dashboard-container"
        style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "1200px", margin: "0 auto", padding: "16px 0 48px 0" }}
      >
        {/* Onboarding Profile Warning */}
        {profileChecked && !profile && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ borderLeft: "4px solid var(--danger)", background: "rgba(239, 68, 68, 0.04)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ textAlign: "left" }}>
                <h3 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontSize: "15px", fontWeight: "700" }}>Account Profile Incomplete</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Please configure your client profile details to join the hyperlocal marketplace.</p>
              </div>
              <Link to="/profile" style={{ textDecoration: "none" }}>
                <Button variant="primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                  Set Up Profile
                </Button>
              </Link>
            </Card>
          </motion.div>
        )}

        {/* Welcome Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", textAlign: "left" }}>
          <div>
            <h1 style={{ margin: "0 0 6px 0", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
              Welcome back, {user?.name}
            </h1>
            <p style={{ margin: 0, fontSize: "14.5px", color: "var(--text-secondary)" }}>
              Review proposals, fund escrows, and coordinate with hyperlocal talent for your projects.
            </p>
          </div>
          <Button onClick={() => setShowPostForm(!showPostForm)} variant="primary" icon={<Plus size={15} />}>
            {showPostForm ? "Close Form" : "Post a New Gig"}
          </Button>
        </div>

        {/* Collapsible Post Gig Form */}
        <AnimatePresence>
          {showPostForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <Card style={{ padding: "24px" }}>
                <SectionTitle 
                  title={editingGigId ? "Edit Gig Opportunity" : "Post an Open Opportunity"} 
                  subtitle={editingGigId ? "Update your job requirements and details." : "Hire local neighborhood talent quickly with milestone escrows."}
                  style={{ marginBottom: "20px" }}
                />
                
                <form onSubmit={handlePostGigSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                    <Input
                      label="Job Title *"
                      type="text"
                      name="title"
                      placeholder="e.g. React Developer for Cafe Site"
                      value={newGig.title}
                      onChange={handlePostGigChange}
                      onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                      error={formErrors.title}
                      required
                    />

                    <div className="form-group" style={{ textAlign: "left", marginBottom: "20px" }}>
                      <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                        Category *
                      </label>
                      <select
                        name="category"
                        value={newGig.category}
                        onChange={handlePostGigChange}
                        onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                        className="input-field form-select"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile Apps">Mobile Apps</option>
                        <option value="Design & Creative">Design & Creative</option>
                        <option value="Writing & Translation">Writing & Translation</option>
                        <option value="Marketing & Sales">Marketing & Sales</option>
                        <option value="Local Services">Local Services</option>
                      </select>
                      {formErrors.category && <span className="form-validation-error">{formErrors.category}</span>}
                    </div>

                    <Input
                      label="Budget (INR) *"
                      type="number"
                      name="budget"
                      placeholder="Budget in ₹"
                      value={newGig.budget}
                      onChange={handlePostGigChange}
                      onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                      error={formErrors.budget}
                      icon={<IndianRupee size={16} />}
                      required
                    />

                    <Input
                      label="Duration (days) *"
                      type="number"
                      name="duration"
                      placeholder="Estimated completion days"
                      value={newGig.duration}
                      onChange={handlePostGigChange}
                      onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                      error={formErrors.duration}
                      icon={<Clock size={16} />}
                      required
                    />
                  </div>

                  <Input
                    label="Skills Required (comma separated) *"
                    type="text"
                    name="skills"
                    placeholder="e.g. React, Node, CSS, Gardening"
                    value={newGig.skills}
                    onChange={handlePostGigChange}
                  />

                  <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
                    <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                      Detailed Scope of Work *
                    </label>
                    <textarea
                      name="description"
                      placeholder="Describe project deliverables, milestones, requirements..."
                      value={newGig.description}
                      onChange={handlePostGigChange}
                      onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                      className="form-textarea input-field"
                      style={{ minHeight: "100px", padding: "12px", borderRadius: "10px" }}
                      required
                    />
                    {formErrors.description && <span className="form-validation-error">{formErrors.description}</span>}
                  </div>

                   <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <Button type="submit" loading={posting} icon={<PlusCircle size={14} />}>
                      {editingGigId ? "Save Changes" : "Post Job"}
                    </Button>
                    {editingGigId && (
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => {
                          setEditingGigId(null);
                          setNewGig({ title: "", description: "", category: "", skills: "", budget: "", duration: "" });
                          setShowPostForm(false);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4 Statistic Cards */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "8px" }}>
            <StatCard
              title="Active Gigs"
              value={activeGigsCount}
              icon={<Briefcase size={20} />}
              iconColor="#06B6D4"
              iconBg="rgba(6, 182, 212, 0.1)"
            />
            <StatCard
              title="Active Contracts"
              value={activeContractsCount}
              icon={<FileText size={20} />}
              iconColor="#3B82F6"
              iconBg="rgba(59, 130, 246, 0.1)"
            />
            <StatCard
              title="Pending Proposals"
              value={pendingProposalsCount}
              icon={<TrendingUp size={20} />}
              iconColor="#6366F1"
              iconBg="rgba(99, 102, 241, 0.1)"
            />
            <StatCard
              title="Wallet Balance"
              value={`₹${walletBalance.toLocaleString("en-IN")}`}
              icon={<Wallet size={20} />}
              iconColor="#10B981"
              iconBg="rgba(16, 185, 129, 0.1)"
            />
          </div>
        )}

        {/* Below that layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "32px", marginTop: "12px" }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Latest Posted Gigs */}
            <Card style={{ textAlign: "left" }}>
              <SectionTitle 
                title="Latest Posted Gigs"
                subtitle="Hyperlocal active opportunities that you established."
                style={{ marginBottom: "20px" }}
              />
              {loading ? (
                <GigCardsSkeleton count={2} />
              ) : myGigs.length === 0 ? (
                <div style={{ padding: "40px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "12px", background: "rgba(var(--surface-rgb), 0.1)" }}>
                  <Briefcase size={36} style={{ opacity: 0.25, color: "var(--text-secondary)", marginBottom: "12px" }} />
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>No gigs posted yet</h4>
                  <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "var(--text-secondary)", textAlign: "center" }}>Post a hyperlocal gig to hire neighborhood talent.</p>
                  <Button onClick={() => setShowPostForm(true)} variant="secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                    Post a Gig
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {myGigs.slice(0, 3).map((gig) => (
                    <div key={gig._id} style={{ padding: "16px", background: "rgba(var(--surface-rgb), 0.2)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: "700" }}>{gig.title}</h4>
                        <Badge variant={gig.status === "Open" ? "open" : gig.status === "Active" ? "active" : "completed"}>
                          {gig.status}
                        </Badge>
                      </div>
                      <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: "1.4" }}>
                        {gig.description.length > 120 ? `${gig.description.substring(0, 120)}...` : gig.description}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                        <span>Budget: <strong style={{ color: "var(--success)" }}>₹{gig.budget?.toLocaleString("en-IN")}</strong></span>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <button
                            type="button"
                            onClick={() => handleEditGigClick(gig)}
                            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
                            title="Edit Gig"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGigClick(gig._id)}
                            style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
                            title="Delete Gig"
                          >
                            <Trash2 size={14} />
                          </button>
                          <Link to={`/marketplace?gigId=${gig._id}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12.5px", fontWeight: "600", color: "var(--accent)", textDecoration: "none" }}>
                            <span>Manage Details</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Messages Preview */}
            <Card style={{ textAlign: "left" }}>
              <SectionTitle 
                title="Recent Messages Preview"
                subtitle="Coordinate and chat with neighborhood talent."
                style={{ marginBottom: "20px" }}
              />
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Shimmer style={{ width: "100%", height: "54px" }} />
                  <Shimmer style={{ width: "100%", height: "54px" }} />
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "40px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "12px", background: "rgba(var(--surface-rgb), 0.1)" }}>
                  <MessageSquare size={36} style={{ opacity: 0.25, color: "var(--text-secondary)", marginBottom: "12px" }} />
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>No messages yet</h4>
                  <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "var(--text-secondary)", textAlign: "center" }}>Check proposals or explore the marketplace to start chats.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {conversations.slice(0, 3).map((conv) => {
                    const partner = user.role === "client" ? conv.freelancer : conv.client;
                    return (
                      <Link 
                        to="/chat" 
                        key={conv._id} 
                        style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", background: "rgba(var(--surface-rgb), 0.2)", border: "1px solid var(--border)", transition: "background 0.2s" }}
                        className="dashboard-message-link"
                      >
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "12px", color: "#6366F1", flexShrink: 0 }}>
                          {partner?.user?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)" }}>{partner?.user?.name || "Freelancer"}</span>
                            <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>{user.role === "client" ? "Freelancer" : "Client"}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {conv.lastMessage || "No messages yet"}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Recent Activity */}
            <Card style={{ textAlign: "left" }}>
              <SectionTitle 
                title="Recent Activity"
                subtitle="System event logs and updates on contract actions."
                style={{ marginBottom: "20px" }}
              />
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Shimmer style={{ width: "100%", height: "24px" }} />
                  <Shimmer style={{ width: "100%", height: "24px" }} />
                </div>
              ) : latestActivities.length === 0 ? (
                <div style={{ padding: "40px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "12px", background: "rgba(var(--surface-rgb), 0.1)" }}>
                  <Activity size={36} style={{ opacity: 0.25, color: "var(--text-secondary)", marginBottom: "12px" }} />
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>No recent activity</h4>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", textAlign: "center" }}>Events will appear as you interact with the marketplace.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {latestActivities.map((act) => (
                    <div key={act.id} style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(var(--surface-rgb), 0.4)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0, marginTop: "2px" }}>
                        {act.icon}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "13px", lineHeight: "1.4" }}>{act.text}</p>
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card style={{ textAlign: "left" }}>
              <SectionTitle 
                title="Quick Actions"
                subtitle="Common client configuration flows and links."
                style={{ marginBottom: "20px" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <Card interactive onClick={() => setShowPostForm(true)} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "rgba(var(--surface-rgb), 0.1)" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#06B6D4" }}>
                    <PlusCircle size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "13.5px", fontWeight: "700" }}>Post New Gig</h4>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>Add local job listing</p>
                  </div>
                </Card>
                <Card interactive onClick={() => navigate("/marketplace")} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "rgba(var(--surface-rgb), 0.1)" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1" }}>
                    <Search size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "13.5px", fontWeight: "700" }}>Browse Marketplace</h4>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>View local listings</p>
                  </div>
                </Card>
                <Card interactive onClick={() => navigate("/contracts")} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "rgba(var(--surface-rgb), 0.1)" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "13.5px", fontWeight: "700" }}>View Contracts</h4>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>Track funded jobs</p>
                  </div>
                </Card>
                <Card interactive onClick={() => navigate("/profile")} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "rgba(var(--surface-rgb), 0.1)" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                    <User size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "13.5px", fontWeight: "700" }}>Edit Profile</h4>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>Configure company details</p>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="dashboard-container"
      style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}
    >
      {/* ── Onboarding Profile Warning ── */}
      {profileChecked && !profile && (
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card style={{ borderLeft: "4px solid var(--danger)", background: "rgba(239, 68, 68, 0.04)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ textAlign: "left" }}>
              <h3 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontSize: "15px", fontWeight: "700" }}>Account Profile Incomplete</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Please configure your service area details to join the hyperlocal marketplace.</p>
            </div>
            <Link to="/profile" style={{ textDecoration: "none" }}>
              <Button variant="primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                Set Up Profile
              </Button>
            </Link>
          </Card>
        </motion.div>
      )}

      {/* ── Onboarding Checklist (Empty State Experience) ── */}
      {isDashboardEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Sparkles size={18} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "800", margin: 0, letterSpacing: "-0.01em" }}>Welcome to SkillSphere! Let's get you set up</h3>
            </div>
            <p style={{ fontSize: "13.5px", margin: "0 0 24px 0", color: "var(--text-secondary)", textAlign: "left", lineHeight: "1.5" }}>
              Follow these onboarding checklist steps to configure your service card, hire neighborhood talent, or start bidding on local gigs.
            </p>
            <div className="onboarding-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              {/* Step 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", background: "rgba(var(--surface-rgb), 0.3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                <span style={{ 
                  width: "24px", height: "24px", borderRadius: "50%", 
                  background: profile ? "var(--success)" : "var(--border)", 
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", 
                  fontWeight: "bold", fontSize: "11px", flexShrink: 0
                }}>
                  {profile ? "✓" : "1"}
                </span>
                <div style={{ flexGrow: 1, textAlign: "left" }}>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "13.5px", fontWeight: "600" }}>Setup Hyperlocal Service Profile</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>Configure your operating region, rates, and skills portfolio to unlock bids.</p>
                </div>
                {!profile && (
                  <Link to="/profile">
                    <Button variant="primary" style={{ fontSize: "11.5px", padding: "6px 12px" }}>
                      Set Up Profile
                    </Button>
                  </Link>
                )}
              </div>
              
              {/* Step 2 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", background: "rgba(var(--surface-rgb), 0.3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                <span style={{ 
                  width: "24px", height: "24px", borderRadius: "50%", 
                  background: ((user?.role === "client" ? myGigs.length : myProposals.length) > 0) ? "var(--success)" : "var(--border)", 
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", 
                  fontWeight: "bold", fontSize: "11px", flexShrink: 0
                }}>
                  {((user?.role === "client" ? myGigs.length : myProposals.length) > 0) ? "✓" : "2"}
                </span>
                <div style={{ flexGrow: 1, textAlign: "left" }}>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "13.5px", fontWeight: "600" }}>
                    {user?.role === "client" ? "Post your First Gig Opportunity" : "Bid on a Local Gig Opportunity"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                    {user?.role === "client" 
                      ? "Establish a local job listing to receive offers and compare talent." 
                      : "Browse open marketplace gigs and submit your bidding rates."}
                  </p>
                </div>
                {!((user?.role === "client" ? myGigs.length : myProposals.length) > 0) && (
                  user?.role === "client" ? (
                    <Button onClick={() => setShowPostForm(true)} variant="primary" style={{ padding: "6px 12px", fontSize: "11.5px" }}>
                      Post a Gig
                    </Button>
                  ) : (
                    <Link to="/marketplace">
                      <Button variant="primary" style={{ padding: "6px 12px", fontSize: "11.5px" }}>Find Gigs</Button>
                    </Link>
                  )
                )}
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", background: "rgba(var(--surface-rgb), 0.3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                <span style={{ 
                  width: "24px", height: "24px", borderRadius: "50%", 
                  background: myActiveContracts.length > 0 ? "var(--success)" : "var(--border)", 
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", 
                  fontWeight: "bold", fontSize: "11px", flexShrink: 0
                }}>
                  {myActiveContracts.length > 0 ? "✓" : "3"}
                </span>
                <div style={{ flexGrow: 1, textAlign: "left" }}>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "13.5px", fontWeight: "600" }}>Collaborate and Release Escrow</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>Accept local offers, secure payment milestones, and complete contract reviews.</p>
                </div>
              </div>

            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Welcome Header Section ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", textAlign: "left" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)" }}>
            {user?.role === "client"
              ? `Review proposals and fund escrows for ${profile?.companyName || "your projects"}`
              : `Browse hyperlocal opportunities matching your skills: ${profile?.title || "Freelancer"}`
            }
          </p>
        </div>
        {user?.role === "client" && (
          <Button onClick={() => setShowPostForm(!showPostForm)} variant="primary" icon={<Plus size={15} />}>
            {showPostForm ? "Collapse Form" : "Create a Gig"}
          </Button>
        )}
      </div>

      {/* ── Quick Actions Matrix Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {user?.role === "client" ? (
          <>
            <Card interactive onClick={() => setShowPostForm(true)} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                <PlusCircle size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <h4 style={{ margin: "0 0 1px 0", fontSize: "13.5px", fontWeight: "700" }}>Post Local Gig</h4>
                <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)" }}>Hire neighborhood talent</p>
              </div>
            </Card>
            <Card interactive onClick={() => navigate("/marketplace")} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                <Search size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <h4 style={{ margin: "0 0 1px 0", fontSize: "13.5px", fontWeight: "700" }}>Search Gigs</h4>
                <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)" }}>Verify indexed listings</p>
              </div>
            </Card>
            <Card interactive onClick={() => navigate("/profile")} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                <User size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <h4 style={{ margin: "0 0 1px 0", fontSize: "13.5px", fontWeight: "700" }}>Company Info</h4>
                <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)" }}>Edit service operations</p>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card interactive onClick={() => navigate("/marketplace")} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                <Briefcase size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <h4 style={{ margin: "0 0 1px 0", fontSize: "13.5px", fontWeight: "700" }}>Find Gigs</h4>
                <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)" }}>Apply to local listings</p>
              </div>
            </Card>
            <Card interactive onClick={() => navigate("/contracts")} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                <FileText size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <h4 style={{ margin: "0 0 1px 0", fontSize: "13.5px", fontWeight: "700" }}>Active Projects</h4>
                <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)" }}>Track milestones escrows</p>
              </div>
            </Card>
            <Card interactive onClick={() => navigate("/profile")} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                <User size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <h4 style={{ margin: "0 0 1px 0", fontSize: "13.5px", fontWeight: "700" }}>Service Card</h4>
                <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)" }}>Edit weekly rates & bio</p>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ── Post Gig Open Form Block ── */}
      <AnimatePresence>
        {showPostForm && user?.role === "client" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <Card style={{ padding: "24px" }}>
              <SectionTitle 
                title="Post an Open Opportunity" 
                subtitle="Hire local neighborhood talent quickly with milestone escrows."
                style={{ marginBottom: "20px" }}
              />
              
              <form onSubmit={handlePostGigSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                  <Input
                    label="Job Title *"
                    type="text"
                    name="title"
                    placeholder="e.g. React Developer for Cafe Site"
                    value={newGig.title}
                    onChange={handlePostGigChange}
                    onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                    error={formErrors.title}
                    required
                  />

                  <div className="form-group" style={{ textAlign: "left", marginBottom: "20px" }}>
                    <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                      Category *
                    </label>
                    <select
                      name="category"
                      value={newGig.category}
                      onChange={handlePostGigChange}
                      onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                      className="input-field form-select"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile Apps">Mobile Apps</option>
                      <option value="Design & Creative">Design & Creative</option>
                      <option value="Writing & Translation">Writing & Translation</option>
                      <option value="Marketing & Sales">Marketing & Sales</option>
                      <option value="Local Services">Local Services</option>
                    </select>
                    {formErrors.category && <span className="form-validation-error">{formErrors.category}</span>}
                  </div>

                  <Input
                    label="Budget (INR) *"
                    type="number"
                    name="budget"
                    placeholder="Budget in ₹"
                    value={newGig.budget}
                    onChange={handlePostGigChange}
                    onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                    error={formErrors.budget}
                    icon={<IndianRupee size={16} />}
                    required
                  />

                  <Input
                    label="Duration (days) *"
                    type="number"
                    name="duration"
                    placeholder="Estimated completion days"
                    value={newGig.duration}
                    onChange={handlePostGigChange}
                    onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                    error={formErrors.duration}
                    icon={<Clock size={16} />}
                    required
                  />
                </div>

                <Input
                  label="Skills Required (comma separated) *"
                  type="text"
                  name="skills"
                  placeholder="e.g. React, Node, CSS, Gardening"
                  value={newGig.skills}
                  onChange={handlePostGigChange}
                />

                <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
                  <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                    Detailed Scope of Work *
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe project deliverables, milestones, requirements..."
                    value={newGig.description}
                    onChange={handlePostGigChange}
                    onBlur={(e) => validatePostGigField(e.target.name, e.target.value)}
                    className="form-textarea input-field"
                    style={{ minHeight: "100px", padding: "12px", borderRadius: "10px" }}
                    required
                  />
                  {formErrors.description && <span className="form-validation-error">{formErrors.description}</span>}
                </div>

                <Button type="submit" loading={posting} icon={<PlusCircle size={14} />}>
                  Post Job
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Analytics & Stats Overview ── */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <StatCard
            title="Active Contracts"
            value={myActiveContracts.length}
            icon={<FileText size={18} />}
            trend={{ type: "up", value: "12%" }}
            iconColor="#3B82F6"
            iconBg="rgba(59, 130, 246, 0.1)"
          />

          <StatCard
            title={user?.role === "client" ? "Total Gigs Posted" : "Proposals Placed"}
            value={user?.role === "client" ? myGigs.length : myProposals.length}
            icon={user?.role === "client" ? <Briefcase size={18} /> : <TrendingUp size={18} />}
            trend={{ type: "up", value: "8%" }}
            iconColor={user?.role === "client" ? "#06B6D4" : "#6366F1"}
            iconBg={user?.role === "client" ? "rgba(6, 182, 212, 0.1)" : "rgba(99, 102, 241, 0.1)"}
          />

          <StatCard
            title={user?.role === "freelancer" ? "Weekly Base Rate" : "Escrow Allocated"}
            value={user?.role === "freelancer" ? `₹${profile?.weeklyRate || 0}/week` : `₹${myGigs.reduce((acc, curr) => acc + curr.budget, 0).toLocaleString("en-IN")}`}
            icon={<Coins size={18} />}
            trend={{ type: "up", value: "6%" }}
            iconColor="#10B981"
            iconBg="rgba(16, 185, 129, 0.1)"
          />
        </div>
      )}

      {/* ── Main Panel Grid split ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
        {/* Left Side Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* List panel */}
          {loading ? (
            <Card style={{ padding: "24px" }}>
              <Shimmer style={{ width: "160px", height: "18px", marginBottom: "16px" }} />
              <GigCardsSkeleton count={2} />
            </Card>
          ) : user?.role === "client" ? (
            <Card>
              <SectionTitle 
                title={`My Posted Jobs (${myGigs.length})`}
                subtitle="Hyperlocal active opportunities that you established."
              />
              
              {myGigs.length === 0 ? (
                <div style={{ padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                  <Briefcase size={36} style={{ opacity: 0.25, color: "var(--text-secondary)", marginBottom: "12px" }} />
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>No gigs posted</h4>
                  <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "var(--text-secondary)" }}>Establish a neighborhood project by posting a new hyperlocal gig.</p>
                  <Button onClick={() => setShowPostForm(true)} variant="secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                    Post a Gig
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  {myGigs.map((gig) => (
                    <div key={gig._id} style={{ padding: "14px", background: "rgba(var(--surface-rgb), 0.3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{gig.title}</h4>
                        <Badge variant={gig.status === "Open" ? "open" : gig.status === "Active" ? "active" : "completed"}>
                          {gig.status}
                        </Badge>
                      </div>
                      <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "12px", textAlign: "left", lineHeight: "1.4" }}>
                        {gig.description.substring(0, 110)}...
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                        <span>Budget: <strong style={{ color: "var(--success)" }}>₹{gig.budget?.toLocaleString("en-IN")}</strong></span>
                        <Link to={`/marketplace?gigId=${gig._id}`} style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12.5px", fontWeight: "600", color: "var(--accent)", textDecoration: "none" }}>
                          <span>Details</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <>
              <Card>
                <SectionTitle 
                  title="AI Job Matches"
                  subtitle="Personalized hyperlocal recommendations matching your profile skills and bio."
                />
                
                {loadingRecommendations ? (
                  <GigCardsSkeleton count={2} />
                ) : profileIncomplete ? (
                  <div style={{ padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                    <User size={36} style={{ opacity: 0.25, color: "var(--text-secondary)", marginBottom: "12px" }} />
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>Incomplete profile</h4>
                    <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "var(--text-secondary)", textAlign: "center" }}>Complete your freelancer profile to get personalized job recommendations.</p>
                    <Link to="/profile" style={{ textDecoration: "none" }}>
                      <Button variant="primary" style={{ padding: "6px 12px", fontSize: "12px" }}>Set Up Profile</Button>
                    </Link>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div style={{ padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                    <Search size={36} style={{ opacity: 0.25, color: "var(--text-secondary)", marginBottom: "12px" }} />
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>No matches found</h4>
                    <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "var(--text-secondary)", textAlign: "center" }}>We couldn't find matching gigs. Explore the wider marketplace listings.</p>
                    <Link to="/marketplace" style={{ textDecoration: "none" }}>
                      <Button variant="secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>Explore Marketplace</Button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                    {recommendations.slice(0, 4).map((rec) => (
                      <div key={rec.gig._id} style={{ padding: "14px", background: "rgba(var(--surface-rgb), 0.3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{rec.gig.title}</h4>
                          <Badge variant={rec.matchScore >= 85 ? "open" : rec.matchScore >= 60 ? "progress" : "completed"}>
                            {rec.matchScore}% Match
                          </Badge>
                        </div>
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "8px", textAlign: "left", lineHeight: "1.4" }}>
                          {rec.gig.description.substring(0, 110)}...
                        </p>
                        <p style={{ fontSize: "11.5px", color: "var(--accent)", margin: "0 0 12px 0", textAlign: "left", fontStyle: "italic", fontWeight: "500" }}>
                          {rec.matchReason} ({rec.matchingMethod === "ai" ? "AI Semantic Match" : "Skill Match"})
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                          <span>Budget: <strong style={{ color: "var(--success)" }}>₹{rec.gig.budget?.toLocaleString("en-IN")}</strong></span>
                          <Link to={`/marketplace?gigId=${rec.gig._id}`} style={{ textDecoration: "none" }}>
                            <Button variant="secondary" style={{ padding: "4px 10px", fontSize: "11px" }}>
                              Apply Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card style={{ marginTop: "24px" }}>
                <SectionTitle 
                  title={`My Submitted Proposals (${myProposals.length})`}
                  subtitle="Track your active bids and project application status."
                />
                
                {myProposals.length === 0 ? (
                  <div style={{ padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                    <FileText size={36} style={{ opacity: 0.25, color: "var(--text-secondary)", marginBottom: "12px" }} />
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>No proposals submitted</h4>
                    <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "var(--text-secondary)" }}>Submit bids on hyperlocal gigs in the marketplace to get started.</p>
                    <Link to="/marketplace" style={{ textDecoration: "none" }}>
                      <Button variant="secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>Find Gigs</Button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                    {myProposals.map((prop) => (
                      <div key={prop._id} style={{ padding: "14px", background: "rgba(var(--surface-rgb), 0.3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{prop.gig?.title || "Hyperlocal Opportunity"}</h4>
                          <Badge variant={prop.status === "Pending" ? "progress" : prop.status === "Accepted" ? "open" : "completed"}>
                            {prop.status}
                          </Badge>
                        </div>
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "12px", textAlign: "left", lineHeight: "1.4" }}>
                          "{prop.coverLetter}"
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                          <span>Bid: <strong style={{ color: "var(--success)" }}>₹{prop.proposedBudget?.toLocaleString("en-IN")}</strong> ({prop.deliveryTime} days)</span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {prop.status === "Pending" && (
                              <Button 
                                onClick={() => handleWithdrawProposal(prop._id)} 
                                variant="secondary" 
                                style={{ padding: "4px 10px", fontSize: "11px", color: "var(--danger)" }}
                              >
                                Withdraw
                              </Button>
                            )}
                            <Link to={`/marketplace?gigId=${prop.gig?._id}`} style={{ textDecoration: "none" }}>
                              <Button variant="secondary" style={{ padding: "4px 10px", fontSize: "11px" }}>
                                View Gig
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

        </div>

        {/* Right Side Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Activity Log Feed */}
          <Card>
            <h3 style={{ fontSize: "13px", fontWeight: "700", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px", textAlign: "left" }}>
              <Activity size={15} style={{ color: "var(--accent)" }} />
              <span>Activity Feed</span>
            </h3>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Shimmer style={{ width: "100%", height: "24px" }} />
                <Shimmer style={{ width: "100%", height: "24px" }} />
              </div>
            ) : latestActivities.length === 0 ? (
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", textAlign: "center", margin: "20px 0" }}>No recent activity logged.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                {latestActivities.map((act) => (
                  <div key={act.id} style={{ display: "flex", alignItems: "start", gap: "10px" }}>
                    <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(var(--surface-rgb), 0.4)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0, marginTop: "1px" }}>
                      {act.icon}
                    </span>
                    <div style={{ flexGrow: 1, textAlign: "left" }}>
                      <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "12.5px", lineHeight: "1.4" }}>{act.text}</p>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

      </div>

    </motion.div>
  );
};

export default Dashboard;
