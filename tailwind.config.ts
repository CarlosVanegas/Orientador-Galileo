/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          galileo: {
            navy: '#1B2E4B',
            'navy-light': '#243B5E',
            'navy-dark': '#132033',
            sky: '#5B9BD5',
            'sky-light': '#7DB5E0',
            'sky-dark': '#3A7BC0',
            terracotta: '#C8846A',
            'terracotta-light': '#D9A590',
            'terracotta-dark': '#B56B4E',
            gray: '#F8FAFC',
          },
        },
        fontFamily: {
          heading: ['"Plus Jakarta Sans"', 'sans-serif'],
          body: ['Inter', 'sans-serif'],
        },
        animation: {
          'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'fade-in': 'fade-in 0.5s ease-out',
          'slide-up': 'slide-up 0.5s ease-out',
          'typewriter-cursor': 'blink 1s step-end infinite',
        },
        keyframes: {
          'pulse-ring': {
            '0%': { transform: 'scale(0.8)', opacity: '1' },
            '100%': { transform: 'scale(2.4)', opacity: '0' },
          },
          'fade-in': {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          'slide-up': {
            '0%': { opacity: '0', transform: 'translateY(20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          blink: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0' },
          },
        },
      },
    },
    plugins: [],
  }