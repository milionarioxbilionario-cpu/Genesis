/* ==========================================================================
   GENESIS — TAILWIND (Genesis 2.0)
   Mapeado 1:1 para os tokens de src/ui/tokens.css. A paleta por omissao do
   Tailwind e SUBSTITUIDA (theme.colors, nao extend): nao existe "bg-red-500"
   nem "text-blue-400" — so as cores do sistema. Isto impede cores avulsas.
   ========================================================================== */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      subtle: 'var(--subtle)',
      'muted-bg': 'var(--muted-bg)',
      border: { DEFAULT: 'var(--border)', strong: 'var(--border-strong)' },
      ink: { DEFAULT: 'var(--text)', 2: 'var(--text-2)', muted: 'var(--text-muted)', faint: 'var(--text-faint)' },
      accent: { DEFAULT: 'var(--accent)', hover: 'var(--accent-hover)', soft: 'var(--accent-soft)', text: 'var(--accent-text)' },
      positive: { DEFAULT: 'var(--positive)', soft: 'var(--positive-soft)' },
      danger: { DEFAULT: 'var(--danger)', hover: 'var(--danger-hover)', soft: 'var(--danger-soft)' },
      warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
      info: { DEFAULT: 'var(--info)', soft: 'var(--info-soft)' },
    },
    fontFamily: { sans: 'var(--font)' },
    fontSize: {
      xs: ['12px', '16px'],
      sm: ['13px', '20px'],
      base: ['14px', '22px'],
      md: ['16px', '24px'],
      lg: ['20px', '28px'],
      xl: ['24px', '32px'],
      '2xl': ['30px', '36px'],
    },
    borderRadius: { none: '0', sm: 'var(--radius-sm)', DEFAULT: 'var(--radius)', lg: 'var(--radius-lg)', full: '9999px' },
    boxShadow: { none: 'none', pop: 'var(--shadow-pop)', focus: 'var(--focus)' },
    extend: {
      transitionDuration: { DEFAULT: '140ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)' },
      maxWidth: { content: '1200px' },
    },
  },
  plugins: [],
};
