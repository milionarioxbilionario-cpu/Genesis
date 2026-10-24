/* ==========================================================================
   GENESIS — TAILWIND DO SITE PUBLICO (Fase 11)
   As mesmas cores (tokens) que a app, mais as da marca; escala de texto maior
   (titulos de apresentacao). Usado so por site/site.css (@config).
   ========================================================================== */
const app = require('./tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './planos.html', './en/*.html', './site/**/*.js'],
  theme: {
    ...app.theme,
    colors: {
      ...app.theme.colors,
      brand: { DEFAULT: 'var(--brand)', dark: 'var(--brand-dark)', gold: 'var(--brand-gold)' },
    },
    fontSize: {
      ...app.theme.fontSize,
      md: ['17px', '28px'],
      lg: ['20px', '30px'],
      xl: ['24px', '32px'],
      '2xl': ['30px', '38px'],
      '3xl': ['38px', '46px'],
      '4xl': ['48px', '56px'],
    },
  },
  plugins: [],
};
