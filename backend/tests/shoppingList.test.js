const test = require('node:test');
const assert = require('node:assert');
const { listTotals, waPhone, orderMessage, whatsappLink } = require('../src/services/shoppingList');

test('total = quantidade x custo + entrega do fornecedor (centavos)', () => {
  const t = listTotals([{ quantity: 24, unit_cost: 4500 }, { quantity: 2, unit_cost: 15050 }], { delivery_cost_per_visit: 50000 });
  assert.deepStrictEqual(t, { units: 26, investment: 24 * 4500 + 2 * 15050, delivery: 50000, total: 24 * 4500 + 2 * 15050 + 50000 });
});

test('sem fornecedor a entrega e zero', () => {
  assert.strictEqual(listTotals([{ quantity: 1, unit_cost: 100 }]).delivery, 0);
});

test('telefone mocambicano local ganha o 258; com indicativo fica igual', () => {
  assert.strictEqual(waPhone('84 123 4567'), '258841234567');
  assert.strictEqual(waPhone('+258 84 123 4567'), '258841234567');
  assert.strictEqual(waPhone('00258841234567'), '258841234567');
  assert.strictEqual(waPhone('123'), null);
  assert.strictEqual(waPhone(''), null);
});

test('mensagem com produtos e quantidades, sem custos', () => {
  const m = orderMessage({ storeName: 'Bottle Store Central', supplierName: 'CDM', items: [{ quantity: 24, product_name: '2M 340ml', unit_cost: 4500 }] });
  assert.match(m, /Olá CDM, daqui fala Bottle Store Central\./);
  assert.match(m, /- 24 × 2M 340ml/);
  assert.doesNotMatch(m, /45|MT/);
});

test('link wa.me com texto codificado; sem telefone abre a escolha de contacto', () => {
  assert.strictEqual(whatsappLink('841234567', 'a b\nc'), 'https://wa.me/258841234567?text=a%20b%0Ac');
  assert.strictEqual(whatsappLink(null, 'x'), 'https://wa.me/?text=x');
});
