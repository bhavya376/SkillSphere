import React from "react";
import { motion } from "framer-motion";

// Base pulsing shimmer block
export const Shimmer = ({ className = "", style = {} }) => (
  <div className={`skeleton ${className}`} style={{ ...style }} />
);

// 1. PageLoader - displayed during initial route load or fallback suspense
export const PageLoader = () => (
  <div className="loader-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "var(--bg)" }}>
    <motion.div 
      className="logo-brand" 
      style={{ fontSize: "36px", marginBottom: "24px" }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      Skill<motion.span animate={{ color: ["#7C3AED", "#A78BFA", "#7C3AED"] }} transition={{ duration: 2, repeat: Infinity }}>Sphere</motion.span>
    </motion.div>
    
    <motion.div 
      className="premium-loader" 
      style={{ width: "32px", height: "32px", borderWidth: "3px" }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    
    <motion.p 
      style={{ marginTop: "20px", color: "var(--text-secondary)", fontSize: "14px", fontWeight: "500", letterSpacing: "0.08em" }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      LOADING YOUR WORKSPACE...
    </motion.p>
  </div>
);

// 2. StatsSkeleton - stats dashboard grid
export const StatsSkeleton = () => (
  <div className="analytics-grid" style={{ marginBottom: "32px" }}>
    {[1, 2, 3].map((i) => (
      <div key={i} className="glass-card" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flexGrow: 1 }}>
          <Shimmer style={{ width: "80px", height: "14px", marginBottom: "12px" }} />
          <Shimmer style={{ width: "120px", height: "32px" }} />
        </div>
        <Shimmer style={{ width: "48px", height: "48px", borderRadius: "10px" }} />
      </div>
    ))}
  </div>
);

// 3. GigCardsSkeleton - cards grid inside Dashboard or Marketplace
export const GigCardsSkeleton = ({ count = 3 }) => (
  <div className="gigs-marketplace-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-card" style={{ display: "flex", flexDirection: "column", padding: "24px", height: "240px", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <Shimmer style={{ width: "80px", height: "12px" }} />
            <Shimmer style={{ width: "60px", height: "16px" }} />
          </div>
          <Shimmer style={{ width: "80%", height: "20px", marginBottom: "12px" }} />
          <Shimmer style={{ width: "95%", height: "14px", marginBottom: "6px" }} />
          <Shimmer style={{ width: "70%", height: "14px", marginBottom: "16px" }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          <Shimmer style={{ width: "50px", height: "18px", borderRadius: "4px" }} />
          <Shimmer style={{ width: "65px", height: "18px", borderRadius: "4px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
          <Shimmer style={{ width: "90px", height: "12px" }} />
          <Shimmer style={{ width: "80px", height: "14px" }} />
        </div>
      </div>
    ))}
  </div>
);

// 4. ContractsSkeleton - list cards
export const ContractsSkeleton = () => (
  <div className="gigs-marketplace-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
    {[1, 2, 3].map((i) => (
      <div key={i} className="glass-card" style={{ display: "flex", flexDirection: "column", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Shimmer style={{ width: "60px", height: "18px", borderRadius: "9999px" }} />
          <Shimmer style={{ width: "80px", height: "24px" }} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <Shimmer style={{ width: "120px", height: "16px", marginBottom: "16px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Shimmer style={{ width: "180px", height: "14px" }} />
            <Shimmer style={{ width: "150px", height: "14px" }} />
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginBottom: "20px" }}>
          <Shimmer style={{ width: "90px", height: "12px", marginBottom: "8px" }} />
          <Shimmer style={{ width: "140px", height: "14px" }} />
        </div>
        <Shimmer style={{ width: "100%", height: "36px", borderRadius: "8px" }} />
      </div>
    ))}
  </div>
);

// 5. ChatSidebarSkeleton - sidebar conversation lists
export const ChatSidebarSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)" }}>
        <Shimmer style={{ width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <Shimmer style={{ width: "90px", height: "14px" }} />
            <Shimmer style={{ width: "50px", height: "10px" }} />
          </div>
          <Shimmer style={{ width: "70%", height: "12px" }} />
        </div>
      </div>
    ))}
  </div>
);

// 6. ChatMessagesSkeleton - main message history window
export const ChatMessagesSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    {[1, 2, 3].map((i) => {
      const isLeft = i % 2 !== 0;
      return (
        <div key={i} style={{ display: "flex", justifyContent: isLeft ? "flex-start" : "flex-end", alignItems: "flex-end", gap: "8px" }}>
          {isLeft && <Shimmer style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0 }} />}
          <div style={{ display: "flex", flexDirection: "column", width: "50%" }}>
            <Shimmer 
              style={{ 
                height: "40px", 
                borderRadius: isLeft ? "12px 12px 12px 0" : "12px 12px 0 12px",
                background: isLeft ? "var(--secondary-bg)" : "rgba(124, 58, 237, 0.2)"
              }} 
            />
          </div>
        </div>
      );
    })}
  </div>
);

// 7. ProfileSkeleton - configurations page fields
export const ProfileSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "24px", padding: "32px" }}>
      <Shimmer style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flexGrow: 1 }}>
        <Shimmer style={{ width: "180px", height: "24px", marginBottom: "8px" }} />
        <Shimmer style={{ width: "240px", height: "14px" }} />
      </div>
    </div>
    <div className="glass-card" style={{ padding: "32px" }}>
      <Shimmer style={{ width: "200px", height: "20px", marginBottom: "24px" }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: "20px" }}>
          <Shimmer style={{ width: "120px", height: "12px", marginBottom: "8px" }} />
          <Shimmer style={{ width: "100%", height: "44px", borderRadius: "8px" }} />
        </div>
      ))}
      <Shimmer style={{ width: "160px", height: "40px", borderRadius: "8px", marginTop: "12px" }} />
    </div>
  </div>
);

