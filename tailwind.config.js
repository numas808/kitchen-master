/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        background: '#FAFAF8',
        brand: {
          green: '#1A5C4A',
          orange: '#FF6B35',
        },
        cream: {
          DEFAULT: '#FFF8EF',
          input: '#FFF0E0',
          light: '#F0FBF7',
        },
        ink: {
          DEFAULT: '#3D2B1F',
          muted: '#A09080',
        },
      },
    },
  },
  plugins: [],
}

