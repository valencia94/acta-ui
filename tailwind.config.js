export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ikusi: {
          DEFAULT: "#00a878",
          dark: "#00815c",
        },
        cvdex: {
          DEFAULT: "#003366",
          light: "#0051a3",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
