const test = require('node:test');
const assert = require('node:assert');
const { dueReports, describeDaily, buildReportMessage } = require('../src/services/reportSchedule');

// Hora de Maputo -> instante UTC (Maputo = UTC+2).
const at = (day, hhmm) => new Date(Date.parse(`${day}T${hhmm}:00Z`) - 2 * 3600000);
const kinds = (r) => r.map((x) => x.key);

test('diario as 00:00: relatorio de ONTEM completo (exemplo do fundador)', () => {
  const t = { daily_report_time: '00:00', opening_time: '08:00' };
  const r = dueReports({ now: at('2026-10-12', '00:05'), tenant: t });
  assert.deepStrictEqual(kinds(r), ['daily:2026-10-11']);
  assert.strictEqual(r[0].partial, false);
  assert.match(describeDaily('00:00', '08:00'), /ontem/);
});

test('diario as 19:00: o de hoje ate essa hora; antes das 19:00 nada', () => {
  const t = { daily_report_time: '19:00', opening_time: '08:00' };
  assert.deepStrictEqual(kinds(dueReports({ now: at('2026-10-11', '18:59'), tenant: t })), []);
  const r = dueReports({ now: at('2026-10-11', '19:00'), tenant: t });
  assert.deepStrictEqual(kinds(r), ['daily:2026-10-11']);
  assert.strictEqual(r[0].partial, true);
  assert.match(describeDaily('19:00', '08:00'), /hoje/);
});

test('ja enviado: nao repete (reinicio do servidor)', () => {
  const t = { daily_report_time: '19:00' };
  assert.deepStrictEqual(dueReports({ now: at('2026-10-11', '21:00'), tenant: t, sentKeys: new Set(['daily:2026-10-11']) }), []);
});

test('semanal a sexta 18:00: 7 dias ate hoje; noutro dia nada', () => {
  const t = { daily_report_time: '23:00', weekly_report_day: 5, weekly_report_time: '18:00' };
  // 16/10/2026 e sexta-feira.
  const r = dueReports({ now: at('2026-10-16', '18:30'), tenant: t });
  const w = r.find((x) => x.kind === 'weekly');
  assert.deepStrictEqual([w.key, w.start, w.end], ['weekly:2026-10-16', '2026-10-10', '2026-10-16']);
  assert.ok(!dueReports({ now: at('2026-10-15', '18:30'), tenant: t }).some((x) => x.kind === 'weekly'));
});

test('semanal a segunda 00:00: a semana de segunda a domingo anterior', () => {
  const t = { daily_report_time: '23:00', weekly_report_day: 1, weekly_report_time: '00:00', opening_time: '07:00' };
  const w = dueReports({ now: at('2026-10-12', '00:10'), tenant: t }).find((x) => x.kind === 'weekly');
  assert.deepStrictEqual([w.start, w.end], ['2026-10-05', '2026-10-11']);
});

test('mensal no dia do fecho: mes anterior (incluindo janeiro -> dezembro)', () => {
  const t = { daily_report_time: '23:00', weekly_report_day: 3, month_close_day: 1, monthly_report_time: '08:00' };
  assert.deepStrictEqual(kinds(dueReports({ now: at('2026-11-01', '08:00'), tenant: t })), ['monthly:2026-10']);
  assert.deepStrictEqual(kinds(dueReports({ now: at('2027-01-01', '09:00'), tenant: t })), ['monthly:2026-12']);
  assert.deepStrictEqual(kinds(dueReports({ now: at('2026-11-02', '09:00'), tenant: t })), []);
});

test('fronteira de Maputo: 23:30 de domingo em Maputo ja nao e sabado em UTC', () => {
  // 21:30 UTC de 11/10 = 23:30 de domingo 11/10 em Maputo.
  const t = { daily_report_time: '23:00', weekly_report_day: 0, weekly_report_time: '23:00' };
  const r = dueReports({ now: new Date('2026-10-11T21:30:00Z'), tenant: t });
  assert.deepStrictEqual(kinds(r), ['daily:2026-10-11', 'weekly:2026-10-11']);
});

test('mensagem: dinheiro em MT a partir de centavos, sem inventar', () => {
  const msg = buildReportMessage({
    due: { kind: 'daily', end: '2026-10-11', partial: false },
    report: { gross_revenue: 127950, sales_count: 3, gross_profit: 40000, losses_total: 0, most_sold: { name: '2M 340ml', quantity: 5 }, lost_demand: [{ units: 3 }] },
    storeName: 'Loja Teste',
  });
  assert.match(msg, /Relatório diário 11\/10\/2026/);
  assert.match(msg, /Receita: 1\s?279,50 MT \(3 venda\(s\)\)/);
  assert.match(msg, /Mais vendido: 2M 340ml \(5 un\.\)/);
  assert.match(msg, /Vendas perdidas: 3 un\./);
  assert.ok(!/Perdas:/.test(msg), 'sem perdas nao aparece a linha');
});
