/** Tailwind 3 clean config */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,html}'],
  safelist: [
    'backdrop-blur-md',
    'peer-placeholder-shown:top-4',
    'peer-placeholder-shown:text-base',
  ],
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
        emerald: { DEFAULT: '#4ac795' },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
