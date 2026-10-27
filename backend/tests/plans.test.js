// Fase 16: planos e presente de aniversario. node --test backend/tests/plans.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const p = require('../src/services/plans');

// 27/10/2026 10:00 em Maputo.
const NOW = new Date('2026-10-27T08:00:00Z');

test('somar meses prende o dia ao fim do mes', () => {
  assert.equal(p.addMonthsDay('2026-01-31', 1), '2026-02-28');
  assert.equal(p.addMonthsDay('2028-01-31', 1), '2028-02-29');
  assert.equal(p.addMonthsDay('2026-12-15', 1), '2027-01-15');
  assert.equal(p.addMonthsDay('2026-10-27', 12), '2027-10-27');
});

test('aniversario: dia de Maputo; 29/02 festeja-se a 28/02 nos anos comuns', () => {
  assert.equal(p.isBirthdayToday('1990-10-27', NOW), true);
  assert.equal(p.isBirthdayToday('1990-10-28', NOW), false);
  // 26/10 23:30 UTC ja e 27/10 em Maputo.
  assert.equal(p.isBirthdayToday('1990-10-27', new Date('2026-10-26T23:30:00Z')), true);
  assert.equal(p.isBirthdayToday('2000-02-29', new Date('2027-02-28T10:00:00Z')), true);
  assert.equal(p.isBirthdayToday('2000-02-29', new Date('2028-02-28T10:00:00Z')), false);
  assert.equal(p.isBirthdayToday(null, NOW), false);
});

test('presente: so no dia e uma vez por ano', () => {
  assert.equal(p.giftAvailable({ birthday: '1990-10-27', birthday_gift_year: null }, NOW), true);
  assert.equal(p.giftAvailable({ birthday: '1990-10-27', birthday_gift_year: 2026 }, NOW), false);
  assert.equal(p.giftAvailable({ birthday: '1990-10-27', birthday_gift_year: 2025 }, NOW), true);
  assert.equal(p.giftAvailable({ birthday: '1990-11-27', birthday_gift_year: null }, NOW), false);
});

test('mensal: o Premium comeca no proximo ciclo (dia em que a loja foi criada)', () => {
  const w = p.giftWindow({ plan: 'basic', plan_period: 'monthly', created_at: '2026-03-05T10:00:00Z' }, NOW);
  assert.equal(w.rule, 'next_cycle');
  assert.equal(w.from.toISOString(), '2026-11-04T22:00:00.000Z'); // 05/11 00:00 Maputo
  assert.equal(w.until.toISOString(), '2026-12-04T22:00:00.000Z');
  // Loja criada a 31: em Novembro o ciclo e a 30.
  assert.equal(p.nextCycleDay('2026-01-31T10:00:00Z', NOW), '2026-10-31');
  assert.equal(p.nextCycleDay('2026-01-31T10:00:00Z', new Date('2026-10-31T10:00:00Z')), '2026-11-30');
  // Hoje e o dia do ciclo: o proximo e no mes que vem.
  assert.equal(p.nextCycleDay('2026-02-27T10:00:00Z', NOW), '2026-11-27');
});

test('anual Basico: sobe hoje e volta ao Basico no mesmo dia do mes seguinte', () => {
  const w = p.giftWindow({ plan: 'basic', plan_period: 'annual', created_at: '2026-03-05T10:00:00Z' }, NOW);
  assert.equal(w.rule, 'annual_now');
  assert.equal(w.from.toISOString(), '2026-10-26T22:00:00.000Z');
  assert.equal(w.until.toISOString(), '2026-11-26T22:00:00.000Z');
  const t = { plan: 'basic', premium_from: w.from, premium_until: w.until };
  assert.equal(p.effectivePlan(t, NOW), 'premium');
  assert.equal(p.effectivePlan(t, new Date('2026-11-27T10:00:00Z')), 'basic');
});

test('Premium temporario a decorrer: o presente soma 1 mes ao fim', () => {
  const t = { plan: 'basic', plan_period: 'annual', premium_from: '2026-10-01T00:00:00Z', premium_until: '2026-11-10T22:00:00Z' };
  const w = p.giftWindow(t, NOW);
  assert.equal(w.rule, 'extend');
  assert.equal(w.until.toISOString(), '2026-12-10T22:00:00.000Z');
  assert.equal(p.effectivePlan({ plan: 'premium' }, NOW), 'premium');
  assert.equal(p.effectivePlan({ plan: 'basic' }, NOW), 'basic');
});
