import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-bg": "#000000",
        "brand-purple": "#D572E0",
        "brand-orange": "#D9672E",
        "brand-teal": "#26DED2",
        "brand-white": "#FFFFFF",
        "brand-surface": "rgba(255,255,255,0.04)",
        "brand-border": "rgba(255,255,255,0.08)",
        "brand-border-hover": "rgba(255,255,255,0.15)",
        "brand-text-muted": "rgba(255,255,255,0.5)",
      },
      fontFamily: {
        sans: ["var(--font-league-spartan)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-h1": ["72px", { lineHeight: "1.2", fontWeight: "500" }],
        "h2": ["48px", { lineHeight: "1.2", fontWeight: "500" }],
        "h3": ["32px", { lineHeight: "1.3", fontWeight: "500" }],
        "body-large": ["14.4px", { lineHeight: "1.5", fontWeight: "500" }],
        "body": ["12px", { lineHeight: "1.5", fontWeight: "500" }],
        "button": ["15px", { lineHeight: "1.4", fontWeight: "600" }],
        "label": ["13px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      spacing: {
        "0": "0",
        "1": "8px",
        "2": "16px",
        "3": "24px",
        "5": "40px",
        "8": "64px",
        "10": "80px",
        "12": "96px",
      },
      borderRadius: {
        "none": "0",
        "sm": "8px",
        "md": "12px",
        "lg": "24px",
        "xl": "36px",
        "2xl": "60px",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0, 0, 0, 0.4)",
        "glow-purple": "0 0 30px rgba(213, 114, 224, 0.15)",
        "glow-teal": "0 0 30px rgba(38, 222, 210, 0.12)",
        "glow-orange": "0 0 30px rgba(217, 103, 46, 0.12)",
      },
      backdropBlur: {
        "glass": "10px",
      },
    },
  },
  plugins: [],
};

export default config;
