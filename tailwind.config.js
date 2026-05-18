/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        'brand-blue': 'rgb(6, 4, 129)',
        'brand-gold': '#D4AF37',
      },
    },
  },
  plugins: [],
}
