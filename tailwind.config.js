/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0f1419',
          lighter: '#1a1f2e',
          lightest: '#252b3b',
        },
        foreground: {
          DEFAULT: '#e8eaed',
          muted: '#9ca3af',
        },
        poker: {
          50: '#e6f7ee',
          100: '#b3e6cc',
          200: '#80d4aa',
          300: '#4dc388',
          400: '#1ab166',
          500: '#0d9e4d',
          600: '#0a7e3e',
          700: '#085e2f',
          800: '#053f20',
          900: '#031f10',
        },
      },
    },
  },
  plugins: [],
}
