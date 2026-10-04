const test = require('node:test');
const assert = require('node:assert');
const { allocateFefo, sortFefo, isExpired, daysUntilExpiry } = require('../src/utils/fefo');

const lot = (id, qty, expiry, created = '2026-10-01T08:00:00Z', cost = 100) => ({ id, quantity_remaining: qty, expiry_date: expiry, created_at: created, unit_cost: cost });

test('sai primeiro o lote que expira primeiro; sem validade por ultimo', () => {
  const lots = [lot('sem', 10, null), lot('nov', 5, '2026-11-01'), lot('out', 5, '2026-10-10')];
  assert.deepStrictEqual(sortFefo(lots).map((l) => l.id), ['out', 'nov', 'sem']);
});

test('mesma validade: o lote mais antigo primeiro', () => {
  const lots = [lot('b', 3, '2026-10-10', '2026-10-02T08:00:00Z'), lot('a', 3, '2026-10-10', '2026-10-01T08:00:00Z')];
  assert.deepStrictEqual(sortFefo(lots).map((l) => l.id), ['a', 'b']);
});

test('uma venda que atravessa dois lotes divide a quantidade', () => {
  const r = allocateFefo([lot('out', 2, '2026-10-10', undefined, 80), lot('nov', 10, '2026-11-01', undefined, 90)], 5);
  assert.deepStrictEqual(r.allocations.map((a) => [a.lot_id, a.quantity, a.unit_cost]), [['out', 2, 80], ['nov', 3, 90]]);
  assert.strictEqual(r.uncovered, 0);
});

test('lotes vazios sao ignorados e o que falta fica em uncovered', () => {
  const r = allocateFefo([lot('vazio', 0, '2026-10-05'), lot('x', 2, null)], 5);
  assert.deepStrictEqual(r.allocations.map((a) => a.lot_id), ['x']);
  assert.strictEqual(r.uncovered, 3);
});

test('quantidade invalida e recusada', () => {
  assert.throws(() => allocateFefo([], 0));
  assert.throws(() => allocateFefo([], 1.5));
});

test('validade: vende-se no proprio dia, perda a partir do dia seguinte (hora de Maputo)', () => {
  const exp = '2026-10-12T00:00:00.000Z';
  assert.strictEqual(isExpired(exp, new Date('2026-10-12T21:59:00Z')), false); // 23:59 em Maputo, dia 12
  assert.strictEqual(isExpired(exp, new Date('2026-10-12T22:01:00Z')), true); // 00:01 em Maputo, dia 13
  assert.strictEqual(isExpired(null, new Date()), false);
});

test('dias ate expirar', () => {
  const now = new Date('2026-10-04T10:00:00Z');
  assert.strictEqual(daysUntilExpiry('2026-10-04T00:00:00.000Z', now), 0);
  assert.strictEqual(daysUntilExpiry('2026-10-11T00:00:00.000Z', now), 7);
  assert.strictEqual(daysUntilExpiry('2026-10-01T00:00:00.000Z', now), -3);
  assert.strictEqual(daysUntilExpiry(null, now), null);
});
