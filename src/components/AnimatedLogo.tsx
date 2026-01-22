export default function AnimatedLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "4px",
          color: "#1D6B7A", // SAME BRAND COLOR
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        JADWA
      </div>

      <div
        style={{
          fontSize: 12,
          letterSpacing: "1.5px",
          color: "#6b7280",
          marginTop: 2,
        }}
      >
        Customer Centricity
      </div>
    </div>
  );
}
