import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0B0B",
        card: "#151515",
        hover: "#202020",
        border: "#2A2A2A",
        foreground: "#FFFFFF",
        muted: "#B5B5B5",
        light: "#E5E5E5",
        success: "#3DDC84",
        danger: "#FF4D4D",
        warning: "#FFC857"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
