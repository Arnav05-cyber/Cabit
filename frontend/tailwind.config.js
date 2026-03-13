/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        cabit: {
          navy: '#1A237E',
          blue: '#1565C0',
          accent: '#42A5F5',
          light: '#E3F2FD',
          dark: '#0D1B6E',
          card: '#F5F7FF',
        }
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
