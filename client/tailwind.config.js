/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-light': '#f8fafc',
        'brand-white': '#ffffff',
        'brand-pale-blue': '#e0f2fe',
        'brand-blue': '#0ea5e9',
        'brand-charcoal': '#334155',
        'brand-text': '#1e293b',
        'brand-muted': '#64748b',
        'brand-glass': 'rgba(255, 255, 255, 0.7)',
        'brand-glass-border': 'rgba(255, 255, 255, 0.5)',
      }
    },
  },
  plugins: [],
}
