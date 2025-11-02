/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // === NOWA ANIMACJA ===
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
