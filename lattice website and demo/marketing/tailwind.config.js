/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E11D48',
          light: '#F43F5E',
          dark: '#9F1239',
        },
        ink: {
          DEFAULT: '#0B0F19',
          soft: '#111827',
          line: '#1F2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 60px -15px rgba(225, 29, 72, 0.45)',
      },
    },
  },
  plugins: [],
};
