/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {      colors: {
        accent: {
          DEFAULT: '#009e52',
          light: '#00bf63',
          dark: '#00733b',          50: '#e6f7ef',
          100: '#cceede',
          200: '#99ddbd',
          300: '#66cc9c',
          400: '#33bb7b',
          500: '#009e52',
          600: '#007e42',
          700: '#005e31',
          800: '#003f21',
          900: '#001f10',
        }
      },
    },
  },
  plugins: [],
}
