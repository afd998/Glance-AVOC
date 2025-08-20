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
        }
      }
    },
  },
  plugins: [],
};
