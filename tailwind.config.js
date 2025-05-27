/** fixed colors block **/
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
	\tcolors: { cvdex: "var(--cvdex)", "cvdex-dark": "var(--cvdex-dark)" },
    extend: {
      colors: {
        cvdex: 'var(--cvdex)',
        'cvdex-dark': 'var(--cvdex-dark)',
      },
    },
  },
  plugins: [],
};
