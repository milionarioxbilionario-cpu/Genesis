// Formatacao de apresentacao (Genesis 2.0). Internamente TUDO e centavos
// inteiros; so aqui se divide por 100. MZN escreve-se "MT" (uso corrente).
// useGrouping 'always': o pt-PT so agrupa a partir de 5 digitos (2000,00 vs 12 000,00),
// o que desalinhava colunas de dinheiro.
// Fase 9.3: numeros e datas na lingua da pessoa (pt-PT ou en-GB, i18n/core.js).
import { hasTranslation, locale, t } from '../i18n/core.js';

const fmtCache = new Map();
function numberFmt(kind) {
  const loc = locale();
  const key = loc + ':' + kind;
  if (!fmtCache.has(key)) {
    fmtCache.set(key, kind === 'money'
      ? new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' })
      : new Intl.NumberFormat(loc, { useGrouping: 'always' }));
  }
  return fmtCache.get(key);
}

export function money(cents, { sign = false } = {}) {
  const n = Number(cents || 0) / 100;
  const s = numberFmt('money').format(Math.abs(n)) + ' MT';
  if (n < 0) return '−' + s;
  return sign && n > 0 ? '+' + s : s;
}

export const int = (n) => numberFmt('int').format(Number(n || 0));

export function pct(value, digits = 0) {
  const s = (Number(value || 0)).toFixed(digits);
  return (locale() === 'pt-PT' ? s.replace('.', ',') : s) + '%';
}

export function date(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale(), { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString(locale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function time(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

// Hora com segundos (rastreio dos relatorios: "14:03:27").
export function timeSec(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// "AAAA-MM-DD" na hora local (para inputs type=date e query strings).
export function isoDay(d = new Date()) {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

// mobile_money = vendas de antes de separar M-Pesa e e-Mola (2.1).
// Cada leitura passa por t(): PAYMENT_LABEL[m] e Object.entries(PAYMENT_LABEL)
// saem na lingua actual sem mudar quem os usa.
const PAYMENT_PT = { cash: 'Dinheiro', mpesa: 'M-Pesa', emola: 'e-Mola', card: 'Cartão / POS', mobile_money: 'M-Pesa/e-Mola (antigo)' };
export const PAYMENT_LABEL = new Proxy(PAYMENT_PT, {
  get: (target, key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(target, key) ? t(target[key]) : target[key]),
});

// A mensagem do servidor vem em portugues; noutra lingua traduz-se pelo texto
// exacto ou, se tiver partes variaveis (ex.: o email), pelo `code` com os
// `params` que o servidor manda. Se faltar um valor, fica a mensagem dele.
export function errorMessage(err, fallback = 'Ocorreu um erro. Tente de novo.') {
  const data = err?.response?.data;
  const raw = data?.error;
  if (typeof raw === 'string' && raw.trim()) {
    if (data.code && hasTranslation('code:' + data.code)) {
      const msg = t('code:' + data.code, data.params || {});
      if (!/\{\w+\}/.test(msg)) return msg;
    }
    return t(raw);
  }
  if (!err?.response) return t('Sem ligação ao servidor.');
  return t(fallback);
}

// Nome do mes (1-12): portugues como sempre ("Outubro"); outras linguas pelo Intl.
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export function monthName(m) {
  if (locale() === 'pt-PT') return MONTHS_PT[m - 1];
  const s = new Date(2026, m - 1, 1).toLocaleDateString(locale(), { month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
