import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { useRoles } from "./context/RoleContext";

import AnimatedLogo from "./components/AnimatedLogo";
import HeroBrandAnimation from "./components/HeroBrandAnimation";

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isClient, loading } = useRoles();

  if (loading) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f9",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TOP BAR */}
      <header
        style={{
          padding: "24px 48px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <AnimatedLogo />
      </header>

      {/* HERO SECTION */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            padding: "80px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1.25,
              color: "#111827",
            }}
          >
            JADWA, <br /> made simple and controlled
          </h1>
          
          <p style={{ fontSize: 18, color: "#555", maxWidth: 420 }}>
            Access your insurance services, manage requests, and track
            operations through a unified digital platform.
          </p>

          {/* ACTIONS */}
          {!user && (
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <PrimaryButton onClick={() => navigate("/client/login")}>
                Client Portal
              </PrimaryButton>
              <SecondaryButton onClick={() => navigate("/internal/login")}>
                Internal System
              </SecondaryButton>
            </div>
          )}

          {user && (
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {isClient && (
                <PrimaryButton
                  onClick={() => navigate("/client/dashboard")}
                >
                  Continue as Client
                </PrimaryButton>
              )}
              {isAdmin && (
                <SecondaryButton
                  onClick={() => navigate("/internal/dashboard")}
                >
                  Continue as Admin
                </SecondaryButton>
              )}
            </div>
          )}
        </motion.div>

        {/* RIGHT BRAND ANIMATION (REPLACES IMAGE) */}
        <div
          style={{
            background: "#eef2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeroBrandAnimation />
        </div>
      </div>
    </div>
  );
};

/* ---------------- BUTTONS ---------------- */

const PrimaryButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    style={{
      padding: "14px 28px",
      borderRadius: 10,
      border: "none",
      background: "#1e40af",
      color: "#fff",
      fontSize: 16,
      cursor: "pointer",
    }}
  >
    {children}
  </motion.button>
);

const SecondaryButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    style={{
      padding: "14px 28px",
      borderRadius: 10,
      border: "1px solid #1e40af",
      background: "transparent",
      color: "#1e40af",
      fontSize: 16,
      cursor: "pointer",
    }}
  >
    {children}
  </motion.button>
);

export default Welcome;
