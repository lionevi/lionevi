import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Palette IdeaMarket Africa
        primary: {
          DEFAULT: '#E8622A', // orange / terracotta africain
          foreground: '#FFFFFF',
          50: '#FDF0EA',
          100: '#FADBCD',
          200: '#F5B79B',
          300: '#F09369',
          400: '#EC7B47',
          500: '#E8622A',
          600: '#C74E1D',
          700: '#993C16',
          800: '#6B2A0F',
          900: '#3D1809',
        },
        secondary: {
          DEFAULT: '#D4A843', // or / sable
          foreground: '#1A1A2E',
          50: '#FBF6E9',
          100: '#F4E8C4',
          200: '#E9D28A',
          300: '#DEBD5F',
          400: '#D4A843',
          500: '#BC9134',
          600: '#94722A',
          700: '#6C531F',
          800: '#443415',
          900: '#1C150A',
        },
        accent: {
          DEFAULT: '#2D5016', // vert foret
          foreground: '#FFFFFF',
          50: '#EEF5E8',
          100: '#D6E6C7',
          200: '#AECC8F',
          300: '#85B357',
          400: '#5E8B33',
          500: '#2D5016',
          600: '#254212',
          700: '#1C330E',
          800: '#132309',
          900: '#0A1305',
        },
        background: '#FAFAF7', // blanc casse
        foreground: '#1A1A2E', // texte fonce
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        muted: {
          DEFAULT: '#F1F0EA',
          foreground: '#6B6B7B',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A2E',
        },
        border: '#E6E4DC',
        input: '#E6E4DC',
        ring: '#E8622A',
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'Sora', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(160deg, rgba(232,98,42,0.10) 0%, rgba(212,168,67,0.08) 45%, rgba(45,80,22,0.06) 100%)',
        'hero-gradient': 'linear-gradient(135deg, #FAFAF7 0%, #FBF1E9 55%, #F6E9D2 100%)',
        'image-fade': 'linear-gradient(to top, rgba(26,26,46,0.72) 0%, rgba(26,26,46,0.15) 45%, rgba(26,26,46,0) 100%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-soft': 'pulseSoft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
