const test = require('node:test');
const assert = require('node:assert');
const { groupOf, actionFilter, periodStart, retentionCutoff, GROUPS } = require('../src/utils/auditGroups');

test('grupos: entrada de stock, mudanca de PIN e desconhecido', () => {
  assert.strictEqual(groupOf('STOCK_ENTRY'), 'stock');
  assert.strictEqual(groupOf('AUTH_PIN_CHANGED'), 'security');
  assert.strictEqual(groupOf('RESET_CASHIER_PIN'), 'security');
  assert.strictEqual(groupOf('UPDATE_PRODUCT'), 'products');
  assert.strictEqual(groupOf('QUALQUER_COISA_NOVA'), 'other');
  assert.deepStrictEqual(actionFilter('debts'), { in: ['CREATE_DEBT', 'DEBT_PAYMENT'] });
  assert.ok(actionFilter('other').notIn.includes('CREATE_SALE'));
  assert.strictEqual(actionFilter('all'), undefined);
  const all = GROUPS.flatMap((g) => g.actions);
  assert.strictEqual(new Set(all).size, all.length, 'nenhuma accao em dois grupos');
});

test('periodos pelo calendario de Maputo (UTC+2)', () => {
  // 11/10/2026 (domingo) 23:30 em Maputo = 21:30 UTC.
  const now = new Date('2026-10-11T21:30:00Z');
  assert.strictEqual(periodStart('today', now).toISOString(), '2026-10-10T22:00:00.000Z');
  assert.strictEqual(periodStart('week', now).toISOString(), '2026-10-04T22:00:00.000Z', 'semana desde segunda 05/10');
  assert.strictEqual(periodStart('month', now).toISOString(), '2026-09-30T22:00:00.000Z');
  assert.strictEqual(periodStart('all', now), null);
  // 00:30 de 12/10 em Maputo (22:30 UTC de 11/10): ja e segunda, dia novo.
  const late = new Date('2026-10-11T22:30:00Z');
  assert.strictEqual(periodStart('today', late).toISOString(), '2026-10-11T22:00:00.000Z');
  assert.strictEqual(periodStart('week', late).toISOString(), '2026-10-11T22:00:00.000Z');
});

test('retencao: mes corrente + N-1 anteriores; minimo 2', () => {
  const now = new Date('2026-10-11T10:00:00Z');
  assert.strictEqual(retentionCutoff({ now, months: 2 }).toISOString(), '2026-08-31T22:00:00.000Z', '2 meses: guarda desde 1/9');
  assert.strictEqual(retentionCutoff({ now, months: 12 }).toISOString(), '2025-10-31T22:00:00.000Z', '12 meses: desde 1/11/2025');
  assert.strictEqual(retentionCutoff({ now, months: 1 }).toISOString(), '2026-08-31T22:00:00.000Z', 'abaixo de 2 conta como 2');
  // 1/10 as 00:30 de Maputo (30/9 22:30 UTC): ja e outubro.
  assert.strictEqual(retentionCutoff({ now: new Date('2026-09-30T22:30:00Z'), months: 2 }).toISOString(), '2026-08-31T22:00:00.000Z');
  // 31/10 23:59 Maputo: continua outubro.
  assert.strictEqual(retentionCutoff({ now: new Date('2026-10-31T21:59:00Z'), months: 2 }).toISOString(), '2026-08-31T22:00:00.000Z');
  assert.strictEqual(retentionCutoff({ now: new Date('2026-02-10T10:00:00Z'), months: 3 }).toISOString(), '2025-11-30T22:00:00.000Z', 'atravessa o ano');
});
