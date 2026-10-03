// Mesmo tema do frontend (fonte unica: frontend/tailwind.config.js).
const base = require('../frontend/tailwind.config.js');

module.exports = {
  ...base,
  content: ['./index.html', './src/**/*.{js,jsx}', '../frontend/src/components/ui/**/*.{js,jsx}'],
};
