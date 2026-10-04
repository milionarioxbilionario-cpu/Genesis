const test = require('node:test');
const assert = require('node:assert');
const { monthCloseStatus } = require('../src/services/monthClose');

const at = (s) => new Date(s + 'T10:00:00');

test('no dia do fecho mostra o mes anterior', () => {
  const r = monthCloseStatus({ now: at('2026-10-01'), closeDay: 1, tenantCreatedAt: at('2026-08-15') });
  assert.deepStrictEqual([r.due, r.year, r.month, r.key], [true, 2026, 9, '2026-09']);
});

test('antes do dia do fecho nao mostra nada', () => {
  assert.strictEqual(monthCloseStatus({ now: at('2026-10-04'), closeDay: 5, tenantCreatedAt: at('2026-01-01') }).due, false);
  assert.strictEqual(monthCloseStatus({ now: at('2026-10-05'), closeDay: 5, tenantCreatedAt: at('2026-01-01') }).due, true);
});

test('depois de visto nao volta a aparecer nesse mes', () => {
  assert.strictEqual(monthCloseStatus({ now: at('2026-10-20'), closeDay: 1, tenantCreatedAt: at('2026-01-01'), seenKeys: ['2026-09'] }).due, false);
});

test('loja criada este mes nao tem fecho do mes anterior', () => {
  assert.strictEqual(monthCloseStatus({ now: at('2026-10-20'), closeDay: 1, tenantCreatedAt: at('2026-10-02') }).due, false);
});

test('janeiro mostra dezembro do ano anterior', () => {
  const r = monthCloseStatus({ now: at('2027-01-03'), closeDay: 1, tenantCreatedAt: at('2026-05-01') });
  assert.deepStrictEqual([r.due, r.year, r.month], [true, 2026, 12]);
});

test('dia invalido fica entre 1 e 28', () => {
  assert.strictEqual(monthCloseStatus({ now: at('2026-10-28'), closeDay: 31 }).close_day, 28);
  assert.strictEqual(monthCloseStatus({ now: at('2026-10-28'), closeDay: 0 }).close_day, 1);
});
