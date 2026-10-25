// Fase 13: estado do turno de cada caixista na visao geral (regra pura).
// Correr: node --test tests/overview.test.js   (dentro de backend/)
const test = require('node:test');
const assert = require('node:assert/strict');
const { cashierState } = require('../src/services/overview');

const today = '2026-10-25';
const closing = (difference, shift_day = today) => ({ difference, shift_day, closed_at: new Date('2026-10-25T15:00:00Z') });

test('bloqueado (3 contagens erradas) = locked, antes de tudo', () => {
  assert.equal(cashierState({ locked: true, open: true, activityToday: true, lastClosing: null, today }), 'locked');
});
test('turno aberto e ja entrou/vendeu hoje = working (verde)', () => {
  assert.equal(cashierState({ locked: false, open: true, activityToday: true, lastClosing: null, today }), 'working');
});
test('turno aberto mas sem actividade hoje = not_started (laranja)', () => {
  assert.equal(cashierState({ locked: false, open: true, activityToday: false, lastClosing: closing(0, '2026-10-24'), today }), 'not_started');
});
test('fechou hoje certo = closed (cinzento); com dinheiro a menos = short (vermelho)', () => {
  assert.equal(cashierState({ locked: false, open: false, activityToday: true, lastClosing: closing(0), today }), 'closed');
  assert.equal(cashierState({ locked: false, open: false, activityToday: true, lastClosing: closing(-5000), today }), 'short');
});
test('falta de dinheiro num fecho de OUTRO dia nao pinta hoje de vermelho', () => {
  assert.equal(cashierState({ locked: false, open: false, activityToday: false, lastClosing: closing(-5000, '2026-10-24'), today }), 'closed');
});
