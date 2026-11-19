import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          bg: "#060D0A",
          card: "#0D1914",
          border: "rgba(16, 185, 129, 0.2)",
          emerald: "#10B981",
          cyan: "#06B6D4",
          alert: "#EF4444",
          muted: "#13231C",
          subtext: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      }
    },
  },
  plugins: [],
};
export default config;
