/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#0f1020',
          indigo: '#4c5bff',
          lilac: '#b8c0ff',
        },
      },
      boxShadow: {
        glass: '0 40px 80px rgba(15,23,42,0.35)',
      },
    },
  },
  plugins: [],
};
