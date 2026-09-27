import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta LeadScout (SPEC.md): verde muy oscuro -> verde brillante.
        bg: "#0d2b1e",
        "bg-2": "#1e4a30",
        accent: "#4ade80",
        "accent-dim": "#22c55e",
        ink: "#ffffff",
        "ink-2": "#a3b8a8",
        line: "#2d5a3d",
      },
      fontFamily: {
        // Alimentadas por next/font en app/layout.tsx.
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px #2d5a3d, 0 18px 50px -20px rgba(74,222,128,0.35)",
        card: "0 10px 30px -18px rgba(0,0,0,0.8)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s ease-out both",
        shimmer: "shimmer 2.2s linear infinite",
        "spin-slow": "spin-slow 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
