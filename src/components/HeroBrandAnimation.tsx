import { motion } from "framer-motion";

const letters = ["J", "A", "D", "W", "A"];
const BRAND_COLOR = "#1D6B7A"; // CMYK(85,45,37,24)

export default function HeroBrandAnimation() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        {/* J SHAPE (STATIC) */}
        <img
          src="/JADWA.svg"
          alt="Jadwa mark"
          style={{
            height: 160,
            marginBottom: 10,
          }}
        />

        {/* JADWA LETTERS (ANIMATED) */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.2 },
            },
          }}
          style={{
            display: "flex",
            gap: 14,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "6px",
            color: BRAND_COLOR,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {letters.map((char, index) => (
            <motion.span
              key={index}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.45,
                    ease: "easeOut",
                  },
                },
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* CUSTOMER CENTRICITY (BOLD BLACK) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.4 }}
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "2px",
            color: "#000000",
          }}
        >
          Customer Centricity
        </motion.div>
      </div>
    </div>
  );
}
