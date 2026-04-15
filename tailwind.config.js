/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: { 
      colors: {
        barber: {
          gold: "#C0A060",
          black: "#141414",
          dark: "#1E1E1E",
          light: "#F2F2F2",
          gray: "#8E8E8E",
          white: "#FFFFFF",
          wine: "#7A1F2B",
          navy: "#0E1A2B",
          info: "#4DA3FF",
        },
      },
    },
  },
  plugins: [],
};
