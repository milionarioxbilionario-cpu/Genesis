// Fase 15.2: impostos sobre as vendas (puro, sem Prisma). Tudo em centavos inteiros.
//
// IVA (Codigo do IVA, Lei 22/2022, em vigor desde 01/01/2023): taxa normal 16%.
// Os precos de venda em Mocambique ja incluem o IVA, por isso o IVA de uma linha
// e a parte incluida: bruto x taxa / (100 + taxa). Produtos isentos (arroz, pao,
// farinha de milho, sal iodado…) ficam com taxa 0.
// ISPC (Lei 9/2025, desde 01/01/2026): volume de negocios anual ate 4 000 000 MT;
// 3% ate 1 000 000 MT, 4% ate 2 500 000 MT, 5% ate 4 000 000 MT; pago por trimestre.
// INSS: o patrao paga 4% dos salarios (o trabalhador 3%, descontado no salario).
// Fontes no Mapa Mental (Parte A, 15.2).

const { lineAmount } = require('../utils/units');

const VAT_STANDARD = 16;
const VAT_MODES = ['none', 'iva', 'ispc'];
const ISPC_BRACKETS = [
  { up_to: 100000000, pct: 3 }, // 1 000 000 MT
  { up_to: 250000000, pct: 4 }, // 2 500 000 MT
  { up_to: 400000000, pct: 5 }, // 4 000 000 MT
];
const ISPC_LIMIT = 400000000;
const INSS_EMPLOYER_PCT = 4;

const int = (v) => Math.trunc(Number(v || 0));

// Taxa efectiva de um produto: null/undefined = taxa normal do estabelecimento
// (16% por omissao; Etapa A: o dono pode mudar, ex. 15%); 0 = isento.
function productVatRate(rate, standard = VAT_STANDARD) {
  return rate === null || rate === undefined ? int(standard) : int(rate);
}

// Limites das taxas que o dono pode escrever (inteiros em %).
const RATE_MIN = 0;
const RATE_MAX = 30;

// Parte do IVA incluida num valor bruto (arredondada ao centavo, metade para cima).
function vatIncluded(gross, ratePct) {
  const g = int(gross); const r = int(ratePct);
  if (g <= 0 || r <= 0) return 0;
  return Math.floor((g * r * 2 + (100 + r)) / ((100 + r) * 2));
}

// Reparte o desconto da venda pelas linhas, proporcional ao bruto de cada uma
// (maiores restos): a soma bate sempre certo com o desconto.
function allocateDiscount(grossLines, discount) {
  const total = grossLines.reduce((s, g) => s + int(g), 0);
  const d = Math.min(int(discount), total);
  if (d <= 0 || total <= 0) return grossLines.map(() => 0);
  const raw = grossLines.map((g) => (int(g) * d) / total);
  const out = raw.map(Math.floor);
  let left = d - out.reduce((s, x) => s + x, 0);
  const order = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length][1]] += 1;
  return out;
}

// lines: [{ gross, rate }] (rate ja efectiva). Devolve o IVA da venda e de cada linha,
// calculado sobre o valor que o cliente pagou (depois do desconto).
function saleVat(lines, discount = 0) {
  const shares = allocateDiscount(lines.map((l) => l.gross), discount);
  const perLine = lines.map((l, i) => vatIncluded(int(l.gross) - shares[i], l.rate));
  return { vat_amount: perLine.reduce((s, v) => s + v, 0), lines: perLine };
}

// Escalao do ISPC para um volume de negocios anual. Acima do limite: nao e
// elegivel (over_limit) e usa-se a taxa do ultimo escalao so como referencia.
function ispcRate(annualTurnover) {
  const t = int(annualTurnover);
  const b = ISPC_BRACKETS.find((x) => t <= x.up_to);
  return b ? { pct: b.pct, over_limit: false } : { pct: ISPC_BRACKETS[ISPC_BRACKETS.length - 1].pct, over_limit: true };
}

// Estimativa do ISPC do mes: taxa pelo volume anual projectado a partir do ano
// ate ao fim deste mes (monthsElapsed = n.º do mes, 1..12).
function ispcEstimate({ monthTurnover, yearToDateTurnover, monthsElapsed }) {
  const m = Math.max(1, Math.min(12, int(monthsElapsed)));
  const projected = Math.round((int(yearToDateTurnover) * 12) / m);
  const { pct, over_limit } = ispcRate(projected);
  return { amount: Math.round((int(monthTurnover) * pct) / 100), pct, projected_annual: projected, over_limit };
}

// IVA do mes: cobrado nas vendas, incluido no custo do que se vendeu (estimativa:
// mesma taxa da linha) e a entregar = cobrado - custo, nunca negativo.
function monthVat({ sales = [], items = [] }) {
  const collected = sales.reduce((s, x) => s + int(x.vat_amount), 0);
  const onCost = items.reduce((s, it) => s + vatIncluded(lineAmount(it.quantity, it.unit_cost_price, it.unit), it.vat_rate == null ? 0 : int(it.vat_rate)), 0);
  return { collected, on_cost: onCost, due: Math.max(0, collected - onCost) };
}

module.exports = {
  VAT_STANDARD, VAT_MODES, ISPC_BRACKETS, ISPC_LIMIT, INSS_EMPLOYER_PCT, RATE_MIN, RATE_MAX,
  productVatRate, vatIncluded, allocateDiscount, saleVat, ispcRate, ispcEstimate, monthVat,
};
