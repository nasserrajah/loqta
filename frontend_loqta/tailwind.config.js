/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f3',
          100: '#d9ebe0',
          200: '#b7d9c4',
          300: '#8bc0a1',
          400: '#5ea07c',
          500: '#3d8761',
          600: '#2d6a4f',
          700: '#235342',
          800: '#1e4536',
          900: '#0f2b20',
        },
        accent: {
          500: '#f59e0b',
        },
        dark: '#1a1a1a',
        light: '#f5f7f5',
        cream: '#fafaf7',
      },
      fontFamily: {
        sans: ['Inter', 'Cairo', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.75rem',
      },
    },
  },
  plugins: [],
}