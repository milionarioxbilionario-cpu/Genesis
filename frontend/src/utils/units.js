// Fase 15.5: venda ao peso / medida (espelho de backend/src/utils/units.js; o
// teste units.test.mjs garante que dao o mesmo resultado).
// Produto 'un' = unidades inteiras. 'kg' | 'l' | 'm' = quantidades em milesimos
// inteiros (g, ml, mm) e preco por kg/l/m. Nunca ha floats guardados.
import { locale } from '../i18n/core.js';

export const UNITS = ['un', 'kg', 'l', 'm'];
const SCALE = { un: 1, kg: 1000, l: 1000, m: 1000 };

export const scaleOf = (unit) => SCALE[unit] || 1;
export const isMeasured = (unit) => scaleOf(unit) > 1;

// Valor em centavos (arredonda ao centavo, metade para cima, so a peso/medida).
export function lineAmount(qty, price, unit = 'un') {
  const q = Math.trunc(Number(qty || 0));
  const p = Math.trunc(Number(price || 0));
  const s = scaleOf(unit);
  if (s === 1) return q * p;
  const raw = q * p;
  return raw >= 0 ? Math.floor((raw * 2 + s) / (2 * s)) : -Math.floor((-raw * 2 + s) / (2 * s));
}

export const humanQty = (qty, unit = 'un') => Math.round((Number(qty || 0) / scaleOf(unit)) * 1000) / 1000;

// «3» | «1,25 kg» | «0,5 l» na lingua de quem ve. `q` ja na escala do produto (milesimos).
export function formatQty(qty, unit = 'un') {
  if (!isMeasured(unit)) return Number(qty || 0).toLocaleString(locale());
  return humanQty(qty, unit).toLocaleString(locale(), { maximumFractionDigits: 3 }) + ' ' + unit;
}

// Quantidade «humana» ja calculada (rankings do servidor) -> texto.
export function formatHuman(value, unit = 'un') {
  const n = Number(value || 0).toLocaleString(locale(), { maximumFractionDigits: 3 });
  return isMeasured(unit) ? n + ' ' + unit : n;
}

// «1,250» / «1.25» / «0,5» kg -> 1250 (milesimos). Unidades: so inteiros.
// Devolve null se o texto nao for um numero valido.
export function parseQty(text, unit = 'un') {
  const raw = String(text ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (!raw) return null;
  if (!/^\d+(\.\d{0,3})?$/.test(raw)) return null;
  if (!isMeasured(unit)) return /^\d+$/.test(raw) ? Number(raw) : null;
  const [i, f = ''] = raw.split('.');
  return Number(i) * 1000 + Number((f + '000').slice(0, 3));
}

// Para preencher um campo a partir de milesimos: 1250 -> «1,25» (pt) / «1.25» (en).
export function qtyInput(qty, unit = 'un') {
  if (!isMeasured(unit)) return qty ? String(qty) : '';
  return qty ? humanQty(qty, unit).toLocaleString(locale(), { maximumFractionDigits: 3, useGrouping: false }) : '';
}
