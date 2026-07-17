import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { 
  Briefcase, 
  CheckCircle, 
  MapPin, 
  Star, 
  Zap, 
  ShieldCheck, 
  MessageSquare, 
  Search, 
  Users, 
  ArrowRight,
  ChevronDown,
  TrendingUp
} from "lucide-react";
import { Button, Card, Avatar } from "../components/ui";

const Landing = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Carousel Auto-play Indices
  const [activeFreelancerIdx, setActiveFreelancerIdx] = useState(0);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);

  // FAQs List
  const faqs = [
    { q: "How does hyperlocal escrow work?", a: "When a contract is established, the client deposits project funds into milestone escrows. Funds are only cleared and released to the freelancer once the local deliverables are confirmed complete." },
    { q: "What is AI-powered municipal matching?", a: "Our AI scans project descriptions, geolocates operating municipal zones, evaluates verified local reviews, and recommends the top 3 matches within a 5-mile radius." },
    { q: "Are freelancer credentials verified?", a: "Yes. SkillSphere requires local reference checks, profile validation, and verified reviews from previous neighborhood clients before freelancers can bid on public opportunities." },
    { q: "What fee structures does SkillSphere apply?", a: "SkillSphere charges a minimal 5% platform fee on completed contracts. Clients pay zero subscription fees, and registering is completely free." }
  ];

  // Mock Sliders Data
  const featuredFreelancers = [
    { name: "Sarah Jenkins", role: "UI/UX Designer", location: "Brooklyn, NY", src: "", skills: ["Figma", "Webflow", "Design System"], bio: "Specializing in premium dark-mode web landing layouts and vector brand visuals." },
    { name: "Marcus Thorne", role: "React Developer", location: "Austin, TX", src: "", skills: ["React", "NextJS", "Framer Motion"], bio: "Frontend engineer building highly interactive dashboards and state controllers." },
    { name: "Elena Rostova", role: "Local Copywriter", location: "Miami, FL", src: "", skills: ["SEO Copy", "Translations", "Brands"], bio: "Crafting conversion copy and newsletter headlines for fast-growing startup companies." }
  ];

  const testimonials = [
    { quote: "SkillSphere transformed how we hire local technical help. Within 2 hours of posting, our contractor was on site setting up our client panels.", author: "David Vance, Founder Acme Corp" },
    { quote: "The escrow milestone process gives me full security. I never worry about payout clearance or delivery disputes anymore.", author: "Clara Zhao, Senior Designer" },
    { quote: "Best local marketplace I've used. The matching accuracy is incredible and the interface is super fast and clean.", author: "Ryan Patel, Product Lead" }
  ];

  // Auto-play Slider effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFreelancerIdx((prev) => (prev + 1) % featuredFreelancers.length);
      setActiveTestimonialIdx((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page-root" style={{ fontFamily: "var(--font-sans)", overflow: "hidden" }}>
      
      {/* 1. HERO SECTION */}
      <section className="hero-section" style={{
        padding: "80px 0 100px 0",
        textAlign: "center",
        position: "relative",
        background: "radial-gradient(circle at 50% 30%, rgba(96, 165, 250, 0.08) 0%, transparent 70%)"
      }}>
        {/* Neon blur background glow details */}
        <div style={{ position: "absolute", width: "300px", height: "300px", background: "var(--accent-glow)", filter: "blur(120px)", borderRadius: "50%", top: "10%", left: "15%", zIndex: 1 }} />
        <div style={{ position: "absolute", width: "250px", height: "250px", background: "rgba(168, 85, 247, 0.1)", filter: "blur(100px)", borderRadius: "50%", bottom: "10%", right: "15%", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          
          {/* Animated Announcement Chip */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "28px"
            }}
          >
            <span style={{ display: "inline-flex", padding: "2px 6px", background: "var(--accent)", color: "#fff", borderRadius: "999px", fontSize: "10px", fontWeight: "800" }}>NEW</span>
            <span>AI Matchmaker 2.0 is now live for municipal networks</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              fontSize: "56px",
              fontWeight: "800",
              lineHeight: "1.1",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "24px",
              fontFamily: "var(--font-display)"
            }}
          >
            Hire Premium Local Talent. <br />
            Fund with <span style={{ background: "var(--accent-grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Milestone Escrows</span>.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              fontSize: "19px",
              lineHeight: "1.5",
              color: "var(--text-secondary)",
              maxWidth: "650px",
              margin: "0 auto 40px auto"
            }}
          >
            SkillSphere matches you with top-rated neighborhood freelancers for web development, design, and physical services. Secure payouts ensure guaranteed work.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "48px" }}
          >
            {user ? (
              <Link to="/dashboard" style={{ textDecoration: "none" }}>
                <Button variant="primary" style={{ padding: "14px 28px", fontSize: "15px" }} icon={<ArrowRight size={16} />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register" style={{ textDecoration: "none" }}>
                  <Button variant="primary" style={{ padding: "14px 28px", fontSize: "15px" }} icon={<Zap size={16} />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <Button variant="outline" style={{ padding: "14px 28px", fontSize: "15px" }}>
                    Explore Open Gigs
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* 2. STATS COUNTER BAR */}
      <section style={{ background: "var(--surface)", borderY: "1px solid var(--border)", padding: "40px 0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "28px", textAlign: "center" }}>
          <div>
            <h4 style={{ fontSize: "36px", fontWeight: "800", color: "var(--text-primary)", margin: "0 0 4px 0" }}>5,800+</h4>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>Local Matches Made</span>
          </div>
          <div>
            <h4 style={{ fontSize: "36px", fontWeight: "800", color: "var(--accent)", margin: "0 0 4px 0" }}>₹2.3 Cr+</h4>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>Escrow Payouts Cleared</span>
          </div>
          <div>
            <h4 style={{ fontSize: "36px", fontWeight: "800", color: "var(--success)", margin: "0 0 4px 0" }}>99.2%</h4>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>Work Completion Rating</span>
          </div>
          <div>
            <h4 style={{ fontSize: "36px", fontWeight: "800", color: "var(--text-primary)", margin: "0 0 4px 0" }}>&lt; 5 Miles</h4>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>Average Talent Distance</span>
          </div>
        </div>
      </section>

      {/* 3. FEATURE CARDS */}
      <section style={{ padding: "100px 0", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "12px", fontFamily: "var(--font-display)" }}>Architected for High-Trust Neighborhood Exchange</h2>
            <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "550px", margin: "0 auto" }}>SkillSphere integrates high-end SaaS features directly into localized marketplace gig agreements.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <Card style={{ padding: "32px", textAlign: "left" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(96, 165, 250, 0.1)", display: "flex", alignItems: "center", justifyCenter: "center", color: "var(--accent)", marginBottom: "20px", paddingLeft: "11px" }}>
                <Zap size={20} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 10px 0" }}>AI Municipal Matchmaker</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.6" }}>
                Instantly scan local candidates with matching algorithms analyzing scores, reviews, and proximity parameters.
              </p>
            </Card>

            <Card style={{ padding: "32px", textAlign: "left" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.1)", display: "flex", alignItems: "center", justifyCenter: "center", color: "var(--success)", marginBottom: "20px", paddingLeft: "11px" }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 10px 0" }}>Milestone Escrows</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.6" }}>
                Keep payments secure in localized platform escrows. Release funds instantly as work milestones are achieved.
              </p>
            </Card>

            <Card style={{ padding: "32px", textAlign: "left" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(168, 85, 247, 0.1)", display: "flex", alignItems: "center", justifyCenter: "center", color: "#A855F7", marginBottom: "20px", paddingLeft: "11px" }}>
                <MessageSquare size={20} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 10px 0" }}>Real-time Conversations</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.6" }}>
                Coordinate deliverables, set terms, and handle local adjustments using socket-powered instant messaging.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. AI MATCHING VISUAL ACCENT SECTION */}
      <section style={{ padding: "80px 0", background: "var(--surface)", borderY: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
          
          {/* Left Description */}
          <div style={{ textAlign: "left" }}>
            <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "12px" }}>
              AI MATCHING ALGORITHMS
            </span>
            <h2 style={{ fontSize: "36px", fontWeight: "800", margin: "0 0 20px 0", lineHeight: "1.1", fontFamily: "var(--font-display)" }}>
              Find local talent with a 98% matching score index.
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "28px" }}>
              Our AI engine matches client descriptions and skills indices against local freelancer statistics, distance limits, weekly rates, and completion ratings.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <CheckCircle size={16} style={{ color: "var(--success)" }} />
                <span>Geofenced radius verification within 5 miles</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <CheckCircle size={16} style={{ color: "var(--success)" }} />
                <span>Verified review audits from past neighbor clients</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <CheckCircle size={16} style={{ color: "var(--success)" }} />
                <span>Escrow compatibility analysis for budget safety</span>
              </div>
            </div>
          </div>

          {/* Right Visual Dashboard Mock */}
          <Card style={{ padding: "28px", background: "var(--bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>AI Matching Engine</span>
              <span style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--success)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>Active</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  <span>Proximity Match Score</span>
                  <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>98%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "98%", height: "100%", background: "var(--accent)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  <span>Skill Index Compliance</span>
                  <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>94%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "94%", height: "100%", background: "var(--accent)" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                <Avatar name="Sarah Jenkins" size="sm" />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "700" }}>Sarah Jenkins</span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>1.4 miles away • UI/UX Specialist</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 5. FEATURED TALENT CAROUSEL */}
      <section style={{ padding: "100px 0", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "12px", fontFamily: "var(--font-display)" }}>Featured Hyperlocal Experts</h2>
            <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "550px", margin: "0 auto" }}>Browse verified freelance experts active in your direct municipality.</p>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <AnimatePresence mode="wait">
              {featuredFreelancers.map((freelancer, idx) => {
                if (idx !== activeFreelancerIdx) return null;
                return (
                  <motion.div
                    key={freelancer.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: "100%", maxWidth: "550px" }}
                  >
                    <Card style={{ padding: "32px", textAlign: "left" }}>
                      <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
                        <Avatar name={freelancer.name} size="lg" />
                        <div>
                          <h4 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "800" }}>{freelancer.name}</h4>
                          <p style={{ margin: "0 0 6px 0", fontSize: "14px", color: "var(--text-secondary)" }}>{freelancer.role}</p>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <MapPin size={12} style={{ color: "var(--accent)" }} />
                              <span>{freelancer.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)", marginBottom: "20px" }}>
                        "{freelancer.bio}"
                      </p>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {freelancer.skills.map((skill) => (
                          <span key={skill} style={{ fontSize: "11px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "6px" }}>{skill}</span>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SLIDER */}
      <section style={{ padding: "80px 0", background: "var(--surface)", borderY: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ minHeight: "180px", maxWidth: "700px", margin: "0 auto" }}>
            <AnimatePresence mode="wait">
              {testimonials.map((test, idx) => {
                if (idx !== activeTestimonialIdx) return null;
                return (
                  <motion.div
                    key={test.author}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p style={{ fontSize: "20px", fontStyle: "italic", lineHeight: "1.6", color: "var(--text-primary)", marginBottom: "24px" }}>
                      "{test.quote}"
                    </p>
                    <h5 style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent)" }}>{test.author}</h5>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 7. FAQs */}
      <section style={{ padding: "100px 0", background: "var(--bg)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "12px", fontFamily: "var(--font-display)" }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>Everything you need to know about SkillSphere's payment and escrow protocols.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqs.map((faq, index) => {
              const active = activeFaq === index;
              return (
                <div key={index} style={{ border: "1px solid var(--border)", borderRadius: "14px", background: "var(--surface)", overflow: "hidden", transition: "all 0.2s" }}>
                  <div 
                    onClick={() => setActiveFaq(active ? null : index)}
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "15px",
                      color: "var(--text-primary)"
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} style={{ transform: active ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "var(--text-secondary)" }} />
                  </div>
                  
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <p style={{ margin: 0, padding: "0 24px 20px 24px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", textAlign: "left" }}>
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "64px 24px 32px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", textAlign: "left", marginBottom: "48px" }}>
          <div>
            <h4 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "16px" }}>SkillSphere</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Secure hyperlocal freelance marketplace platform clearing secure municipal matches using milestone escrow.
            </p>
          </div>
          <div>
            <h5 style={{ fontSize: "13px", textTransform: "uppercase", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>Company</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <Link to="/marketplace" style={{ color: "var(--text-secondary)" }}>Marketplace</Link>
              <Link to="/login" style={{ color: "var(--text-secondary)" }}>Login</Link>
              <Link to="/register" style={{ color: "var(--text-secondary)" }}>Register</Link>
            </div>
          </div>
          <div>
            <h5 style={{ fontSize: "13px", textTransform: "uppercase", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>Legal</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Terms of Service</span>
              <span style={{ color: "var(--text-secondary)" }}>Privacy Policy</span>
              <span style={{ color: "var(--text-secondary)" }}>Escrow Rules</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: "1200px", margin: "0 auto", borderTop: "1px solid var(--border)", paddingTop: "24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <span>© 2026 SkillSphere Inc. All rights reserved.</span>
          <span>Designed with Linear and Stripe dashboard aesthetics.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
