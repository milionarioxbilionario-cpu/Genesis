const test = require('node:test');
const assert = require('node:assert/strict');
const { computeMonthlyDeductions, computeMonthlyNetProfit } = require('../src/services/monthlyDeductions');

test('renda vem de fixedCosts type=rent; outros tipos ficam em other', () => {
  const d = computeMonthlyDeductions({
    employees: [{ monthly_salary: 250000 }],
    fixedCosts: [
      { type: 'rent', amount: 1500000 },
      { type: 'RENT', amount: 50000 },
      { type: 'utilities', amount: 20000 },
    ],
  });
  assert.equal(d.total_salaries, 250000);
  assert.equal(d.total_rent, 1550000);
  assert.equal(d.total_other_fixed, 20000);
  assert.equal(d.total_fixed, 1570000);
  assert.equal(d.total_supplier_delivery, 0);
  assert.equal(d.operating_expenses, 250000 + 1570000);
});

test('fornecedores activos sem entradas de stock no período não geram custo de entrega', () => {
  const d = computeMonthlyDeductions({
    suppliers: [
      { id: 's1', delivery_cost_per_visit: 10000 },
      { id: 's2', delivery_cost_per_visit: 20000 },
    ],
    stockEntries: [],
  });
  assert.equal(d.total_supplier_delivery, 0);
});

test('várias linhas de stock no mesmo dia e fornecedor contam uma visita', () => {
  const d = computeMonthlyDeductions({
    suppliers: [{ id: 's1', delivery_cost_per_visit: 8000 }],
    stockEntries: [
      { supplier_id: 's1', created_at: '2026-09-10T08:00:00' },
      { supplier_id: 's1', created_at: '2026-09-10T18:00:00' },
    ],
  });
  assert.equal(d.total_supplier_delivery, 8000);
});

test('o mesmo fornecedor em dias diferentes conta duas visitas', () => {
  const d = computeMonthlyDeductions({
    suppliers: [{ id: 's1', delivery_cost_per_visit: 8000 }],
    stockEntries: [
      { supplier_id: 's1', created_at: '2026-09-10T08:00:00' },
      { supplier_id: 's1', created_at: '2026-09-11T08:00:00' },
    ],
  });
  assert.equal(d.total_supplier_delivery, 16000);
});

test('entrada sem supplier_id não entra no custo de entrega', () => {
  const d = computeMonthlyDeductions({
    suppliers: [{ id: 's1', delivery_cost_per_visit: 8000 }],
    stockEntries: [{ supplier_id: null, created_at: '2026-09-10T08:00:00' }],
  });
  assert.equal(d.total_supplier_delivery, 0);
});

test('lucro líquido = lucro bruto - despesas operacionais (renda incluída)', () => {
  const deductions = computeMonthlyDeductions({
    employees: [{ monthly_salary: 100 }],
    fixedCosts: [{ type: 'rent', amount: 40 }],
    suppliers: [{ id: 's1', delivery_cost_per_visit: 10 }],
    stockEntries: [{ supplier_id: 's1', created_at: '2026-09-01T12:00:00' }],
  });
  assert.equal(deductions.operating_expenses, 150);
  assert.equal(computeMonthlyNetProfit(500, deductions), 350);
});
