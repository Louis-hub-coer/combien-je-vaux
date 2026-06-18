import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0F172A", soft: "#1E293B", night: "#0B1020" },
        slate: { DEFAULT: "#5B6479", soft: "#8A93A8" },
        line: "#E6E9F2",
        surface: "#F3F6FB",
        brand: { DEFAULT: "#00C389", dark: "#00A06E", tint: "#E1F7EF" },
        // Couleurs par catégorie (aussi disponibles via lib/constants pour les styles inline)
        immobilier: { DEFAULT: "#2F6BFF", tint: "#EAF1FF" },
        credit: { DEFAULT: "#7C3AED", tint: "#EEE7FD" },
        invest: { DEFAULT: "#F59E0B", tint: "#FEF1D8" },
        retraite: { DEFAULT: "#06B6D4", tint: "#DEF7FB" },
        impots: { DEFAULT: "#FF4D67", tint: "#FFE5EA" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,.05)",
        card: "0 1px 2px rgba(15,23,42,.04), 0 16px 32px -14px rgba(15,23,42,.16)",
        brand: "0 12px 26px -10px rgba(0,195,137,.55)",
        dark: "0 24px 60px -26px rgba(5,9,24,.6)",
        float: "0 14px 40px -14px rgba(5,9,24,.5)",
      },
      maxWidth: {
        container: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
