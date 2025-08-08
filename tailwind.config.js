module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./src/**/*.css"],
  safelist: [
    "peer",
    "peer-focus",
    "peer-placeholder-shown",
    "peer-[:not(:placeholder-shown)]",
    "peer-[&:not(:placeholder-shown)]",
    "text-xs",
    "top-2",
    "text-green-600",
    "rounded-xl",
    "bg-white",
    "text-gray-900",
    "h-12",
  ],
  theme: {
    extend: {
      colors: {
        // Ikusi UI Style Reference Sheet Colors
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        borders: "var(--color-borders)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        secondary: "var(--color-secondary)",
        body: "var(--color-body)",
        muted: "var(--color-muted)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        
        // Legacy compatibility
        primary: "var(--color-primary)",
        neutral: "var(--color-neutral)",
        "bg-default": "var(--color-bg-default)",
        "text-default": "var(--color-text-default)",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
        slow: "var(--transition-slow)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
