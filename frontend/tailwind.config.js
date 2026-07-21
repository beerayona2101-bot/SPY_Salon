/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rosegold: {
          300: '#F5D5C8',
          400: '#E5B287',
          500: '#E0A96D',
          600: '#C8868F',
          700: '#AA6B72'
        },
        champagne: {
          300: '#FFF2E2',
          400: '#F9E4D4',
          500: '#E8CEB5'
        },
        gold: {
          400: '#E6C65A',
          500: '#D4AF37',
          600: '#B59226'
        },
        purple: {
          500: '#7C3AED',
          600: '#6D28D9',
          900: '#2E1065'
        },
        dark: {
          900: '#0B0B0E',
          800: '#13131A',
          700: '#1A1A24',
          600: '#252533'
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-rosegold': '0 0 25px rgba(224, 169, 109, 0.4)',
        'glow-gold': '0 0 25px rgba(212, 175, 55, 0.35)',
        'glow-purple': '0 0 25px rgba(124, 58, 237, 0.35)'
      },
      backdropBlur: {
        '2xl': '24px'
      }
    },
  },
  plugins: [],
}
