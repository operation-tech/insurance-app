/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        jadwa: "#247C94", // ✅ JADWA teal
      },
    },
  },
  plugins: [],
};
