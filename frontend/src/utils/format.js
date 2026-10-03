// Formatacao de apresentacao (Genesis 2.0). Internamente TUDO e centavos
// inteiros; so aqui se divide por 100. MZN escreve-se "MT" (uso corrente).
// useGrouping 'always': o pt-PT so agrupa a partir de 5 digitos (2000,00 vs 12 000,00),
// o que desalinhava colunas de dinheiro.
const moneyFmt = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const intFmt = new Intl.NumberFormat('pt-PT', { useGrouping: 'always' });

export function money(cents, { sign = false } = {}) {
  const n = Number(cents || 0) / 100;
  const s = moneyFmt.format(Math.abs(n)) + ' MT';
  if (n < 0) return '−' + s;
  return sign && n > 0 ? '+' + s : s;
}

export const int = (n) => intFmt.format(Number(n || 0));

export function pct(value, digits = 0) {
  return (Number(value || 0)).toFixed(digits).replace('.', ',') + '%';
}

export function date(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function time(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// "AAAA-MM-DD" na hora local (para inputs type=date e query strings).
export function isoDay(d = new Date()) {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

export const PAYMENT_LABEL = { cash: 'Dinheiro', card: 'Cartão / POS', mobile_money: 'M-Pesa / e-Mola' };

export function errorMessage(err, fallback = 'Ocorreu um erro. Tente de novo.') {
  const raw = err?.response?.data?.error;
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (!err?.response) return 'Sem ligação ao servidor.';
  return fallback;
}
