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
        primary: '#4ac795',    // Ikusi green
        secondary: '#6b7280',  // Gray-500 for borders/text
        accent: '#10b981',     // maybe for hover states
      },
      borderRadius: {
        xl: '1rem',
      },
      transitionProperty: {
        transform: 'transform',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
