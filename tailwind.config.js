/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        secondary: "#E81D23",
        tertiary: "#333333",
        gray: "#d9d9d9",
        darkGray: "#9E9E9E",
        offWhite: "#F5F5F5",
        lightRed: "#FFC1C1",
        fire: "#FF9501",
        yellow: "#FFD700",
        green: "#00A859",
        blue: "#0989FF",
      },
    },
  },
  plugins: [],
};
