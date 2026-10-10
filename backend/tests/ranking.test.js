const test = require('node:test');
const assert = require('node:assert');
const { rankByTiers } = require('../src/services/ranking');

const p = (name, quantity, profit = 0) => ({ product_id: name, name, quantity, profit });
const names = (rows) => rows.map((r) => `${r.rank}:${r.name}`);

test('10, 9, 8, 2, 1 -> top 3 niveis (10, 9, 8)', () => {
  const rows = rankByTiers([p('E', 1), p('A', 10), p('D', 2), p('B', 9), p('C', 8)], 'quantity');
  assert.deepStrictEqual(names(rows), ['1:A', '2:B', '3:C']);
});

test('2, 2, 1, 1, 1 -> so os de 2, empatados em 1.o', () => {
  const rows = rankByTiers([p('C', 1), p('A', 2), p('D', 1), p('B', 2), p('E', 1)], 'quantity');
  assert.deepStrictEqual(names(rows), ['1:A', '1:B']);
});

test('todos iguais -> um so nivel, todos em 1.o', () => {
  const rows = rankByTiers([p('B', 1), p('A', 1), p('C', 1)], 'quantity');
  assert.deepStrictEqual(names(rows), ['1:A', '1:B', '1:C']);
});

test('dois niveis -> so o de cima', () => {
  assert.deepStrictEqual(names(rankByTiers([p('A', 5), p('B', 3)], 'quantity')), ['1:A']);
});

test('lucro: mesma regra; lucro zero ou negativo nao e rentavel', () => {
  const rows = rankByTiers([p('A', 1, 5000), p('B', 1, 3000), p('C', 1, 3000), p('D', 1, 100), p('E', 1, 0), p('F', 1, -200)], 'profit');
  assert.deepStrictEqual(names(rows), ['1:A', '2:B', '2:C']);
});

test('sem vendas -> lista vazia', () => {
  assert.deepStrictEqual(rankByTiers([], 'quantity'), []);
});
