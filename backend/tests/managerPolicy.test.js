// Gerente (E2): lista fechada de rotas do dono e respostas sem numeros sensiveis.
const test = require('node:test');
const assert = require('node:assert');
const { managerAllowed, stripSensitive, isSensitiveKey, managerShape, managerLiveEvent } = require('../src/utils/managerPolicy');

test('o gerente passa nas rotas do dia-a-dia', () => {
  for (const [m, u] of [['GET', '/api/owner/overview'], ['GET', '/api/owner/sales?page=1'], ['GET', '/api/owner/reports/daily?date=2026-11-01'], ['POST', '/api/owner/cashiers'], ['PUT', '/api/owner/cashiers/abc/pin'], ['POST', '/api/owner/terminals/pairing-code'], ['GET', '/api/products'], ['PATCH', '/api/products/x1/stock'], ['POST', '/api/inventory/stock'], ['POST', '/api/sales/s1/cancel'], ['PUT', '/api/settings/hours'], ['PUT', '/api/profile/password'], ['GET', '/api/owner/audit/a1'], ['PUT', '/api/settings/store']]) {
    assert.ok(managerAllowed(m, u), `${m} ${u}`);
  }
});

test('o gerente NAO passa no que e do dono (lucro, custos, salarios, contacto, conta)', () => {
  for (const [m, u] of [['GET', '/api/owner/reports/monthly'], ['GET', '/api/owner/reports/total'], ['GET', '/api/owner/employees'], ['GET', '/api/owner/payroll'], ['GET', '/api/settings/fixed-costs'], ['POST', '/api/settings/expenses'], ['PUT', '/api/settings/taxes'], ['PUT', '/api/settings/authorization-pin'], ['PUT', '/api/settings/location'], ['GET', '/api/dashboard/summary'], ['GET', '/api/profile'], ['PUT', '/api/profile/email'], ['DELETE', '/api/products/x1'], ['POST', '/api/owner/goals'], ['GET', '/api/inventory/price-history'], ['PUT', '/api/owner/employees/e1'], ['DELETE', '/api/owner/terminals/t1'], ['GET', '/api/owner/month-close'], ['GET', '/api/establishments'], ['GET', '/api/managers'], ['GET', '/api/group/overview']]) {
    assert.ok(!managerAllowed(m, u), `${m} ${u} devia ser recusado`);
  }
});

test('nomes sensiveis pelos pedacos do campo (snake e camel); os neutros ficam', () => {
  for (const k of ['cost_price', 'unit_cost_price', 'grossProfit', 'top_profitable', 'most_profitable', 'fixed_costs', 'monthly_salary', 'rent', 'margin_pct', 'cost_of_goods', 'expenses', 'delivery_cost_per_visit', 'investment', 'losses_total', 'vat', 'net_profit']) {
    assert.ok(isSensitiveKey(k), k);
  }
  for (const k of ['current', 'parent_id', 'custom', 'custom_items_enabled', 'total_amount', 'unit_sell_price', 'revenue', 'payment_method', 'discount_amount', 'vat_amount', 'quantity', 'losses']) {
    assert.ok(!isSensitiveKey(k), k);
  }
});

test('respostas: custo, lucro, margem, salarios saem em qualquer nivel; o resto fica', () => {
  const out = stripSensitive({ total: 1000, profit: 400, items: [{ name: 'A', unit_cost_price: 60, unit_sell_price: 100 }], today: { revenue: 5, gross_profit: 2 }, at: new Date('2026-11-01T00:00:00Z') });
  assert.deepStrictEqual(Object.keys(out).sort(), ['at', 'items', 'today', 'total']);
  assert.deepStrictEqual(out.items[0], { name: 'A', unit_sell_price: 100 });
  assert.deepStrictEqual(out.today, { revenue: 5 });
  assert.ok(out.at instanceof Date);
});

test('formas por rota: perdas sem valor, rastreio sem valor de perdas/stock, conta do dono e plano fora', () => {
  const daily = managerShape('GET', '/api/owner/reports/daily?date=2026-11-01', { gross_revenue: 900, gross_profit: 300, losses: [{ name: 'A', quantity: 2, value: 120 }], losses_total: 120, by_day: [{ date: 'x', revenue: 900, losses: 120 }], result_after_losses: 180 });
  assert.deepStrictEqual(daily, { gross_revenue: 900, losses: [{ name: 'A', quantity: 2 }], by_day: [{ date: 'x', revenue: 900 }] });
  const tl = managerShape('GET', '/api/owner/reports/timeline', { totals: { gains: 10, losses: -5, profit: 3, count: 2 }, rows: [{ type: 'sale', amount: 10, profit: 3 }, { type: 'loss', amount: -5, unit_cost: 5 }, { type: 'stock', amount: 50 }] });
  assert.deepStrictEqual(tl, { totals: { gains: 10, count: 2 }, rows: [{ type: 'sale', amount: 10 }, { type: 'loss' }, { type: 'stock' }] });
  const t = managerShape('GET', '/api/owner/tenant', { id: 't', name: 'Loja', phone: '84', email: 'a@b', trial_ends_at: 1, subscription_price: 800000, status: 'active' });
  assert.deepStrictEqual(t, { id: 't', name: 'Loja', status: 'active' });
  const s = managerShape('GET', '/api/settings', { store: { name: 'L', phone: '84', email: 'e', nuit: '1', receipt_footer: 'Obrigado' }, hours: { a: 1 }, taxes: { vat_mode: 'iva' }, fixed_costs: [], report_schedule: {}, discount_free_pct: 10, expiry_alert_days: 7, custom_items_enabled: true, status: 'active', trial_ends_at: 1 });
  assert.deepStrictEqual(s, { store: { name: 'L', receipt_footer: 'Obrigado' }, hours: { a: 1 }, discount_free_pct: 10, custom_items_enabled: true, expiry_alert_days: 7, status: 'active' });
  const sl = managerShape('GET', '/api/shopping-lists', [{ id: 'l', totals: { units: 3, investment: 100, delivery: 5, total: 105 } }]);
  assert.deepStrictEqual(sl, [{ id: 'l', totals: { units: 3 } }]);
  const n = managerShape('GET', '/api/owner/notifications', { items: [{ type: 'no_location' }, { type: 'stock_low' }, { type: 'cost_missing' }], count: 3 });
  assert.deepStrictEqual(n, { items: [{ type: 'stock_low' }], count: 1 });
});

test('canal ao vivo do gerente: sem despesas; perdas e entradas sem valor; vendas sem lucro', () => {
  assert.strictEqual(managerLiveEvent({ type: 'expense', total: 100 }), null);
  assert.deepStrictEqual(managerLiveEvent({ type: 'loss', total: 50, name: 'A' }), { type: 'loss', total: null, name: 'A' });
  assert.deepStrictEqual(managerLiveEvent({ type: 'stock_in', total: 900 }), { type: 'stock_in', total: null });
  assert.deepStrictEqual(managerLiveEvent({ type: 'sale', total: 100, profit: 40 }), { type: 'sale', total: 100 });
});
