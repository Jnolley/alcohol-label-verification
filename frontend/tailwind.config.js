/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // Accessible color palette with WCAG AA contrast ratios
      colors: {
        primary: '#2563eb', // Blue 600
        success: '#16a34a', // Green 600
        error: '#dc2626',   // Red 600
        warning: '#ca8a04', // Yellow 600
      },
    },
  },
  plugins: [],
}
