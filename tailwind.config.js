/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
	\tcolors: { cvdex: "var(--cvdex)", "cvdex-dark": "var(--cvdex-dark)" },
    extend: {
      colors: {
        ikusi: {
          600: '#00815c',
          700: '#006c4d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
