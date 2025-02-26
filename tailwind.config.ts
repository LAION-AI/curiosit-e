import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "surface": {
          DEFAULT: "#fff",
          dark: "#121212"
        }
      },
      borderColor: {
        DEFAULT: "#e6e7e7", // in School Bud-E: "rgb(214, 201, 161)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fadeIn 1s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
