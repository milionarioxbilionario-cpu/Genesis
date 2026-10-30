// Fase 15.2: impostos (IVA, ISPC). node --test backend/tests/tax.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const tax = require('../src/services/tax');

test('IVA incluido a 16%: 116,00 MT tem 16,00 MT de IVA; arredonda metade para cima', () => {
  assert.equal(tax.vatIncluded(11600, 16), 1600);
  assert.equal(tax.vatIncluded(4500, 16), 621); // 4500*16/116 = 620,69
  assert.equal(tax.vatIncluded(1, 16), 0);
  assert.equal(tax.vatIncluded(29, 16), 4); // 4,0 exacto
  assert.equal(tax.vatIncluded(10000, 0), 0, 'isento');
  assert.equal(tax.vatIncluded(-5, 16), 0);
  // Contra a conta em decimal, para 0..20000 centavos: nunca mais de meio centavo de diferenca.
  for (let g = 0; g <= 20000; g += 7) assert.ok(Math.abs(tax.vatIncluded(g, 16) - (g * 16) / 116) <= 0.5, String(g));
});

test('taxa do produto: null = 16 (normal), 0 = isento', () => {
  assert.equal(tax.productVatRate(null), 16);
  assert.equal(tax.productVatRate(undefined), 16);
  assert.equal(tax.productVatRate(0), 0);
  // Etapa A: taxa normal do estabelecimento (ex.: 15%).
  assert.equal(tax.productVatRate(null, 15), 15);
  assert.equal(tax.productVatRate(0, 15), 0);
  assert.equal(tax.vatIncluded(11500, 15), 1500);
});

test('desconto repartido pelas linhas: soma certa, proporcional, sem centavos perdidos', () => {
  assert.deepEqual(tax.allocateDiscount([1000, 1000, 1000], 100), [34, 33, 33]);
  assert.deepEqual(tax.allocateDiscount([9000, 1000], 500), [450, 50]);
  assert.deepEqual(tax.allocateDiscount([500], 0), [0]);
  assert.deepEqual(tax.allocateDiscount([500, 500], 2000), [500, 500], 'desconto nunca passa do total');
  for (const d of [1, 7, 99, 333]) assert.equal(tax.allocateDiscount([123, 456, 789], d).reduce((a, b) => a + b, 0), d);
});

test('IVA da venda: sobre o que o cliente pagou, linha a linha, isentos fora', () => {
  const r = tax.saleVat([{ gross: 11600, rate: 16 }, { gross: 5000, rate: 0 }], 0);
  assert.deepEqual(r, { vat_amount: 1600, lines: [1600, 0] });
  // Desconto de 10% em tudo: IVA desce na mesma proporcao na linha com IVA.
  const d = tax.saleVat([{ gross: 11600, rate: 16 }, { gross: 5000, rate: 0 }], 1660);
  assert.equal(d.lines[0], tax.vatIncluded(11600 - 1160, 16));
  assert.equal(d.lines[1], 0);
});

test('ISPC: escaloes da Lei 9/2025 e limite de 4 milhoes', () => {
  assert.deepEqual(tax.ispcRate(100000000), { pct: 3, over_limit: false }); // 1 000 000 MT exactos
  assert.deepEqual(tax.ispcRate(100000001), { pct: 4, over_limit: false });
  assert.deepEqual(tax.ispcRate(250000000), { pct: 4, over_limit: false });
  assert.deepEqual(tax.ispcRate(400000000), { pct: 5, over_limit: false });
  assert.deepEqual(tax.ispcRate(400000001), { pct: 5, over_limit: true });
  // Marco com 300 000 MT ate ao fim de Marco: projeccao 1 200 000 MT -> 4%.
  const e = tax.ispcEstimate({ monthTurnover: 10000000, yearToDateTurnover: 30000000, monthsElapsed: 3 });
  assert.deepEqual(e, { amount: 400000, pct: 4, projected_annual: 120000000, over_limit: false });
});

test('IVA do mes: a entregar = cobrado - IVA incluido no custo do que se vendeu', () => {
  const m = tax.monthVat({
    sales: [{ vat_amount: 1600 }, { vat_amount: 621 }],
    items: [{ quantity: 2, unit_cost_price: 5800, vat_rate: 16 }, { quantity: 1, unit_cost_price: 3000, vat_rate: 0 }, { quantity: 1, unit_cost_price: 3000, vat_rate: null }],
  });
  assert.deepEqual(m, { collected: 2221, on_cost: 1600, due: 621 });
  assert.equal(tax.monthVat({ sales: [{ vat_amount: 10 }], items: [{ quantity: 1, unit_cost_price: 11600, vat_rate: 16 }] }).due, 0, 'nunca negativo');
});
