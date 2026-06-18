/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#01696f",
        background: "#f7f6f2",
      },
      fontFamily: {
        sans: ["Satoshi", "sans-serif"],
      },
      borderRadius: {
        card: "0.75rem",
        pill: "9999px",
      }
    },
  },
  plugins: [],
};
