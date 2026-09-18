/** Valores internos: centavos inteiros. A UI mostra e pede Meticais. */

export function mznToCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsToMznInput(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}
