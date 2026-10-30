const test = require('node:test');
const assert = require('node:assert');
const { buildNotifications, stockLevel } = require('../src/services/notifications');

// 18/10/2026 15:00 em Maputo (UTC+2).
const NOW = new Date('2026-10-18T13:00:00Z');
const due = (day) => new Date(day + 'T00:00:00Z');
const debt = (id, day, total = 100000, paid = 0) => ({ id, debtor_name: 'Sr. ' + id, total_amount: total, amount_paid: paid, due_date: due(day) });
const byId = (items) => Object.fromEntries(items.map((i) => [i.id, i]));

test('stock: 3 niveis da especificacao (critica <= 10, severa <= 20, normal acima)', () => {
  assert.deepStrictEqual([stockLevel(10), stockLevel(11), stockLevel(20), stockLevel(21), stockLevel(99)], ['critical', 'severe', 'severe', 'low', 'low']);
  const items = buildNotifications({ now: NOW, lowStock: [
    { id: 'a', name: 'Água', stock_qty: 8, min_stock: 12 },
    { id: 'b', name: 'Heineken', stock_qty: 14, min_stock: 24 },
    { id: 'c', name: 'Sumo', stock_qty: 40, min_stock: 50 },
  ] });
  const m = byId(items);
  assert.deepStrictEqual([m['stock_low:a'].level, m['stock_low:b'].level, m['stock_low:c'].level], ['critical', 'warning', 'info']);
  assert.deepStrictEqual(m['stock_low:b'].params, { name: 'Heineken', qty: 14, min: 24, stock_level: 'severe' });
  assert.strictEqual(m['stock_low:a'].link, '/app/produtos?tab=stock');
});

test('txenekas: vencida e hoje criticas, amanha aviso, ate 7 dias info, depois nada; pagas nao contam', () => {
  const items = buildNotifications({ now: NOW, debts: [
    debt('venc', '2026-10-16'), debt('hoje', '2026-10-18'), debt('amanha', '2026-10-19'),
    debt('sete', '2026-10-25'), debt('oito', '2026-10-26'), debt('paga', '2026-10-18', 50000, 50000),
  ] });
  const m = byId(items);
  assert.deepStrictEqual(
    ['venc', 'hoje', 'amanha', 'sete'].map((k) => [m['debt_due:' + k].level, m['debt_due:' + k].params.days_left]),
    [['critical', -2], ['critical', 0], ['warning', 1], ['info', 7]],
  );
  assert.strictEqual(m['debt_due:oito'], undefined);
  assert.strictEqual(m['debt_due:paga'], undefined);
  assert.strictEqual(m['debt_due:venc'].params.remaining, 100000);
});

test('txeneka com vencimento 00:30 de Maputo conta pelo dia de Maputo', () => {
  // 18/10 22:30 UTC = 19/10 00:30 em Maputo: vence amanha, nao hoje.
  const m = byId(buildNotifications({ now: NOW, debts: [{ id: 'x', debtor_name: 'X', total_amount: 1000, amount_paid: 0, due_date: new Date('2026-10-18T22:30:00Z') }] }));
  assert.strictEqual(m['debt_due:x'].params.days_left, 1);
});

test('fecho de turno: diferenca negativa e aviso, positiva info, mais de 7 dias ou zero nao aparece', () => {
  const items = buildNotifications({ now: NOW, closings: [
    { id: 'f', cashier_name: 'Carlos', difference: -5000, shift_day: '2026-10-17' },
    { id: 's', cashier_name: 'Wendy', difference: 2000, shift_day: '2026-10-12' },
    { id: 'old', cashier_name: 'Carlos', difference: -100, shift_day: '2026-10-11' },
    { id: 'z', cashier_name: 'Carlos', difference: 0, shift_day: '2026-10-18' },
  ] });
  const m = byId(items);
  assert.strictEqual(m['shift_difference:f'].level, 'warning');
  assert.strictEqual(m['shift_difference:f'].link, '/app/relatorios?tab=daily&date=2026-10-17');
  assert.strictEqual(m['shift_difference:s'].level, 'info');
  assert.strictEqual(m['shift_difference:old'], undefined);
  assert.strictEqual(m['shift_difference:z'], undefined);
});

test('fecho recusado (Etapa A8): escrito, esperado e tentativa; a 3.a e critica; mais de 7 dias nao aparece', () => {
  const items = buildNotifications({ now: NOW, failedAttempts: [
    { id: 'a1', at: new Date('2026-10-18T10:00:00Z'), cashier: 'Carlos', declared: 1600000, expected: 1700000, attempt: 1 },
    { id: 'a3', at: new Date('2026-10-18T10:20:00Z'), cashier: 'Carlos', declared: 1650000, expected: 1700000, attempt: 3 },
    { id: 'old', at: new Date('2026-10-10T10:00:00Z'), cashier: 'Carlos', declared: 0, expected: 100, attempt: 1 },
  ] });
  const m = byId(items);
  assert.strictEqual(m['shift_attempt_fail:a1'].level, 'warning');
  assert.deepStrictEqual(m['shift_attempt_fail:a1'].params, { cashier: 'Carlos', declared: 1600000, expected: 1700000, attempt: 1, max: 3, day: '2026-10-18' });
  assert.strictEqual(m['shift_attempt_fail:a3'].level, 'critical');
  assert.strictEqual(m['shift_attempt_fail:old'], undefined);
});

test('meta atingida so quando ha meta e o vendido chega a ela', () => {
  assert.strictEqual(buildNotifications({ now: NOW, goal: { target: 100000, current: 99999, month: 10, year: 2026 } }).length, 0);
  assert.strictEqual(buildNotifications({ now: NOW, goal: { target: 0, current: 5000, month: 10, year: 2026 } }).length, 0);
  const [g] = buildNotifications({ now: NOW, goal: { target: 100000, current: 100000, month: 10, year: 2026 } });
  assert.deepStrictEqual([g.type, g.level, g.id], ['goal_reached', 'success', 'goal_reached:2026-10']);
});

test('fecho do dia: so depois da hora de fecho e com vendas hoje', () => {
  const sales = { count: 3, revenue: 45000 };
  assert.strictEqual(buildNotifications({ now: NOW, todaySales: sales, closingTime: '15:01' }).length, 0);
  assert.strictEqual(buildNotifications({ now: NOW, todaySales: { count: 0, revenue: 0 }, closingTime: '08:00' }).length, 0);
  const [d] = buildNotifications({ now: NOW, todaySales: sales, closingTime: '15:00' });
  assert.deepStrictEqual([d.type, d.link, d.params.sales, d.params.revenue], ['day_closed', '/app/relatorios?tab=daily&date=2026-10-18', 3, 45000]);
});

test('ordem: criticos primeiro, depois avisos, info e sucesso', () => {
  const items = buildNotifications({
    now: NOW,
    goal: { target: 1, current: 2, month: 10, year: 2026 },
    lowStock: [{ id: 'p', name: 'P', stock_qty: 30, min_stock: 40 }],
    lockedCashiers: [{ id: 'c', name: 'Carlos' }],
    debts: [debt('amanha', '2026-10-19')],
    expiringLots: [{ lot_id: 'l', name: 'Iogurte', quantity: 4, days_left: 0 }],
  });
  assert.deepStrictEqual(items.map((i) => i.level), ['critical', 'critical', 'warning', 'info', 'success']);
  assert.deepStrictEqual(items.slice(0, 2).map((i) => i.type), ['cashier_locked', 'lot_expiring']);
});
