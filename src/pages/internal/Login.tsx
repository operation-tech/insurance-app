// src/pages/internal/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const BRAND_COLOR = "#1D6B7A"; // CMYK(85,45,37,24)

const BrokerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    setLoading(false);

    if (error) {
      alert("❌ " + error.message);
      return;
    }

    console.log("✅ Broker/Admin logged in:", data);
    navigate("/internal/dashboard", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          width: 400,
          background: "#ffffff",
          padding: "42px 36px",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        {/* BRAND */}
        <img
          src="/J-shape.svg"
          alt="Jadwa mark"
          style={{ height: 72, marginBottom: 14 }}
        />

        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4,
            color: BRAND_COLOR,
            marginBottom: 4,
          }}
        >
          JADWA
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#000",
            marginBottom: 26,
          }}
        >
          Customer Centricity
        </div>

        {/* TITLE */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Internal System Login
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 22,
          }}
        >
          Authorized access for brokers and administrators
        </div>

        {/* INPUTS */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </motion.form>
    </div>
  );
};

export default BrokerLogin;

/* ---------- STYLES ---------- */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  marginBottom: 14,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};
