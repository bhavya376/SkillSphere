import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShieldAlert, 
  IndianRupee, 
  Search, 
  UserCheck, 
  UserX, 
  Activity,
  FileText,
  AlertTriangle,
  Scale
} from "lucide-react";
import { Card, Button, Badge, SectionTitle, StatCard, Modal } from "../components/ui";
import API from "../api";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("accounts"); // "accounts" | "disputes"
  const [userQuery, setUserQuery] = useState("");
  const [usersList, setUsersList] = useState([
    { id: "U-1120", name: "Sarah Jenkins", email: "sarah@designlocal.com", role: "freelancer", status: "Active", joined: "May 14, 2026" },
    { id: "U-1102", name: "David Vance", email: "david@vance-acme.org", role: "client", status: "Active", joined: "May 10, 2026" },
    { id: "U-1090", name: "Elena Rostova", email: "elena@translation.net", role: "freelancer", status: "Active", joined: "April 28, 2026" },
    { id: "U-1074", name: "James Cole", email: "j.cole@handyneighborhood.com", role: "freelancer", status: "Suspended", joined: "April 15, 2026" }
  ]);

  const [disputes, setDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);

  // Resolve modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [outcome, setOutcome] = useState("refund_client"); // "refund_client" | "pay_freelancer"
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fetchDisputes = async () => {
    try {
      setLoadingDisputes(true);
      const res = await API.get("/disputes");
      if (res.data.success) {
        setDisputes(res.data.disputes || []);
      }
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
      toast.error("Failed to load disputes list.");
    } finally {
      setLoadingDisputes(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleToggleStatus = (userId) => {
    setUsersList((prev) => 
      prev.map((usr) => {
        if (usr.id === userId) {
          const newStatus = usr.status === "Active" ? "Suspended" : "Active";
          return { ...usr, status: newStatus };
        }
        return usr;
      })
    );
    toast.success("User account status updated.");
  };

  const handleOpenResolveModal = (dispute) => {
    setSelectedDispute(dispute);
    setResolutionDetails("");
    setOutcome("refund_client");
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionDetails.trim()) {
      toast.error("Resolution details are required.");
      return;
    }

    try {
      setSubmittingResolution(true);
      const res = await API.post(`/disputes/${selectedDispute._id}/resolve`, {
        resolutionDetails,
        outcome
      });

      if (res.data.success) {
        toast.success("Dispute resolved successfully!");
        setShowResolveModal(false);
        fetchDisputes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve dispute");
    } finally {
      setSubmittingResolution(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) => 
      u.name.toLowerCase().includes(userQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(userQuery.toLowerCase())
  );

  const openDisputesCount = disputes.filter(d => d.status === "Pending").length;

  return (
    <div className="admin-dashboard-root" style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "left" }}>
      <SectionTitle
        title="Admin Control Center"
        subtitle="Platform audit logs, platform billing insights, and user account flags."
      />

      {/* Admin stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        <StatCard
          title="Platform Active Users"
          value={usersList.length.toString()}
          icon={<Users size={20} />}
          description="Verified client and freelancer metrics"
        />
        <StatCard
          title="Milestone Fees Generated"
          value="₹1,820"
          icon={<IndianRupee size={20} />}
          description="Total 5% service fee commission"
          trend={{ type: "up", value: "8%" }}
        />
        <StatCard
          title="Escrow Disputes Open"
          value={openDisputesCount.toString()}
          icon={<ShieldAlert size={20} />}
          description="Active reviews undergoing resolution"
          style={{ borderColor: openDisputesCount > 0 ? "rgba(239, 68, 68, 0.4)" : "var(--border)" }}
        />
      </div>

      {/* Navigation tabs */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveTab("accounts")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "accounts" ? "var(--accent)" : "var(--text-secondary)",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "accounts" ? "2px solid var(--accent)" : "none",
            marginBottom: "-14px"
          }}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "disputes" ? "var(--accent)" : "var(--text-secondary)",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "disputes" ? "2px solid var(--accent)" : "none",
            marginBottom: "-14px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>Disputes Queue</span>
          {openDisputesCount > 0 && (
            <span style={{ fontSize: "10px", background: "var(--danger)", color: "#fff", padding: "2px 6px", borderRadius: "10px" }}>{openDisputesCount}</span>
          )}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px", marginBottom: "48px" }}>
        {/* Main Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {activeTab === "accounts" ? (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>System Accounts Index</h3>
                
                <div style={{ position: "relative", width: "220px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 12px 6px 32px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text-primary)",
                      fontSize: "12.5px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textAlign: "left" }}>
                      <th style={{ padding: "12px" }}>User Info</th>
                      <th style={{ padding: "12px" }}>Access Role</th>
                      <th style={{ padding: "12px" }}>Verification Status</th>
                      <th style={{ padding: "12px" }}>Joined</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Account Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((usr) => (
                      <tr key={usr.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px" }}>
                          <p style={{ margin: "0 0 2px 0", fontWeight: "700" }}>{usr.name}</p>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{usr.email} • {usr.id}</span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <Badge variant={usr.role === "client" ? "progress" : "open"}>{usr.role}</Badge>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <Badge variant={usr.status === "Active" ? "open" : "cancelled"}>{usr.status}</Badge>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{usr.joined}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <Button 
                            onClick={() => handleToggleStatus(usr.id)} 
                            variant={usr.status === "Active" ? "danger" : "secondary"}
                            style={{ padding: "6px 12px", fontSize: "11px" }}
                          >
                            {usr.status === "Active" ? <UserX size={12} style={{ marginRight: "4px" }} /> : <UserCheck size={12} style={{ marginRight: "4px" }} />}
                            <span>{usr.status === "Active" ? "Suspend" : "Activate"}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>Dispute Resolution Queue</h3>
              
              {loadingDisputes ? (
                <p style={{ textAlign: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>Loading disputes queue...</p>
              ) : disputes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <AlertTriangle size={36} style={{ opacity: 0.3, margin: "0 auto 12px auto" }} />
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>No contract disputes currently reported.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textAlign: "left" }}>
                        <th style={{ padding: "12px" }}>Contract Info</th>
                        <th style={{ padding: "12px" }}>Raised By</th>
                        <th style={{ padding: "12px" }}>Dispute Reason</th>
                        <th style={{ padding: "12px" }}>Resolution Status</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputes.map((disp) => (
                        <tr key={disp._id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px" }}>
                            <p style={{ margin: "0 0 2px 0", fontWeight: "700" }}>₹{disp.contract?.amount?.toLocaleString("en-IN")}</p>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                              Client: {disp.contract?.client?.companyName || "N/A"} <br/>
                              Freelancer Profile ID: {disp.contract?.freelancer?.toString().substring(0, 10)}...
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <p style={{ margin: "0 0 2px 0", fontWeight: "600" }}>{disp.initiator?.name}</p>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "capitalize" }}>({disp.initiator?.role})</span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "var(--danger)" }}>{disp.reason}</p>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{disp.evidence}</p>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <Badge variant={disp.status === "Pending" ? "progress" : "completed"}>
                              {disp.status}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            {disp.status === "Pending" ? (
                              <Button 
                                onClick={() => handleOpenResolveModal(disp)} 
                                variant="primary"
                                style={{ padding: "6px 12px", fontSize: "11px", background: "var(--accent)" }}
                                icon={<Scale size={12} />}
                              >
                                Resolve
                              </Button>
                            ) : (
                              <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", fontStyle: "italic" }}>Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>System Signups</h3>
              <Badge variant="progress">+18% MoM</Badge>
            </div>
            
            <div style={{ position: "relative", width: "100%", height: "100px" }}>
              <svg viewBox="0 0 300 80" width="100%" height="100%" style={{ overflow: "visible" }}>
                <rect x="10" y="40" width="24" height="40" rx="4" fill="var(--border)" />
                <rect x="50" y="30" width="24" height="50" rx="4" fill="var(--border)" />
                <rect x="90" y="45" width="24" height="35" rx="4" fill="var(--border)" />
                <rect x="130" y="20" width="24" height="60" rx="4" fill="var(--accent)" />
                <rect x="170" y="10" width="24" height="70" rx="4" fill="var(--accent)" />
              </svg>
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <Activity size={16} style={{ color: "var(--accent)" }} />
              <span>Real-time System Audit</span>
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", marginTop: "6px", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-primary)", lineHeight: "1.4" }}>Freelancer Sarah Jenkins was verified for 'Web Development'</p>
                  <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>10 mins ago</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--danger)", marginTop: "6px", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-primary)", lineHeight: "1.4" }}>New escrow milestone dispute reported on municipal contract</p>
                  <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>1 hour ago</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedDispute && (
        <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} title="Resolve Contract Dispute">
          <form onSubmit={handleResolveSubmit}>
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text-secondary)" }}><strong>Reason raised:</strong> {selectedDispute.reason}</p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", wordBreak: "break-word" }}><strong>Evidence provided:</strong> {selectedDispute.evidence}</p>
            </div>

            <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
              <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Decision / Outcome *
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="form-select input-field"
                required
              >
                <option value="refund_client">Refund Client (Mark Contract Cancelled)</option>
                <option value="pay_freelancer">Pay Freelancer (Mark Contract Completed)</option>
                <option value="cancel">Cancel Contract without escrow refund</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "24px", textAlign: "left" }}>
              <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Resolution Details / Log Notes *
              </label>
              <textarea
                placeholder="State details on communication, audit of milestones, and final verdict..."
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                className="form-textarea input-field"
                style={{ minHeight: "100px" }}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <Button type="submit" disabled={submittingResolution} style={{ flexGrow: 1 }} loading={submittingResolution}>
                Commit Resolution Decision
              </Button>
              <Button type="button" onClick={() => setShowResolveModal(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
