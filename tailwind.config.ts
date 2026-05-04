import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        muted: "var(--muted)",
        spade: "var(--suit-spade)",
        heart: "var(--suit-heart)",
        diamond: "var(--suit-diamond)",
        club: "var(--suit-club)",
        hud: "var(--hud)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      letterSpacing: {
        display: "-0.005em",
      },
      borderColor: {
        subtle: "var(--border)",
        strong: "var(--border-strong)",
      },
    },
  },
  plugins: [],
};

export default config;
