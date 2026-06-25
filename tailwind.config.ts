import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#07080d',
          800: '#0b0d14',
          700: '#11131c',
          600: '#171a26',
        },
        glass: 'rgba(255,255,255,0.04)',
        line: 'rgba(255,255,255,0.08)',
        accent: {
          // Theme-driven via CSS vars (set by applyPrefs); fall back to violet.
          DEFAULT: 'rgb(var(--accent, 124 92 255) / <alpha-value>)',
          soft: '#9d86ff',
          cyan: 'rgb(var(--accent-cyan, 54 230 224) / <alpha-value>)',
          violet: '#a855f7',
          indigo: '#6366f1',
        },
        good: '#34d399',
        warn: '#fbbf24',
        bad: '#fb7185',
        area: {
          mba: '#7c5cff',
          qr: '#36e6e0',
          crm: '#fb923c',
          learn: '#60a5fa',
          gym: '#34d399',
          finance: '#fbbf24',
          personal: '#f472b6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(124,92,255,0.45)',
        'glow-cyan': '0 0 40px -8px rgba(54,230,224,0.4)',
        card: '0 8px 40px -12px rgba(0,0,0,0.6)',
      },
      // Use the dynamic viewport unit so mobile URL-bar show/hide doesn't jump layout.
      height: {
        screen: '100dvh',
      },
      minHeight: {
        screen: '100dvh',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        aurora: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(4%,-6%) scale(1.1)' },
          '66%': { transform: 'translate(-4%,4%) scale(0.95)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        aurora: 'aurora 18s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
