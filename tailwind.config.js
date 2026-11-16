import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './dossier/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette commune à la plateforme (modèle : consultation externe)
        // Surfaces
        "surface": "#F8F9FB",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#F8FAFC",
        "surface-container": "#F1F5F9",
        "surface-container-high": "#E2E8F0",
        "surface-container-highest": "#CBD5E1",
        // Textes
        "on-surface": "#0F172A",
        "on-surface-variant": "#475569",
        // Primaire
        "primary": "#006A8C",
        "primary-container": "#005a76",
        "primary-fixed": "#F0F7FF",
        "on-primary": "#ffffff",
        // Secondaire
        "secondary": "#475569",
        "secondary-container": "#E2E8F0",
        "secondary-fixed": "#F0F7FF",
        "on-secondary": "#ffffff",
        // Tertiaire (urgence / STAT)
        "tertiary": "#E11D48",
        "tertiary-container": "#BE123C",
        "tertiary-fixed": "#FFE4E6",
        "on-tertiary": "#ffffff",
        // Erreur
        "error": "#E11D48",
        "error-container": "#FFE4E6",
        "on-error": "#ffffff",
        // Bordures
        "outline": "#64748B",
        "outline-variant": "#E2E8F0",
        // Inverse
        "inverse-surface": "#0F172A",
        "inverse-primary": "#7FD4E8",
        "inverse-on-surface": "#F1F5F9",
        // Classes Tailwind blue-* / purple-* encore présentes : retintées sur la
        // palette commune (primaire #006A8C, foncé #004A66).
        blue: {
          50: '#F0F7FF', 100: '#E0EFFA', 200: '#CFE9EF', 300: '#7FC3D3',
          400: '#4AA8BE', 500: '#0A7EA4', 600: '#006A8C', 700: '#005a76',
          800: '#004A66', 900: '#003847',
        },
        purple: { 100: '#E0EFFA', 700: '#004A66' },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        headline: ["var(--font-sans)", "Manrope", "sans-serif"],
        body: ["var(--font-sans)", "Manrope", "sans-serif"],
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'stat-pulse': 'stat-pulse 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};

export default config;