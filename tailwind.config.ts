import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F9FB",
        foreground: "#111827",
        primary: {
          DEFAULT: "#06BFAE",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#111827",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#FF6B5B",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#EEF2F6",
          foreground: "#4B5563",
        },
        border: "#E5E7EB",
        card: "#FFFFFF",
        risk: {
          low: "#34C759",
          medium: "#FFB020",
          high: "#E5484D",
          unknown: "#A8A29E",
        },
      },
      boxShadow: {
        soft: "0 14px 32px rgba(15, 23, 42, 0.08)",
        lift: "0 10px 22px rgba(6, 191, 174, 0.22)",
      },
      borderRadius: {
        app: "1.25rem",
        chip: "999px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Plus Jakarta Sans",
          "Noto Sans Thai",
          "IBM Plex Sans Thai",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
