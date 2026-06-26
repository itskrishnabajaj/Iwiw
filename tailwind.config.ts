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
      // Use the STABLE small-viewport unit. Unlike 100dvh (which recomputes every
      // frame as the mobile URL bar collapses → scroll-time layout thrash) and
      // 100vh (content hidden under the URL bar), 100svh is fixed and never resizes.
      height: {
        screen: '100svh',
      },
      minHeight: {
        screen: '100svh',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        // Only `shimmer` remains — used by the loading Skeleton (shown briefly,
        // not at idle). The continuous aurora/float/pulse-glow loops were removed
        // to keep the UI visually quiet when nothing is happening.
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
