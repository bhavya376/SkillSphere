import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ContractsSkeleton } from "../components/SkeletonLoaders";
import { Button, Card, Badge, Modal, SectionTitle, Input } from "../components/ui";
import { 
  FileText, 
  Calendar, 
  User, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  Star, 
  X,
  CreditCard,
  Briefcase
} from "lucide-react";

const Contracts = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Dispute modal states
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    reason: "",
    evidence: "",
  });
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Submissions states
  const [submissions, setSubmissions] = useState({});
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState(false);
  const [submitWorkForm, setSubmitWorkForm] = useState({
    message: "",
    deliverableUrl: "",
    additionalLink: "",
  });
  const [submittingWork, setSubmittingWork] = useState(false);

  const [showClientReviewModal, setShowClientReviewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [revisionInstructions, setRevisionInstructions] = useState("");
  const [submittingReviewDecision, setSubmittingReviewDecision] = useState(false);

  const fetchContractsAndPayments = async () => {
    try {
      setLoading(true);
      const conRes = await API.get("/contracts");
      const contractsData = conRes.data.contracts || [];
      setContracts(contractsData);

      const payRes = await API.get("/payments");
      setPayments(payRes.data.payments || []);

      const revRes = await API.get("/reviews");
      setReviews(revRes.data.reviews || []);

      // Load submissions for each contract
      const subsMap = {};
      await Promise.all(
        contractsData.map(async (c) => {
          try {
            const subRes = await API.get(`/submissions/contract/${c._id}`);
            if (subRes.data.success) {
              subsMap[c._id] = subRes.data.submissions || [];
            }
          } catch (err) {
            console.warn(`Could not load submissions for contract ${c._id}`, err);
          }
        })
      );
      setSubmissions(subsMap);
    } catch (err) {
      toast.error("Failed to load contracts data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchContractsAndPayments();
  }, [user, navigate]);

  const handleProcessPayment = async (contractId) => {
    try {
      setProcessingPayment(true);
      const res = await API.post("/payments", {
        contractId,
        paymentMethod: "Stripe",
      });

      if (res.data.success) {
        toast.success("Payment completed successfully! Escrow released.");
        fetchContractsAndPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment processing failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCompleteContract = async (contractId) => {
    try {
      const pay = payments.find((p) => p.contract?._id === contractId && p.paymentStatus === "Completed");
      if (!pay) {
        toast.error("Please release milestone payment before completing the contract!");
        return;
      }

      setProcessingComplete(true);
      const res = await API.put(`/contracts/${contractId}`, {
        status: "Completed",
      });

      if (res.data.success) {
        toast.success("Contract marked as completed!");
        fetchContractsAndPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete contract");
    } finally {
      setProcessingComplete(false);
    }
  };

  const handleOpenReview = (contractId) => {
    setSelectedContractId(contractId);
    setReviewError("");
    setReviewForm({ rating: 5, comment: "" });
    setShowReviewModal(true);
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({
      ...reviewForm,
      [name]: value,
    });
    if (name === "comment") {
      if (!value.trim()) {
        setReviewError("Feedback comments are required");
      } else if (value.trim().length < 10) {
        setReviewError("Feedback must be at least 10 characters long");
      } else {
        setReviewError("");
      }
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      setReviewError("Feedback comments are required");
      toast.error("Please add review feedback comments");
      return;
    }
    if (reviewForm.comment.trim().length < 10) {
      setReviewError("Feedback must be at least 10 characters long");
      toast.error("Feedback must be at least 10 characters long");
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await API.post("/reviews", {
        contractId: selectedContractId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });

      if (res.data.success) {
        toast.success("Thank you for your feedback! Review saved.");
        setShowReviewModal(false);
        setReviewForm({ rating: 5, comment: "" });
        setReviewError("");
        fetchContractsAndPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenDispute = (contractId) => {
    setSelectedContractId(contractId);
    setDisputeForm({ reason: "", evidence: "" });
    setShowDisputeModal(true);
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeForm.reason.trim() || !disputeForm.evidence.trim()) {
      toast.error("All dispute fields are required.");
      return;
    }

    try {
      setSubmittingDispute(true);
      const res = await API.post("/disputes", {
        contractId: selectedContractId,
        reason: disputeForm.reason,
        evidence: disputeForm.evidence,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Dispute submitted successfully!");
        setShowDisputeModal(false);
        fetchContractsAndPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit dispute");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleOpenSubmitWork = (contractId) => {
    setSelectedContractId(contractId);
    setSubmitWorkForm({ message: "", deliverableUrl: "", additionalLink: "" });
    setShowSubmitWorkModal(true);
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitWorkForm.message.trim() || !submitWorkForm.deliverableUrl.trim()) {
      toast.error("Message and Deliverable Link are required.");
      return;
    }

    try {
      setSubmittingWork(true);
      const res = await API.post("/submissions", {
        contractId: selectedContractId,
        message: submitWorkForm.message,
        deliverableUrl: submitWorkForm.deliverableUrl,
        additionalLinks: submitWorkForm.additionalLink ? [submitWorkForm.additionalLink] : [],
      });

      if (res.data.success) {
        toast.success(res.data.message || "Work submitted successfully!");
        setShowSubmitWorkModal(false);
        fetchContractsAndPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit work");
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleOpenReviewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setRevisionInstructions("");
    setShowClientReviewModal(true);
  };

  const handleReviewDecisionSubmit = async (action) => {
    if (action === "revision" && !revisionInstructions.trim()) {
      toast.error("Please enter revision instructions.");
      return;
    }

    try {
      setSubmittingReviewDecision(true);
      const res = await API.post("/submissions/review", {
        submissionId: selectedSubmission._id,
        action,
        revisionInstructions: action === "revision" ? revisionInstructions : undefined,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Review submitted successfully!");
        setShowClientReviewModal(false);
        fetchContractsAndPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review decision");
    } finally {
      setSubmittingReviewDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="contracts-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <ContractsSkeleton />
      </div>
    );
  }

  return (
    <div className="contracts-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <SectionTitle
        title="My Contracts"
        subtitle="Monitor milestone releases, track local progress, and publish reviews."
        style={{ marginBottom: "32px" }}
      />

      {contracts.length === 0 ? (
        <Card style={{ padding: "64px 32px", textAlign: "center" }}>
          <FileText size={48} style={{ opacity: 0.3, margin: "0 auto 16px auto" }} />
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>No Contracts Found</h3>
          <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            {user.role === "client"
              ? "Accept a freelancer's proposal to establish a work contract."
              : "Submit bids on gigs in the marketplace to get hired."}
          </p>
          <Link to="/marketplace" className="btn btn-primary animate-fade-in">
            {user.role === "client" ? "Explore Marketplace to Hire" : "Browse Local Gig Listings"}
          </Link>
        </Card>
      ) : (
        <div className="gigs-marketplace-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
          {contracts.map((contract) => {
            const payment = payments.find((p) => p.contract?._id === contract._id);
            const hasReview = reviews.some((r) => r.contract?._id === contract._id && (r.reviewer === user._id || r.reviewer?._id === user._id));

            return (
              <Card 
                key={contract._id} 
                style={{ display: "flex", flexDirection: "column", padding: "24px", textAlign: "left" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <Badge variant={
                    contract.status === "Active" ? "active" :
                    contract.status === "Submitted" ? "progress" :
                    contract.status === "Revision Requested" ? "warning" :
                    contract.status === "Disputed" ? "danger" :
                    "completed"
                  }>
                    {contract.status}
                  </Badge>
                  <span style={{ fontSize: "20px", fontWeight: "800", color: "var(--success)" }}>₹{contract.amount?.toLocaleString("en-IN")}</span>
                </div>

                <div style={{ flexGrow: 1, marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 12px 0" }}>Hyperlocal Milestones</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <User size={14} style={{ color: "var(--accent)" }} />
                      <span>{user.role === "client" ? `Freelancer: ${contract.freelancer?.user?.name || "N/A"}` : `Client: ${contract.client?.companyName || "N/A"}`}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={14} style={{ color: "var(--accent)" }} />
                      <span>Started: {new Date(contract.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Submissions History Block */}
                {(() => {
                  const contractSubs = submissions[contract._id] || [];
                  const latestSub = contractSubs[contractSubs.length - 1];
                  if (!latestSub) return null;

                  return (
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", marginBottom: "20px", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontWeight: "700" }}>
                        <span>Deliverables (v{latestSub.revisionNumber})</span>
                        <span style={{ color: "var(--accent)", textTransform: "capitalize" }}>{latestSub.status === "RevisionRequested" ? "Revision Requested" : latestSub.status}</span>
                      </div>
                      <p style={{ margin: "0 0 8px 0", color: "var(--text-secondary)", fontStyle: "italic" }}>"{latestSub.message}"</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <a href={latestSub.deliverableUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Briefcase size={12} />
                          <span>Primary Link: {latestSub.deliverableUrl}</span>
                        </a>
                        {latestSub.additionalLinks?.map((link, idx) => (
                          <a key={idx} href={link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", fontSize: "11.5px" }}>
                            Link {idx + 2}: {link}
                          </a>
                        ))}
                      </div>

                      {latestSub.status === "RevisionRequested" && latestSub.revisionInstructions && (
                        <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--border)", color: "var(--danger)" }}>
                          <strong>Revision Request Details:</strong>
                          <p style={{ margin: "4px 0 0 0", color: "var(--text-primary)" }}>"{latestSub.revisionInstructions}"</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", margin: "0 0 8px 0", fontWeight: "700" }}>Escrow Payout</h4>
                  
                  {payment ? (
                    <div style={{ fontSize: "13.5px" }}>
                      <p style={{ margin: "0 0 4px 0" }}>Status: <span style={{ color: payment.paymentStatus === "Completed" ? "var(--success)" : "var(--accent)", fontWeight: "600" }}>{payment.paymentStatus}</span></p>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)", fontFamily: "monospace" }}>TX: {payment.transactionId || "Pending"}</p>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>No payments released.</p>
                  )}
                </div>

                <div style={{ marginTop: "auto" }}>
                  {/* Disputed State board */}
                  {contract.status === "Disputed" && (
                    <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "12px", borderRadius: "8px", color: "#fca5a5", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle size={16} />
                      <span>Disputed. Undergoing Admin review.</span>
                    </div>
                  )}

                  {/* Client actions */}
                  {user.role === "client" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {contract.status === "Submitted" && (() => {
                        const contractSubs = submissions[contract._id] || [];
                        const latestSub = contractSubs[contractSubs.length - 1];
                        return latestSub ? (
                          <Button 
                            onClick={() => handleOpenReviewSubmission(latestSub)} 
                            variant="primary"
                            style={{ width: "100%" }}
                            icon={<CheckCircle2 size={14} />}
                          >
                            Review Submitted Work
                          </Button>
                        ) : null;
                      })()}

                      {contract.status === "Active" && !payment && (
                        <Button 
                          onClick={() => handleProcessPayment(contract._id)} 
                          disabled={processingPayment} 
                          variant="primary"
                          style={{ width: "100%" }}
                          icon={<CreditCard size={14} />}
                        >
                          Release Milestone Escrow
                        </Button>
                      )}
                      
                      {contract.status === "Active" && payment && payment.paymentStatus === "Completed" && (
                        <Button 
                          onClick={() => handleCompleteContract(contract._id)} 
                          disabled={processingComplete} 
                          variant="primary"
                          style={{ width: "100%", background: "var(--success)" }}
                          icon={<CheckCircle2 size={14} />}
                        >
                          Mark Job Completed
                        </Button>
                      )}

                      {(contract.status === "Active" || contract.status === "Submitted" || contract.status === "Revision Requested") && (
                        <Button 
                          onClick={() => handleOpenDispute(contract._id)} 
                          variant="secondary"
                          style={{ width: "100%", color: "var(--danger)", borderColor: "var(--danger)" }}
                          icon={<AlertCircle size={14} />}
                        >
                          Raise Dispute
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Freelancer actions info */}
                  {user.role === "freelancer" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {contract.status === "Submitted" && (
                        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderStyle: "dashed", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                          <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                            Work submitted. Waiting for client review...
                          </span>
                        </div>
                      )}

                      {(contract.status === "Active" || contract.status === "Revision Requested") && (
                        <Button 
                          onClick={() => handleOpenSubmitWork(contract._id)} 
                          variant="primary"
                          style={{ width: "100%" }}
                          icon={<Briefcase size={14} />}
                        >
                          {contract.status === "Revision Requested" ? "Resubmit Deliverables" : "Submit Work"}
                        </Button>
                      )}

                      {contract.status === "Active" && (
                        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderStyle: "dashed", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                          {!payment ? (
                            <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span>Awaiting escrow milestone release...</span>
                            </span>
                          ) : (
                            <span style={{ fontSize: "12.5px", color: "var(--success)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <CheckCircle2 size={12} />
                              <span>Escrow Funded! Work on deliverables.</span>
                            </span>
                          )}
                        </div>
                      )}

                      {(contract.status === "Active" || contract.status === "Submitted" || contract.status === "Revision Requested") && (
                        <Button 
                          onClick={() => handleOpenDispute(contract._id)} 
                          variant="secondary"
                          style={{ width: "100%", color: "var(--danger)", borderColor: "var(--danger)" }}
                          icon={<AlertCircle size={14} />}
                        >
                          Raise Dispute
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Completed review state */}
                  {contract.status === "Completed" && (
                    <div>
                      {hasReview ? (
                        <p style={{ margin: 0, textAlign: "center", color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600" }}>Feedback submitted ✓</p>
                      ) : (
                        <Button onClick={() => handleOpenReview(contract._id)} variant="secondary" style={{ width: "100%" }} icon={<Star size={14} />}>
                          Leave Verified Review
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Submit verified feedback">
        <form onSubmit={handleReviewSubmit}>
          <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Feedback Rating *
            </label>
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "16px", borderRadius: "8px" }}>
              <input
                type="range"
                name="rating"
                min="1"
                max="5"
                value={reviewForm.rating}
                onChange={handleReviewChange}
                className="rating-slider"
                style={{ width: "100%", cursor: "pointer", accentColor: "var(--accent)" }}
              />
              <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "4px", color: "#f59e0b", fontSize: "18px" }}>
                {"★".repeat(reviewForm.rating)}{"☆".repeat(5 - reviewForm.rating)}
                <span style={{ fontSize: "14px", color: "var(--text-secondary)", marginLeft: "8px", fontWeight: "600" }}>({reviewForm.rating}/5)</span>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "24px", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Detailed Comments *
            </label>
            <textarea
              name="comment"
              placeholder="Share feedback on working together..."
              value={reviewForm.comment}
              onChange={handleReviewChange}
              onBlur={handleReviewChange}
              className="form-textarea input-field"
              style={{ minHeight: "100px" }}
              required
            />
            {reviewError && <span className="form-validation-error">{reviewError}</span>}
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <Button type="submit" disabled={submittingReview || !!reviewError} style={{ flexGrow: 1 }} loading={submittingReview}>
              Submit Feedback
            </Button>
            <Button type="button" onClick={() => setShowReviewModal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={showDisputeModal} onClose={() => setShowDisputeModal(false)} title="File Contract Dispute">
        <form onSubmit={handleDisputeSubmit}>
          <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Reason for Dispute *
            </label>
            <select
              value={disputeForm.reason}
              onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
              className="form-select input-field"
              required
            >
              <option value="">-- Select a Reason --</option>
              <option value="Deliverables delayed past schedule">Deliverables delayed past schedule</option>
              <option value="Unsatisfactory deliverable quality">Unsatisfactory deliverable quality</option>
              <option value="Municipal guidelines not met">Municipal guidelines not met</option>
              <option value="Contract partner is non-responsive">Contract partner is non-responsive</option>
              <option value="Other / Breach of milestone criteria">Other / Breach of milestone criteria</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "24px", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Details & Evidence *
            </label>
            <textarea
              placeholder="Explain the situation in detail. Provide links to municipal submissions, milestone criteria, or chats if relevant..."
              value={disputeForm.evidence}
              onChange={(e) => setDisputeForm({ ...disputeForm, evidence: e.target.value })}
              className="form-textarea input-field"
              style={{ minHeight: "120px" }}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <Button type="submit" disabled={submittingDispute} style={{ flexGrow: 1, background: "var(--danger)" }} loading={submittingDispute}>
              File Official Dispute
            </Button>
            <Button type="button" onClick={() => setShowDisputeModal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submit Work Modal */}
      <Modal isOpen={showSubmitWorkModal} onClose={() => setShowSubmitWorkModal(false)} title="Submit Project Deliverables">
        <form onSubmit={handleSubmitWork}>
          <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Submission Message *
            </label>
            <textarea
              placeholder="Describe your work submission, explaining how you met project milestones and parameters..."
              value={submitWorkForm.message}
              onChange={(e) => setSubmitWorkForm({ ...submitWorkForm, message: e.target.value })}
              className="form-textarea input-field"
              style={{ minHeight: "100px" }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Primary Deliverable Link *
            </label>
            <Input
              type="url"
              placeholder="https://github.com/user/project or Google Drive link"
              value={submitWorkForm.deliverableUrl}
              onChange={(e) => setSubmitWorkForm({ ...submitWorkForm, deliverableUrl: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Additional Link (Optional)
            </label>
            <Input
              type="url"
              placeholder="https://figma.com/file/... or other reference URL"
              value={submitWorkForm.additionalLink}
              onChange={(e) => setSubmitWorkForm({ ...submitWorkForm, additionalLink: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <Button type="submit" disabled={submittingWork} style={{ flexGrow: 1 }} loading={submittingWork}>
              Submit Work Deliverables
            </Button>
            <Button type="button" onClick={() => setShowSubmitWorkModal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Client Review Modal */}
      {selectedSubmission && (
        <Modal isOpen={showClientReviewModal} onClose={() => setShowClientReviewModal(false)} title="Review Freelancer Deliverables">
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "16px", borderRadius: "8px", marginBottom: "24px", textAlign: "left" }}>
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text-secondary)" }}><strong>Revision v{selectedSubmission.revisionNumber} Message:</strong></p>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "var(--text-primary)", fontStyle: "italic" }}>"{selectedSubmission.message}"</p>
            
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text-secondary)" }}><strong>Deliverables:</strong></p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <a href={selectedSubmission.deliverableUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                <Briefcase size={12} />
                <span>Primary Deliverable: {selectedSubmission.deliverableUrl}</span>
              </a>
              {selectedSubmission.additionalLinks?.map((link, idx) => (
                <a key={idx} href={link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", fontSize: "12px" }}>
                  Link {idx + 2}: {link}
                </a>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "24px", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Revision Instructions (Required if requesting revision)
            </label>
            <textarea
              placeholder="State what needs to be changed, fixed, or updated before accepting..."
              value={revisionInstructions}
              onChange={(e) => setRevisionInstructions(e.target.value)}
              className="form-textarea input-field"
              style={{ minHeight: "100px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <Button 
              type="button" 
              onClick={() => handleReviewDecisionSubmit("accept")} 
              disabled={submittingReviewDecision} 
              style={{ flexGrow: 1, background: "var(--success)" }} 
              loading={submittingReviewDecision && !revisionInstructions}
            >
              Accept Work & Complete
            </Button>
            <Button 
              type="button" 
              onClick={() => handleReviewDecisionSubmit("revision")} 
              disabled={submittingReviewDecision || !revisionInstructions.trim()} 
              style={{ flexGrow: 1, background: "var(--danger)" }} 
              loading={submittingReviewDecision && !!revisionInstructions.trim()}
            >
              Request Revision
            </Button>
            <Button type="button" onClick={() => setShowClientReviewModal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Contracts;
