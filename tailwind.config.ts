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
        // Paleta LeadScout en modo claro: fondo blanco y la misma identidad
        // verde, pero oscurecida lo necesario para que el texto blanco sobre
        // los botones pase el contraste AA.
        bg: "#ffffff",
        "bg-2": "#f4f7f5",
        // #15803d es el verde más claro que aún da 5:1 con texto blanco, así
        // que los botones y el texto de acento pasan AA sobre fondo blanco.
        accent: "#15803d",
        "accent-dim": "#166534",
        ink: "#0f1a14",
        "ink-2": "#4b574f",
        line: "#dde5e0",
      },
      fontFamily: {
        // Alimentadas por next/font en app/layout.tsx.
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px #dde5e0, 0 10px 34px -20px rgba(21,128,61,0.4)",
        card: "0 1px 3px rgba(15,26,20,0.05), 0 10px 30px -20px rgba(15,26,20,0.25)",
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
