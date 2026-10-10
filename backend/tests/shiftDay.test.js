const test = require('node:test');
const assert = require('node:assert');
const { decideShift, shiftDayOf, closingDay } = require('../src/utils/shiftDay');

// Horas de Maputo (UTC+2) escritas como ISO com fuso.
const at = (s) => new Date(s + '+02:00');

test('sem fecho nenhum: turno aberto', () => {
  const r = decideShift({ recentClosings: [], now: at('2026-10-10T09:00:00') });
  assert.deepStrictEqual([r.open, r.since], [true, null]);
});

test('fechou hoje: fechado (reabrir so com PIN)', () => {
  const c = { closed_at: at('2026-10-10T22:00:00'), shift_day: '2026-10-10' };
  const r = decideShift({ recentClosings: [c], now: at('2026-10-10T22:30:00') });
  assert.strictEqual(r.open, false);
  assert.strictEqual(r.closedToday, true);
});

test('dia novo: abre sozinho, esperado conta desde o fecho', () => {
  const c = { closed_at: at('2026-10-10T22:00:00'), shift_day: '2026-10-10' };
  const r = decideShift({ recentClosings: [c], now: at('2026-10-11T08:00:00') });
  assert.deepStrictEqual([r.open, r.auto, +new Date(r.since)], [true, true, +c.closed_at]);
});

test('24/24: turno das 15h fecha as 02h como dia X; as 15h de X+1 ainda abre sem PIN', () => {
  const day = shiftDayOf({ firstActivityAt: at('2026-10-10T15:00:00'), now: at('2026-10-11T02:00:00') });
  assert.strictEqual(day, '2026-10-10');
  const c = { closed_at: at('2026-10-11T02:00:00'), shift_day: day };
  const r = decideShift({ recentClosings: [c], now: at('2026-10-11T15:00:00') });
  assert.strictEqual(r.open, true, 'o fecho do dia 11 ainda nao foi usado');
  // ... e fecha as 22h do dia 11 (turno que comecou no dia 11) -> gastou o dia 11.
  const day2 = shiftDayOf({ firstActivityAt: at('2026-10-11T15:00:00'), now: at('2026-10-11T22:00:00') });
  const c2 = { closed_at: at('2026-10-11T22:00:00'), shift_day: day2 };
  assert.strictEqual(decideShift({ recentClosings: [c2, c], now: at('2026-10-11T23:00:00') }).open, false);
});

test('reaberto com o PIN do dono no mesmo dia: aberto, esperado desde a reabertura', () => {
  const c = { closed_at: at('2026-10-10T13:26:40'), shift_day: '2026-10-10' };
  const openedAt = at('2026-10-10T18:48:30');
  const r = decideShift({ recentClosings: [c], openedAt, now: at('2026-10-10T18:50:00') });
  assert.deepStrictEqual([r.open, +new Date(r.since)], [true, +openedAt]);
  assert.strictEqual(shiftDayOf({ openedAt, now: at('2026-10-11T01:00:00') }), '2026-10-10');
});

test('caso real do Kleyton: vendas soltas entre o fecho e a reabertura ficam de fora', () => {
  // Fecho 06/10 13:26; vendas 13:30 e 13:44 (antes da Fase 7.1); reaberto 10/10 18:48.
  const c = { closed_at: at('2026-10-06T13:26:40'), shift_day: null };
  const r = decideShift({ recentClosings: [c], openedAt: at('2026-10-10T18:48:30'), now: at('2026-10-10T18:49:00') });
  assert.ok(at('2026-10-06T13:44:46') < new Date(r.since), 'a venda de 75 MT de 06/10 nao conta');
});

test('fronteira da meia-noite de Maputo (23:59 / 00:01)', () => {
  const c = { closed_at: at('2026-10-10T23:59:00'), shift_day: '2026-10-10' };
  assert.strictEqual(decideShift({ recentClosings: [c], now: at('2026-10-10T23:59:30') }).open, false);
  assert.strictEqual(decideShift({ recentClosings: [c], now: at('2026-10-11T00:01:00') }).open, true);
});

test('fechos antigos sem shift_day contam no dia (de Maputo) em que fecharam', () => {
  // 23:30 de Maputo = 21:30 UTC do mesmo dia; 00:30 de Maputo = 22:30 UTC do dia anterior.
  assert.strictEqual(closingDay({ closed_at: at('2026-10-10T23:30:00'), shift_day: null }), '2026-10-10');
  assert.strictEqual(closingDay({ closed_at: at('2026-10-11T00:30:00'), shift_day: null }), '2026-10-11');
});
