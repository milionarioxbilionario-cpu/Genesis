// Fase 15.5: venda ao peso. node --test backend/tests/units.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { lineAmount, humanQty, qtyText, scaleOf } = require('../src/utils/units');

test('unidades: como sempre, quantidade x preco', () => {
  assert.equal(lineAmount(3, 4500), 13500);
  assert.equal(lineAmount(3, 4500, 'un'), 13500);
  assert.equal(scaleOf('qualquer'), 1);
});

test('kg: gramas x preco por kg, arredondado ao centavo (metade para cima)', () => {
  assert.equal(lineAmount(1250, 35000, 'kg'), 43750); // 1,250 kg a 350 MT/kg = 437,50 MT
  assert.equal(lineAmount(333, 10000, 'kg'), 3330);    // 0,333 kg a 100 MT = 33,30
  assert.equal(lineAmount(5, 10, 'kg'), 0);            // 0,05 centavos -> 0
  assert.equal(lineAmount(50, 10, 'kg'), 1);           // 0,5 centavo -> 1 (metade para cima)
  assert.equal(lineAmount(-1250, 35000, 'kg'), -43750, 'ajustes negativos simetricos');
  // Contra a conta exacta: nunca mais de meio centavo de diferenca.
  for (let g = 0; g <= 5000; g += 37) assert.ok(Math.abs(lineAmount(g, 12345, 'kg') - (g * 12345) / 1000) <= 0.5, String(g));
});

test('quantidade humana e texto', () => {
  assert.equal(humanQty(1250, 'kg'), 1.25);
  assert.equal(humanQty(7, 'un'), 7);
  assert.equal(qtyText(1250, 'kg'), '1,25 kg');
  assert.equal(qtyText(500, 'l'), '0,5 l');
  assert.equal(qtyText(3, 'un'), '3');
});
