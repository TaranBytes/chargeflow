/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ev: {
          espresso: '#1B0C0C',
          /** Deep Olive */
          olive: '#313E17',
          /** Olive Moss */
          moss: '#4C5C2D',
          gold: '#FFDE42',
          goldHover: '#ffd000',
          goldDark: '#C8A900',
          sidebar: '#221414',
          fern: '#6D8A33',
          offline: '#B44A4A',
          /** Aliases — map old token names to new roles */
          ink: '#1B0C0C',
          deep: '#1B0C0C',
          forest: '#313E17',
          canopy: '#1B0C0C',
          sage: '#4C5C2D',
          aqua: '#4C5C2D',
          teal: '#4C5C2D',
          mint: '#6D8A33',
          cream: '#ffffff',
          soft: 'rgba(255,255,255,0.72)',
          sand: '#E4DFB5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 3px 0 rgba(0,0,0,0.06)',
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'stat-glow': 'inset 4px 0 0 0 #FFDE42, 0 0 24px -8px rgba(255, 222, 66, 0.35)',
        glow: '0 0 40px -12px rgba(255, 222, 66, 0.22)',
        'glow-aqua': '0 0 28px -8px rgba(76, 92, 45, 0.45)',
        float: '0 8px 32px rgba(0, 0, 0, 0.35)',
        'ring-teal': '0 0 0 1px rgba(255, 222, 66, 0.35), 0 12px 40px -12px rgba(0, 0, 0, 0.5)',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
      animation: {
        'pulse-soft': 'pulse 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'hero-glow': 'heroGlow 5s ease-in-out infinite',
        'badge-ping': 'badgePing 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        /** Login landing — compositor-friendly (opacity + transform only) */
        'login-rise': 'loginRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'login-rise-delay-1': 'loginRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.07s both',
        'login-rise-delay-2': 'loginRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.14s both',
        'login-rise-delay-3': 'loginRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.21s both',
        'login-rise-delay-4': 'loginRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.28s both',
        'login-car': 'loginCarIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both',
        'login-car-delay': 'loginCarIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both',
        'login-car-delay-2': 'loginCarIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both',
        'login-auth': 'loginAuthSwap 0.18s ease-out both',
      },
      keyframes: {
        heroGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.85' },
        },
        badgePing: {
          '75%, 100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        loginRise: {
          from: { opacity: '0', transform: 'translateY(1rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        loginCarIn: {
          from: { opacity: '0', transform: 'translateX(2.5rem)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        loginAuthSwap: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
