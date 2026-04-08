/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0f172a',
        'brand-panel': 'rgba(30, 41, 59, 0.7)',
        'brand-accent': '#8b5cf6',
      }
    },
  },
  plugins: [],
}
