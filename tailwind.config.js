/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkbg: "#0f172a",
        darkpanel: "#1e293b",
        darkborder: "#334155",
      },
    },
  },
  plugins: [],
}
