const test = require('node:test');
const assert = require('node:assert');
const { recommendRestock } = require('../src/services/restock');

const p = (id, stock, cost = 4500, name = id) => ({ id, name, stock_qty: stock, cost_price: cost });

test('ritmo x dias a cobrir menos o stock', () => {
  // 56 vendidas em 28 dias = 2/dia; 30 dias = 60; ja ha 20 -> comprar 40.
  const r = recommendRestock({ products: [p('2m', 20)], soldByProduct: { '2m': 56 }, windowDays: 28, coverDays: 30 });
  assert.strictEqual(r.items[0].quantity, 40);
  assert.strictEqual(r.items[0].investment, 40 * 4500);
  assert.strictEqual(r.total_investment, 40 * 4500);
});

test('stock suficiente: nada a comprar', () => {
  const r = recommendRestock({ products: [p('agua', 100)], soldByProduct: { agua: 28 } });
  assert.strictEqual(r.items.length, 0);
});

test('procura perdida conta mesmo sem vendas', () => {
  const r = recommendRestock({ products: [p('gin', 0, 60000)], lostByProduct: { gin: 4 }, windowDays: 28, coverDays: 28 });
  assert.strictEqual(r.items[0].quantity, 4);
  assert.strictEqual(r.items[0].reason, 'pedido por clientes sem stock');
});

test('produto parado com stock: "nao reforcar"', () => {
  const r = recommendRestock({ products: [p('escova', 12, 2000), p('2m', 0)], soldByProduct: { escova: 1, '2m': 10 } });
  assert.deepStrictEqual(r.slow_movers.map((s) => s.product_id), ['escova']);
  assert.strictEqual(r.slow_movers[0].stock_value, 24000);
  assert.ok(r.items.every((i) => i.product_id !== 'escova'));
});

test('ordena pelo maior investimento', () => {
  const r = recommendRestock({ products: [p('barato', 0, 100), p('caro', 0, 10000)], soldByProduct: { barato: 28, caro: 28 }, windowDays: 28, coverDays: 7 });
  assert.deepStrictEqual(r.items.map((i) => i.product_id), ['caro', 'barato']);
});

test('janela invalida e recusada', () => {
  assert.throws(() => recommendRestock({ products: [], windowDays: 0 }));
});
