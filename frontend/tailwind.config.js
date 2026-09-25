/* ==========================================================================
   GENESIS — TAILWIND CONFIG
   O projeto estava escrito com classes utilitarias do Tailwind (flex, gap-3,
   md:grid-cols-2, ...) mas SEM configuracao: nada era gerado e o layout caia.
   Aqui o tema e mapeado 1:1 para os tokens de src/ui/tokens.css, para que
   exista UMA fonte de verdade visual (CSS vars) e as utilities funcionem.
   ========================================================================== */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        deep: 'var(--bg-deep)',
        elev: 'var(--bg-elev)',
        elev2: 'var(--bg-elev2)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          hover: 'var(--surface-hover)',
          solid: 'var(--surface-solid)',
        },
        line: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        ink: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          dim: 'var(--text-dim)',
        },
        /* Aliases planos: nomes curtos que as paginas ja usavam
           (text-muted, text-dim, border-strong) — sem eles essas classes
           nao geravam CSS nenhum. */
        muted: 'var(--text-muted)',
        dim: 'var(--text-dim)',
        strong: 'var(--border-strong)',
        brand: {
          DEFAULT: 'var(--brand)',
          hi: 'var(--brand-hi)',
          weak: 'var(--brand-weak)',
          text: 'var(--brand-text)',
        },
        ok: { DEFAULT: 'var(--ok)', weak: 'var(--ok-weak)' },
        warn: { DEFAULT: 'var(--warn)', weak: 'var(--warn-weak)' },
        danger: { DEFAULT: 'var(--danger)', weak: 'var(--danger-weak)' },
        info: { DEFAULT: 'var(--info)', weak: 'var(--info-weak)' },
        goal: { DEFAULT: 'var(--goal)', bonus: 'var(--goal-bonus)' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI Variable Text', 'Segoe UI', 'system-ui', '-apple-system', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Cascadia Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        full: 'var(--r-full)',
      },
      boxShadow: {
        xs: 'var(--sh-xs)',
        sm: 'var(--sh-sm)',
        md: 'var(--sh-md)',
        lg: 'var(--sh-lg)',
        brand: 'var(--sh-brand)',
        'inner-hi': 'var(--sh-inner-hi)',
      },
      transitionTimingFunction: {
        out: 'var(--e-out)',
        inout: 'var(--e-inout)',
        spring: 'var(--e-spring)',
      },
      transitionDuration: {
        fast: 'var(--d-fast)',
        base: 'var(--d-base)',
        slow: 'var(--d-slow)',
      },
      zIndex: {
        header: 'var(--z-header)',
        dropdown: 'var(--z-dropdown)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'rise-sm': {
          from: { opacity: '0', transform: 'translateY(5px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.965) translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(.9)' },
          '60%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(22px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-22px)' },
          to: { opacity: '1', transform: 'none' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.55' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-5px)' },
          '40%': { transform: 'translateX(5px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        'gradient-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--d-base) var(--e-out) both',
        rise: 'rise var(--d-base) var(--e-out) both',
        'rise-sm': 'rise-sm var(--d-fast) var(--e-out) both',
        'scale-in': 'scale-in var(--d-base) var(--e-out) both',
        pop: 'pop var(--d-base) var(--e-spring) both',
        'slide-in-right': 'slide-in-right var(--d-base) var(--e-out) both',
        'slide-in-left': 'slide-in-left var(--d-base) var(--e-out) both',
        shimmer: 'shimmer 1.5s linear infinite',
        float: 'float 3.2s var(--e-inout) infinite',
        'pulse-soft': 'pulse-soft 2s var(--e-inout) infinite',
        'spin-slow': 'spin-slow 1.1s linear infinite',
        shake: 'shake 420ms var(--e-out) both',
        'gradient-pan': 'gradient-pan 6s linear infinite alternate',
      },
    },
  },
  plugins: [],
};
