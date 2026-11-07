/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lattice: {
          dark: '#0B0F19',
          card: 'rgba(22, 30, 49, 0.65)',
          border: 'rgba(255, 255, 255, 0.12)',
          magenta: '#E11D48',
          'magenta-light': '#F43F5E',
          blue: '#0EA5E9',
          'blue-light': '#38BDF8',
          text: '#F8FAFC',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      backdropBlur: {
        xs: '4px',
        glass: '16px'
      }
    },
  },
  plugins: [],
}