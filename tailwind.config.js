/** Tailwind 3 clean config */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cvdex: 'var(--cvdex)',
        'cvdex-dark': 'var(--cvdex-dark)',
        'ikusi-green': '#4ac795',
        ikusi: {
          green: '#006b54',
          teal: '#0094a8',
          dark: '#002e24',
        },
      },
    },
  },
  plugins: [],
};
