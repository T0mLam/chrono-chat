import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import scrollbarHide from "tailwind-scrollbar-hide";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    typography,
    scrollbarHide,
  ],
};

export default config;
