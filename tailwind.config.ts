import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-container": "var(--primary-container)",
        surface: "var(--surface)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",
        tertiary: "var(--tertiary)",
        secondary: "var(--secondary)",
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",
        // Plusieurs écrans utilisent encore les classes Tailwind blue-* par
        // défaut : retintées en teal pour suivre la charte CHU.
        blue: {
          50: '#eaf6f9', 100: '#d6eef3', 200: '#aedce6', 300: '#7fc3d3',
          400: '#4aa8be', 500: '#0a7ea4', 600: '#006a8c', 700: '#004a66',
          800: '#003847', 900: '#012430',
        },
        purple: { 100: '#d6eef3', 700: '#004a66' },
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "Manrope"],
        body: ["var(--font-inter)", "Inter"],
      },
    },
  },
  plugins: [],
};

export default config;