/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'smooth': ['Smooth Circulars', 'sans-serif'],
        'boruino': ['BORUINO', 'sans-serif'],
        'heathergreen': ['Heathergreen', 'sans-serif'],
        'specialagent': ['Special Agent', 'sans-serif'],
        'geometos': ['Geometos', 'sans-serif'],
        'antone': ['Antone', 'sans-serif'],
        'lemonmilk': ['LEMONMILK', 'sans-serif'],
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'blink-red-blue': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(59 130 246)' }
        },
        'blink-red-blue-dark': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(37 99 235)' }
        },
        'blink-red-green': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(34 197 94)' }
        },
        'blink-red-green-dark': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(22 163 74)' }
        },
        'blink-red-purple': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(168 85 247)' }
        },
        'blink-red-purple-dark': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(147 51 234)' }
        },
        'blink-red-orange': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(249 115 22)' }
        },
        'blink-red-orange-dark': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(234 88 12)' }
        },
        'blink-red-red': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(220 38 38)' }
        },
        'blink-red-red-dark': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(185 28 28)' }
        },
        'blink-red-indigo': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(99 102 241)' }
        },
        'blink-red-indigo-dark': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(79 70 229)' }
        },
        'blink-red-pink': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(236 72 153)' }
        },
        'blink-red-pink-dark': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(219 39 119)' }
        },
        'blink-red-teal': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(20 184 166)' }
        },
        'blink-red-teal-dark': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'rgb(13 148 136)' }
        },
        'blink-red-custom': {
          '0%, 50%': { backgroundColor: 'rgb(239 68 68)' },
          '25%, 75%': { backgroundColor: 'var(--original-bg-color, rgb(59 130 246))' }
        }
      }
    },
  },
  plugins: [],
};
