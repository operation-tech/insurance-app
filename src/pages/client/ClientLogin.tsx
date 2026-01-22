// src/pages/client/ClientLogin.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "@/lib/supabase";

const BRAND_COLOR = "#1D6B7A"; // CMYK(85,45,37,24)

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email.toLowerCase().trim(), password);

    if (result.error) {
      alert("❌ " + result.error.message);
      setLoading(false);
      return;
    }

    // Ensure profile exists with role=client
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: email.toLowerCase().trim(),
        role: "client",
      });
    }

    navigate("/client/dashboard", { replace: true });
    setLoading(false);
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
          width: 380,
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
          Client Login
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 22,
          }}
        >
          Secure access to your insurance services
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

export default ClientLogin;

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
