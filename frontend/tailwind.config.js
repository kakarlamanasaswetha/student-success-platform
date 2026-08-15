/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6fe',
          200: '#bfd1fe',
          300: '#93b1fc',
          400: '#6088f8',
          500: '#3b63f0',
          600: '#2745e4',
          700: '#2136c9',
          800: '#212fa2',
          900: '#202d80',
        },
      },
    },
  },
  plugins: [],
};
