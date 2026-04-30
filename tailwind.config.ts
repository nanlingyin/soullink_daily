import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2b2533",
        cream: "#fff8f1"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(162, 112, 171, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
