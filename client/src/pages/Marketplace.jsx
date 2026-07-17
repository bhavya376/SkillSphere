import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Briefcase, 
  Clock, 
  IndianRupee, 
  ArrowLeft, 
  Send, 
  Check, 
  MessageSquare, 
  MapPin,
  ListFilter,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { GigCardsSkeleton } from "../components/SkeletonLoaders";
import { Button, Card, Input, Badge, SectionTitle } from "../components/ui";

const Marketplace = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGigId = searchParams.get("gigId");

  const [gigs, setGigs] = useState([]);
  const [selectedGig, setSelectedGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [freelancerProfile, setFreelancerProfile] = useState(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Proposal Submission state
  const [proposalForm, setProposalForm] = useState({
    coverLetter: "",
    proposedBudget: "",
    deliveryTime: "",
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalErrors, setProposalErrors] = useState({});

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.append("search", debouncedSearch);
      if (category) queryParams.append("category", category);
      if (minBudget) queryParams.append("minBudget", minBudget);
      if (maxBudget) queryParams.append("maxBudget", maxBudget);

      const res = await API.get(`/gigs?${queryParams.toString()}`);
      setGigs(res.data.gigs);
    } catch (err) {
      toast.error("Failed to load gigs");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch gigs automatically on filter state changes
  useEffect(() => {
    fetchGigs();
    setCurrentPage(1); // Reset page on filter changes
  }, [debouncedSearch, category, minBudget, maxBudget]);

  useEffect(() => {
    if (user && user.role === "freelancer") {
      API.get("/freelancers/me")
        .then((res) => setFreelancerProfile(res.data.profile))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (activeGigId) {
      const loadGigDetails = async () => {
        try {
          const res = await API.get(`/gigs/${activeGigId}`);
          setSelectedGig(res.data.gig);

          if (user && user.role === "client" && res.data.gig.client?.user?._id === user._id) {
            const propRes = await API.get("/proposals");
            const filteredProps = propRes.data.proposals.filter((p) => p.gig?._id === activeGigId);
            setProposals(filteredProps);
          }
        } catch (err) {
          toast.error("Failed to load gig details");
        }
      };
      loadGigDetails();
    } else {
      setSelectedGig(null);
      setProposals([]);
    }
  }, [activeGigId, user]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchGigs();
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setMinBudget("");
    setMaxBudget("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handleSelectGig = (gigId) => {
    setSearchParams({ gigId });
  };

  const validateProposalField = (name, value) => {
    let err = "";
    if (name === "proposedBudget") {
      if (!value) {
        err = "Bid Price is required";
      } else if (Number(value) <= 0) {
        err = "Bid Price must be a positive rate";
      }
    }
    if (name === "deliveryTime") {
      if (!value) {
        err = "Delivery time is required";
      } else if (Number(value) <= 0) {
        err = "Delivery time must be a positive number of days";
      }
    }
    if (name === "coverLetter") {
      if (!value.trim()) {
        err = "Cover letter is required";
      } else if (value.trim().length < 20) {
        err = "Cover letter should be at least 20 characters long";
      }
    }
    setProposalErrors((prev) => ({ ...prev, [name]: err }));
    return err;
  };

  const handleProposalChange = (e) => {
    const { name, value } = e.target;
    setProposalForm({
      ...proposalForm,
      [name]: value,
    });
    validateProposalField(name, value);
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!freelancerProfile) {
      toast.error("Please configure your Freelancer Profile first!");
      navigate("/profile");
      return;
    }

    const budgetErr = validateProposalField("proposedBudget", proposalForm.proposedBudget);
    const deliveryErr = validateProposalField("deliveryTime", proposalForm.deliveryTime);
    const coverErr = validateProposalField("coverLetter", proposalForm.coverLetter);

    if (budgetErr || deliveryErr || coverErr) {
      toast.error("Please fix all form validation errors");
      return;
    }

    try {
      setSubmittingProposal(true);
      const res = await API.post("/proposals", {
        gig: selectedGig._id,
        coverLetter: proposalForm.coverLetter,
        proposedBudget: Number(proposalForm.proposedBudget),
        deliveryTime: Number(proposalForm.deliveryTime),
      });

      if (res.data.success) {
        toast.success("Proposal submitted successfully!");
        setProposalForm({ coverLetter: "", proposedBudget: "", deliveryTime: "" });
        setProposalErrors({});
        setSearchParams({});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit proposal");
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    try {
      const res = await API.patch(`/proposals/${proposalId}/accept`);
      if (res.data.success) {
        toast.success("Proposal accepted!");
        const contractRes = await API.post("/contracts", {
          proposalId,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        if (contractRes.data.success) {
          toast.success("Contract created automatically!");
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
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject proposal");
    }
  };

  // Client-side filtering & sorting calculations
  const processedGigs = useMemo(() => {
    let result = [...gigs].filter((g) => g.status === "Open");

    // Perform sorting
    if (sortBy === "budget-high") {
      result.sort((a, b) => b.budget - a.budget);
    } else if (sortBy === "budget-low") {
      result.sort((a, b) => a.budget - b.budget);
    } else if (sortBy === "duration-short") {
      result.sort((a, b) => a.duration - b.duration);
    } else {
      // Default: "newest"
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return result;
  }, [gigs, sortBy]);

  // Client-side pagination calculations
  const paginatedGigs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedGigs.slice(start, start + itemsPerPage);
  }, [processedGigs, currentPage]);

  const totalPages = Math.ceil(processedGigs.length / itemsPerPage);

  return (
    <div className="marketplace-container" style={{ maxWidth: "1240px", margin: "0 auto" }}>
      <div className="marketplace-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <Card style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <ListFilter size={18} style={{ color: "var(--accent)" }} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Filter Opportunities</h3>
            </div>
            
            <form onSubmit={handleFilterSubmit} className="filters-form">
              <Input
                label="Search Keyword"
                placeholder="React, handyman, writing..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
                suffix={loading && <span className="search-spinner-loader" />}
              />

              <div className="form-group" style={{ textAlign: "left", marginBottom: "20px" }}>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field form-select"
                >
                  <option value="">All Categories</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Apps">Mobile Apps</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Writing & Translation">Writing & Translation</option>
                  <option value="Marketing & Sales">Marketing & Sales</option>
                  <option value="Local Services">Local Services</option>
                </select>
              </div>

              <div className="form-group" style={{ textAlign: "left", marginBottom: "20px" }}>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Budget Range (₹)
                </label>
                <div className="range-inputs" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <span style={{ color: "var(--text-secondary)" }}>-</span>
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              </div>

              <div className="sidebar-buttons" style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <Button type="submit" variant="primary" style={{ width: "100%" }} icon={<Filter size={14} />}>
                  Apply Filters
                </Button>
                <Button onClick={handleClearFilters} variant="secondary" style={{ width: "100%" }}>
                  Clear Filters
                </Button>
              </div>
            </form>
          </Card>
        </aside>

        {/* Listings / Detail View */}
        <main className="marketplace-main">
          {selectedGig ? (
            /* DETAILED VIEW */
            <Card style={{ padding: "32px" }}>
              <Button onClick={() => setSearchParams({})} variant="secondary" style={{ marginBottom: "24px" }} icon={<ArrowLeft size={14} />}>
                Back to Marketplace
              </Button>

              <div className="gig-detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "24px", marginBottom: "24px", textAlign: "left" }}>
                <div>
                  <h2 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>{selectedGig.title}</h2>
                  <Badge variant="progress">{selectedGig.category}</Badge>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "800", color: "var(--success)", letterSpacing: "-0.02em" }}>₹{selectedGig.budget?.toLocaleString("en-IN")}</span>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    <span>{selectedGig.duration} Days Delivery</span>
                  </span>
                </div>
              </div>

              <div className="gig-detail-body" style={{ textAlign: "left" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>Project Scope / Description</h3>
                <p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--text-secondary)", marginBottom: "24px" }}>{selectedGig.description}</p>

                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>Skills Required</h3>
                <div className="skills-tags" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
                  {selectedGig.skills?.map((skill, index) => (
                    <span key={index} className="skill-tag" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "13px", padding: "6px 12px", borderRadius: "6px" }}>{skill}</span>
                  ))}
                </div>

                <div className="client-info-block" style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "20px", borderRadius: "8px", marginBottom: "32px" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", fontWeight: "700" }}>Client Operating Area</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <p style={{ margin: 0, fontSize: "14px" }}><strong>Acme Entity:</strong> {selectedGig.client?.companyName || "N/A"}</p>
                    <p style={{ margin: 0, fontSize: "14px" }}><strong>Industry:</strong> {selectedGig.client?.industry || "N/A"}</p>
                    <p style={{ margin: 0, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={14} style={{ color: "var(--accent)" }} />
                      <span>{selectedGig.client?.location || "N/A"}</span>
                    </p>
                  </div>
                </div>

                {/* Submissions Section */}
                {user && user.role === "freelancer" && (
                  <div className="proposal-form-section" style={{ borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>Submit a Marketplace Proposal</h3>
                    <form onSubmit={handleProposalSubmit} className="proposal-form">
                      <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                        <Input
                          label="Bid Price (₹) *"
                          type="number"
                          name="proposedBudget"
                          placeholder="Your bid in ₹"
                          value={proposalForm.proposedBudget}
                          onChange={handleProposalChange}
                          onBlur={(e) => validateProposalField(e.target.name, e.target.value)}
                          error={proposalErrors.proposedBudget}
                          icon={<IndianRupee size={16} />}
                          required
                        />

                        <Input
                          label="Required Delivery (days) *"
                          type="number"
                          name="deliveryTime"
                          placeholder="Days"
                          value={proposalForm.deliveryTime}
                          onChange={handleProposalChange}
                          onBlur={(e) => validateProposalField(e.target.name, e.target.value)}
                          error={proposalErrors.deliveryTime}
                          icon={<Clock size={16} />}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: "24px" }}>
                        <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                          Cover Proposal Letter *
                        </label>
                        <textarea
                          name="coverLetter"
                          placeholder="Why are you the perfect fit for this hyperlocal gig?"
                          value={proposalForm.coverLetter}
                          onChange={handleProposalChange}
                          onBlur={(e) => validateProposalField(e.target.name, e.target.value)}
                          className="form-textarea input-field"
                          style={{ minHeight: "100px" }}
                          required
                        />
                        {proposalErrors.coverLetter && <span className="form-validation-error">{proposalErrors.coverLetter}</span>}
                      </div>

                      <Button type="submit" loading={submittingProposal} icon={<Send size={14} />}>
                        Submit Bid
                      </Button>
                    </form>
                  </div>
                )}

                {user && user.role === "client" && selectedGig.client?.user?._id === user._id && (
                  <div className="client-proposals-section" style={{ borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>Incoming Proposals Received ({proposals.length})</h3>
                    {proposals.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No proposals submitted yet.</p>
                    ) : (
                      <div className="proposals-list" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {proposals.map((prop) => (
                          <div key={prop._id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", width: "100%", padding: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{prop.freelancer?.user?.name || "Freelancer"}</h4>
                              <span style={{ color: "var(--success)", fontWeight: "700", fontSize: "18px" }}>₹{prop.proposedBudget?.toLocaleString("en-IN")} <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>({prop.deliveryTime} days)</span></span>
                            </div>
                            <p style={{ fontStyle: "italic", fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "16px" }}>"{prop.coverLetter}"</p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px", flexWrap: "wrap", gap: "10px" }}>
                              <Badge variant={prop.status === "Pending" ? "progress" : prop.status === "Accepted" ? "open" : "completed"}>
                                {prop.status}
                              </Badge>
                              {prop.status === "Pending" && (
                                <div style={{ display: "flex", gap: "10px" }}>
                                  <Button onClick={() => handleAcceptProposal(prop._id)} variant="primary" style={{ padding: "6px 12px", fontSize: "12px" }} icon={<Check size={12} />}>
                                    Accept
                                  </Button>
                                  <Button onClick={() => handleRejectProposal(prop._id)} variant="secondary" style={{ padding: "6px 12px", fontSize: "12px", color: "var(--danger)" }}>
                                    Reject
                                  </Button>
                                  <Link to={`/chat?freelancerId=${prop.freelancer?._id}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                                    <MessageSquare size={12} />
                                    <span>Chat</span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* GENERAL GIGS LIST */
            <div className="marketplace-listings">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px", textAlign: "left" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "800", margin: 0, display: "inline-flex", alignItems: "center", gap: "10px", letterSpacing: "-0.02em" }}>
                  <span>Open Gigs Marketplace</span>
                  <Badge variant="open">{processedGigs.length} Available</Badge>
                </h2>

                {/* SaaS Sorting Dropdown Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ArrowUpDown size={14} style={{ color: "var(--text-secondary)" }} />
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                    className="input-field"
                    style={{ padding: "6px 12px", width: "180px", fontSize: "13px" }}
                  >
                    <option value="newest">Sort by: Newest</option>
                    <option value="budget-high">Sort by: Budget (High-Low)</option>
                    <option value="budget-low">Sort by: Budget (Low-High)</option>
                    <option value="duration-short">Sort by: Duration</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <GigCardsSkeleton count={6} />
              ) : (
                <>
                  <div className="gigs-marketplace-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                    {paginatedGigs.map((gig) => (
                      <Card 
                        key={gig._id} 
                        interactive
                        onClick={() => handleSelectGig(gig._id)}
                        style={{ display: "flex", flexDirection: "column", padding: "20px", textAlign: "left" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.03em" }}>{gig.category}</span>
                          <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--success)" }}>₹{gig.budget?.toLocaleString("en-IN")}</span>
                        </div>
                        <h3 className="gig-card-title" style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>{gig.title}</h3>
                        <p className="gig-card-desc" style={{ fontSize: "13px", color: "var(--text-secondary)", flexGrow: 1, marginBottom: "16px", lineHeight: "1.5" }}>{gig.description.substring(0, 120)}...</p>
                        
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                          {gig.skills?.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="skill-badge-small" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "10.5px", padding: "2px 8px", borderRadius: "4px" }}>{skill}</span>
                          ))}
                          {gig.skills?.length > 3 && (
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)", alignSelf: "center" }}>+{gig.skills.length - 3}</span>
                          )}
                        </div>

                        <div className="gig-card-footer" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={12} style={{ color: "var(--accent)" }} />
                            <span>{gig.client?.location || "Local"}</span>
                          </span>
                          <span className="btn-apply-text" style={{ fontSize: "13px", fontWeight: "600", color: "var(--accent)" }}>View Details</span>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {processedGigs.length === 0 && (
                    <Card style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <Briefcase size={48} style={{ opacity: 0.3, color: "var(--text-secondary)" }} />
                      <h4 style={{ margin: "16px 0 6px 0", color: "var(--text-primary)" }}>No opportunities found</h4>
                      <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "var(--text-secondary)" }}>There are no open jobs matching your search parameters currently.</p>
                      <Button onClick={handleClearFilters} variant="secondary">Reset Marketplace</Button>
                    </Card>
                  )}

                  {/* SaaS Pagination UX block */}
                  {totalPages > 1 && (
                    <div className="pagination-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                      <span style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>
                        Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, processedGigs.length)} of {processedGigs.length} gigs
                      </span>
                      <div className="pagination-controls" style={{ display: "flex", gap: "6px" }}>
                        <Button 
                          onClick={() => setCurrentPage(1)} 
                          disabled={currentPage === 1}
                          variant="secondary"
                          title="First Page"
                          aria-label="First page"
                          style={{ padding: "8px 10px" }}
                        >
                          <ChevronsLeft size={14} />
                        </Button>
                        <Button 
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} 
                          disabled={currentPage === 1}
                          variant="secondary"
                          style={{ padding: "8px 14px", fontSize: "13px" }}
                        >
                          Previous
                        </Button>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <Button
                            key={idx}
                            onClick={() => setCurrentPage(idx + 1)}
                            variant={currentPage === idx + 1 ? "primary" : "secondary"}
                            style={{ padding: "8px 12px", fontSize: "13px" }}
                          >
                            {idx + 1}
                          </Button>
                        ))}
                        <Button 
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} 
                          disabled={currentPage === totalPages}
                          variant="secondary"
                          style={{ padding: "8px 14px", fontSize: "13px" }}
                        >
                          Next
                        </Button>
                        <Button 
                          onClick={() => setCurrentPage(totalPages)} 
                          disabled={currentPage === totalPages}
                          variant="secondary"
                          title="Last Page"
                          aria-label="Last page"
                          style={{ padding: "8px 10px" }}
                        >
                          <ChevronsRight size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Marketplace;
