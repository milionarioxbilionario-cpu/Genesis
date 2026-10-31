// Horario a serio (utils/hours.js): 24 h, depois da meia-noite, pausas, dias
// fechados, feriados e o dia de vendas. Tudo na hora de Maputo (UTC+2).
const test = require('node:test');
const assert = require('node:assert');
const H = require('../src/utils/hours');

// Instante a partir da hora de Maputo.
const at = (s) => new Date(s + '+02:00');
const custom = (days, extra = {}) => H.normalize({ mode: 'custom', days, ...extra });

test('hora antiga vira «todos os dias igual» e o dia de vendas fica a meia-noite', () => {
  const s = H.parse({ opening_time: '08:00', closing_time: '20:00' });
  assert.strictEqual(s.mode, 'same');
  assert.deepStrictEqual(s.days['3'], [['08:00', '20:00']]);
  assert.strictEqual(s.day_end, '00:00');
  assert.strictEqual(H.isOpenAt(s, at('2026-11-04T09:00:00')), true);
  assert.strictEqual(H.isOpenAt(s, at('2026-11-04T20:00:00')), false);
  // Sem hours_json nem horas: 08-20 (como antes).
  assert.deepStrictEqual(H.parse({}).days['0'], [['08:00', '20:00']]);
  // JSON estragado nao parte nada: volta a hora antiga.
  assert.strictEqual(H.parse({ hours_json: '{mau', opening_time: '07:00', closing_time: '19:00' }).days['1'][0][0], '07:00');
});

test('aberto 24 horas: sempre aberto, resumo 00:00-23:59, sem fecho do dia', () => {
  const s = H.normalize({ mode: '24h' });
  assert.ok(H.isAlwaysOpen(s));
  for (const t of ['2026-11-01T00:00:00', '2026-11-01T03:30:00', '2026-11-01T23:59:00']) assert.strictEqual(H.isOpenAt(s, at(t)), true, t);
  assert.deepStrictEqual(H.summary(s), { opening_time: '00:00', closing_time: '23:59' });
  assert.strictEqual(H.lastCloseOf(s, '2026-11-01'), null);
});

test('horario por dia: segunda fecha 20h, sexta 24h, domingo fecha 12h, sabado fechado', () => {
  const s = custom({ 1: [['08:00', '20:00']], 2: [['08:00', '20:00']], 3: [['08:00', '20:00']], 4: [['08:00', '20:00']], 5: [['00:00', '24:00']], 6: [], 0: [['08:00', '12:00']] });
  assert.strictEqual(H.isOpenAt(s, at('2026-11-02T19:59:00')), true); // segunda
  assert.strictEqual(H.isOpenAt(s, at('2026-11-02T20:00:00')), false);
  assert.strictEqual(H.isOpenAt(s, at('2026-11-06T03:00:00')), true); // sexta de madrugada
  assert.strictEqual(H.isOpenAt(s, at('2026-11-07T10:00:00')), false); // sabado fechado
  assert.strictEqual(H.isOpenAt(s, at('2026-11-01T11:00:00')), true); // domingo
  assert.strictEqual(H.isOpenAt(s, at('2026-11-01T12:30:00')), false);
  assert.strictEqual(H.lastCloseOf(s, '2026-11-07'), null); // fechado nesse dia
  assert.strictEqual(H.lastCloseOf(s, '2026-11-01').toISOString(), at('2026-11-01T12:00:00').toISOString());
});

test('pausa ao almoco: dois periodos no mesmo dia', () => {
  const s = custom({ 1: [['08:00', '12:00'], ['14:00', '18:00']] });
  assert.strictEqual(H.isOpenAt(s, at('2026-11-02T13:00:00')), false);
  assert.strictEqual(H.isOpenAt(s, at('2026-11-02T15:00:00')), true);
  assert.strictEqual(H.lastCloseOf(s, '2026-11-02').toISOString(), at('2026-11-02T18:00:00').toISOString());
});

test('bar que passa a meia-noite (18h-04h): aberto a 1h, vendas da 1h contam para o dia em que abriu', () => {
  const s = custom({ 5: [['18:00', '04:00']] }); // sexta
  assert.ok(H.crossesMidnight(s));
  assert.strictEqual(s.day_end, '04:00'); // sugerido sozinho
  assert.strictEqual(H.isOpenAt(s, at('2026-11-07T01:00:00')), true); // sabado 1h = noite de sexta
  assert.strictEqual(H.isOpenAt(s, at('2026-11-07T04:00:00')), false);
  assert.strictEqual(H.businessDay(s, at('2026-11-07T01:00:00')), '2026-11-06');
  assert.strictEqual(H.businessDay(s, at('2026-11-07T04:00:00')), '2026-11-07');
  const r = H.businessDayRange(s, '2026-11-06');
  assert.strictEqual(r.start.toISOString(), at('2026-11-06T04:00:00').toISOString());
  assert.strictEqual(r.end.getTime() - r.start.getTime(), 86400000 - 1);
  // O fecho do dia de sexta e as 4h de sabado.
  assert.strictEqual(H.lastCloseOf(s, '2026-11-06').toISOString(), at('2026-11-07T04:00:00').toISOString());
  assert.deepStrictEqual(H.summary(s), { opening_time: '18:00', closing_time: '23:59' });
});

test('dia de vendas a meia-noite = dia do calendario de Maputo (quem nao mexe nao ve diferenca)', () => {
  const s = H.fromLegacy('08:00', '20:00');
  assert.strictEqual(H.businessDay(s, at('2026-11-07T00:30:00')), '2026-11-07');
  const r = H.businessDayRange(s, '2026-11-07');
  assert.strictEqual(r.start.toISOString(), '2026-11-06T22:00:00.000Z');
  assert.strictEqual(r.end.toISOString(), '2026-11-07T21:59:59.999Z');
});

test('feriados e dias especiais mandam no dia', () => {
  const s = H.normalize({ mode: 'same', days: { 1: [['08:00', '20:00']] }, exceptions: [{ date: '2026-12-25', closed: true }, { date: '2026-12-24', intervals: [['08:00', '13:00']] }] });
  assert.strictEqual(H.isOpenAt(s, at('2026-12-25T10:00:00')), false);
  assert.strictEqual(H.isOpenAt(s, at('2026-12-24T12:00:00')), true);
  assert.strictEqual(H.isOpenAt(s, at('2026-12-24T14:00:00')), false);
});

test('recusas claras: horas mal escritas, iguais, sobrepostas, nenhum dia aberto', () => {
  assert.throws(() => custom({ 1: [['8:00', '20:00']] }), /HH:MM/);
  assert.throws(() => custom({ 1: [['08:00', '08:00']] }), /iguais/);
  assert.throws(() => custom({ 1: [['08:00', '14:00'], ['13:00', '18:00']] }), /sobrepostos/);
  assert.throws(() => custom({}), /pelo menos um dia/);
  assert.throws(() => H.normalize({ mode: 'same', days: { 1: [] } }), /abrir e a de fechar/);
});
