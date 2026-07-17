import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ProfileSkeleton } from "../components/SkeletonLoaders";
import { 
  User, 
  Mail, 
  Shield, 
  MapPin, 
  IndianRupee, 
  Clock, 
  Award, 
  Building, 
  Globe, 
  Save,
  Star
} from "lucide-react";
import { Button, Card, Input, SectionTitle } from "../components/ui";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Client Profile form state
  const [clientData, setClientData] = useState({
    companyName: "",
    industry: "",
    website: "",
    description: "",
    location: "",
  });

  // Freelancer Profile form state
  const [freelancerData, setFreelancerData] = useState({
    title: "",
    bio: "",
    skills: "",
    weeklyRate: "",
    experience: "",
    location: "",
  });

  const [saving, setSaving] = useState(false);
  const [profileReviews, setProfileReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        if (user.role === "client") {
          try {
            const res = await API.get("/clients/me");
            if (res.data.client) {
              setClientData({
                companyName: res.data.client.companyName || "",
                industry: res.data.client.industry || "",
                website: res.data.client.website || "",
                description: res.data.client.description || "",
                location: res.data.client.location || "",
              });
              
              // Load received reviews for client
              const revRes = await API.get(`/reviews/client/${res.data.client._id}`);
              setProfileReviews(revRes.data.reviews || []);
              setAvgRating(revRes.data.averageRating || 0);
              setReviewCount(revRes.data.reviewCount || 0);
            }
          } catch (err) {
            if (err.response?.status === 404) {
              // Profile not set up yet
            } else {
              console.error("Client profile load error:", err);
            }
          }
        } else if (user.role === "freelancer") {
          try {
            const res = await API.get("/freelancers/me");
            if (res.data.profile) {
              setFreelancerData({
                title: res.data.profile.title || "",
                bio: res.data.profile.bio || "",
                skills: res.data.profile.skills?.join(", ") || "",
                weeklyRate: res.data.profile.weeklyRate || "",
                experience: res.data.profile.experience || "",
                location: res.data.profile.location || "",
              });

              // Load received reviews for freelancer
              const revRes = await API.get(`/reviews/freelancer/${res.data.profile._id}`);
              setProfileReviews(revRes.data.reviews || []);
              setAvgRating(revRes.data.averageRating || 0);
              setReviewCount(revRes.data.reviewCount || 0);
            }
          } catch (err) {
            if (err.response?.status === 404) {
              // No existing profile found. Allow configuration of a new one.
            } else {
              console.error(err);
            }
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientData({
      ...clientData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFreelancerChange = (e) => {
    const { name, value } = e.target;
    setFreelancerData({
      ...freelancerData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateClientForm = () => {
    const tempErrors = {};
    if (!clientData.companyName.trim()) {
      tempErrors.companyName = "Company name is required";
    }
    if (clientData.website && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(clientData.website)) {
      tempErrors.website = "Please enter a valid website URL starting with http:// or https://";
    }
    if (!clientData.location.trim()) {
      tempErrors.location = "Operating location area is required";
    }
    if (!clientData.description.trim()) {
      tempErrors.description = "Company bio description is required";
    } else if (clientData.description.trim().length < 20) {
      tempErrors.description = "Bio must be at least 20 characters long";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const validateFreelancerForm = () => {
    const tempErrors = {};
    if (!freelancerData.title.trim()) {
      tempErrors.title = "Headline title is required";
    }
    if (!freelancerData.weeklyRate || Number(freelancerData.weeklyRate) <= 0) {
      tempErrors.weeklyRate = "Weekly rate must be a positive number greater than 0";
    }
    if (freelancerData.experience === "" || Number(freelancerData.experience) < 0) {
      tempErrors.experience = "Experience cannot be negative";
    }
    if (!freelancerData.skills.trim()) {
      tempErrors.skills = "Skills are required (comma separated)";
    }
    if (!freelancerData.location.trim()) {
      tempErrors.location = "Hyperlocal service area is required";
    }
    if (!freelancerData.bio.trim()) {
      tempErrors.bio = "Professional bio is required";
    } else if (freelancerData.bio.trim().length < 20) {
      tempErrors.bio = "Bio must be at least 20 characters long";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    if (!validateClientForm()) {
      toast.error("Please correct all form validation errors");
      return;
    }

    try {
      setSaving(true);
      const res = await API.post("/clients", clientData);
      if (res.data) {
        toast.success("Client profile saved successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFreelancerSubmit = async (e) => {
    e.preventDefault();
    if (!validateFreelancerForm()) {
      toast.error("Please correct all form validation errors");
      return;
    }

    try {
      setSaving(true);
      const formattedSkills = freelancerData.skills.split(",").map((s) => s.trim()).filter((s) => s);
      const res = await API.post("/freelancers", {
        ...freelancerData,
        skills: formattedSkills,
        weeklyRate: Number(freelancerData.weeklyRate),
        experience: Number(freelancerData.experience),
      });
      if (res.data) {
        toast.success("Freelancer profile saved successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="profile-page-container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="profile-page-container" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div className="profile-wrapper" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        {/* User Card */}
        <Card className="user-info-card" style={{ display: "flex", alignItems: "center", gap: "24px", padding: "32px" }}>
          <div className="chat-avatar-placeholder" style={{ width: "72px", height: "72px", fontSize: "28px" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: "24px", margin: "0 0 6px 0" }}>{user.name}</h2>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Mail size={14} />
                <span>{user.email}</span>
              </span>
              <span className="badge badge-progress" style={{ textTransform: "capitalize", padding: "2px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Shield size={11} />
                <span>{user.role}</span>
              </span>
            </div>
          </div>
        </Card>

        {/* Configuration Form Card */}
        <Card className="profile-form-card" style={{ padding: "32px" }}>
          <SectionTitle 
            title="Configure Hyperlocal Profile" 
            subtitle="This information is visible to clients and freelancers in the marketplace."
            style={{ marginBottom: "32px" }}
          />

          {user.role === "client" ? (
            /* CLIENT PROFILE FORM */
            <form onSubmit={handleClientSubmit} className="profile-form">
              <Input
                label="Company / Organization Name *"
                type="text"
                name="companyName"
                placeholder="Acme Local Solutions"
                value={clientData.companyName}
                onChange={handleClientChange}
                onBlur={validateClientForm}
                error={errors.companyName}
                icon={<Building size={16} />}
                required
              />

              <div className="form-grid">
                <Input
                  label="Industry"
                  type="text"
                  name="industry"
                  placeholder="Retail, Tech, Local Services..."
                  value={clientData.industry}
                  onChange={handleClientChange}
                  error={errors.industry}
                />

                <Input
                  label="Website URL"
                  type="url"
                  name="website"
                  placeholder="https://example.com"
                  value={clientData.website}
                  onChange={handleClientChange}
                  onBlur={validateClientForm}
                  error={errors.website}
                  icon={<Globe size={16} />}
                />
              </div>

              <Input
                label="Operating Location Area *"
                type="text"
                name="location"
                placeholder="e.g. Brooklyn, New York"
                value={clientData.location}
                onChange={handleClientChange}
                onBlur={validateClientForm}
                error={errors.location}
                icon={<MapPin size={16} />}
                required
              />

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Company Description / Bio *
                </label>
                <textarea
                  name="description"
                  placeholder="Describe your business and what local projects you manage..."
                  value={clientData.description}
                  onChange={handleClientChange}
                  onBlur={validateClientForm}
                  className="form-textarea input-field"
                  style={{ minHeight: "120px" }}
                  required
                />
                {errors.description && <span className="form-validation-error">{errors.description}</span>}
              </div>

              <Button type="submit" loading={saving} icon={<Save size={16} />}>
                Save Client Profile
              </Button>
            </form>
          ) : (
            /* FREELANCER PROFILE FORM */
            <form onSubmit={handleFreelancerSubmit} className="profile-form">
              <Input
                label="Headline Title *"
                type="text"
                name="title"
                placeholder="e.g. Expert React Developer / Local Carpenter"
                value={freelancerData.title}
                onChange={handleFreelancerChange}
                onBlur={validateFreelancerForm}
                error={errors.title}
                icon={<Award size={16} />}
                required
              />

              <div className="form-grid">
                <Input
                  label="Weekly Rate (₹/week) *"
                  type="number"
                  name="weeklyRate"
                  placeholder="Rate in ₹/week"
                  value={freelancerData.weeklyRate}
                  onChange={handleFreelancerChange}
                  onBlur={validateFreelancerForm}
                  error={errors.weeklyRate}
                  icon={<IndianRupee size={16} />}
                  required
                />

                <Input
                  label="Years of Experience *"
                  type="number"
                  name="experience"
                  placeholder="Years"
                  value={freelancerData.experience}
                  onChange={handleFreelancerChange}
                  onBlur={validateFreelancerForm}
                  error={errors.experience}
                  icon={<Clock size={16} />}
                  required
                />
              </div>

              <Input
                label="Skills (comma separated) *"
                type="text"
                name="skills"
                placeholder="React, CSS, Node, Writing, Gardening..."
                value={freelancerData.skills}
                onChange={handleFreelancerChange}
                onBlur={validateFreelancerForm}
                error={errors.skills}
                required
              />

              <Input
                label="Hyperlocal Service Area *"
                type="text"
                name="location"
                placeholder="e.g. Manhattan, New York"
                value={freelancerData.location}
                onChange={handleFreelancerChange}
                onBlur={validateFreelancerForm}
                error={errors.location}
                icon={<MapPin size={16} />}
                required
              />

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Professional Bio *
                </label>
                <textarea
                  name="bio"
                  placeholder="Tell clients about your skills, availability, and why they should choose you..."
                  value={freelancerData.bio}
                  onChange={handleFreelancerChange}
                  onBlur={validateFreelancerForm}
                  className="form-textarea input-field"
                  style={{ minHeight: "120px" }}
                  required
                />
                {errors.bio && <span className="form-validation-error">{errors.bio}</span>}
              </div>

              <Button type="submit" loading={saving} icon={<Save size={16} />}>
                Save Freelancer Profile
              </Button>
            </form>
          )}
        </Card>

        {/* Dynamic Reviews & Reputation Section */}
        <Card style={{ padding: "32px", textAlign: "left" }}>
          <SectionTitle 
            title="Reputation & Feedback" 
            subtitle="Verified reviews and completion ratings received from municipal contracts."
            style={{ marginBottom: "24px" }}
          />

          <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "32px", padding: "20px", background: "rgba(var(--surface-rgb), 0.2)", border: "1px solid var(--border)", borderRadius: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderRight: "1px solid var(--border)", paddingRight: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "32px", fontWeight: "800", color: "var(--text-primary)" }}>
                <Star size={28} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                <span>{avgRating > 0 ? avgRating : "0.0"}</span>
              </div>
              <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px" }}>Average Rating</span>
            </div>

            <div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>{reviewCount}</div>
              <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>Verified Reviews Received</span>
            </div>
          </div>

          {profileReviews.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", background: "rgba(var(--surface-rgb), 0.1)", borderRadius: "8px" }}>
              <Star size={32} style={{ opacity: 0.25, color: "var(--text-secondary)" }} />
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>No reviews yet</h4>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)" }}>Reviews will appear here once you complete shared projects and exchange feedback.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {profileReviews.map((rev) => {
                const reviewerName = rev.reviewerRole === "client" ? rev.client?.companyName : (rev.freelancer?.user?.name || "Freelancer Partner");
                return (
                  <div key={rev._id} style={{ padding: "16px", background: "rgba(var(--surface-rgb), 0.15)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)" }}>{reviewerName}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "capitalize" }}>({rev.reviewerRole})</span>
                      </div>
                      <div style={{ color: "#f59e0b", fontSize: "13px" }}>
                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                      </div>
                    </div>
                    <p style={{ margin: "0 0 10px 0", fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: "1.5", textAlign: "left" }}>
                      "{rev.comment}"
                    </p>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Project: <span style={{ fontWeight: "600" }}>{rev.contract?.title || "Milestone Contract"}</span> • {new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;
