import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dde8ff",
          500: "#4f6bff",
          600: "#3a55ee",
          700: "#2d43c4",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
