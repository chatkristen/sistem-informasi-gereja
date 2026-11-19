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
        navy: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#1e3a5f",
          900: "#0b2046",
          950: "#06132b",
        },
        gold: {
          50: "#fefdf5",
          100: "#fdf8e6",
          200: "#faecc0",
          300: "#f6dc90",
          400: "#f0c656",
          500: "#d4af37", // Classic Church Gold
          600: "#b88e1e",
          700: "#926b15",
          800: "#745214",
          900: "#614316",
          950: "#392408",
        },
      },
    },
  },
  plugins: [],
};
export default config;
