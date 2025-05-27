/** Tailwind 3 clean config */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cvdex: 'var(--cvdex)',
        'cvdex-dark': 'var(--cvdex-dark)',
      },
    },
  },
  plugins: [],
};
