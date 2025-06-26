/** Tailwind 3+ Configuration for Acta UI Platform */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,html}'], // Tailwind scans these paths
  safelist: [
    'backdrop-blur-md',
    'peer-placeholder-shown:top-4',
    'peer-placeholder-shown:text-base',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        cvdex: 'var(--cvdex)',
        'cvdex-dark': 'var(--cvdex-dark)',
        'ikusi-green': '#4ac795',
        ikusi: {
          green: '#006b54',
          teal: '#0094a8',
          dark: '#002e24',
        },
        // Utility override
        emerald: { DEFAULT: '#4ac795' },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
