import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: 'rgb(var(--c-forest) / <alpha-value>)', 600: 'rgb(var(--c-forest-600) / <alpha-value>)', 700: 'rgb(var(--c-forest) / <alpha-value>)', 800: 'rgb(var(--c-forest-800) / <alpha-value>)', 900: 'rgb(var(--c-deep) / <alpha-value>)' },
        deep: 'rgb(var(--c-deep) / <alpha-value>)',
        ivory: 'rgb(var(--c-ivory) / <alpha-value>)',
        sand: { DEFAULT: 'rgb(var(--c-sand) / <alpha-value>)', 100: 'rgb(var(--c-sand-100) / <alpha-value>)' },
        charcoal: '#202520',
        muted: '#6B726C',
        line: '#E7E3D8',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      keyframes: {
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        spinRev: { to: { transform: 'rotate(-360deg)' } },
        floatY: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-18px)' } },
        drift: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(40px,-30px) scale(1.12)' } },
        twinkle: { '0%,100%': { opacity: '.15' }, '50%': { opacity: '.9' } },
        sheen: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
      },
      animation: {
        'spin-slow': 'spinSlow 80s linear infinite', 'spin-rev': 'spinRev 120s linear infinite',
        float: 'floatY 7s ease-in-out infinite', drift: 'drift 18s ease-in-out infinite',
        twinkle: 'twinkle 4s ease-in-out infinite', sheen: 'sheen 8s linear infinite',
      },
      borderRadius: { card: '12px' },
      boxShadow: { soft: '0 1px 2px rgba(32,37,32,.04), 0 4px 16px rgba(32,37,32,.05)' },
    },
  },
  plugins: [],
};
export default config;
