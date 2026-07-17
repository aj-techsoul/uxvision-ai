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
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card-bg)",
        "card-border": "var(--card-border)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          dark: "var(--primary-dark)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          border: "var(--secondary-border)",
        },
        muted: "var(--muted)",
        accent: "var(--accent)",
        danger: "var(--danger)",
        success: "var(--success)",
      },
    },
  },
  plugins: [],
};
export default config;
