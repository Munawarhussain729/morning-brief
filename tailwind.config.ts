import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15191f",
        mist: "#eef2f6",
        graphite: "#242933",
        signal: "#0f766e",
        amberline: "#f59e0b",
        danger: "#dc2626"
      },
      boxShadow: {
        mac: "0 20px 60px rgba(15, 23, 42, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
