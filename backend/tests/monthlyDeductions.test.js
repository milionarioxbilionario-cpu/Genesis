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

test('despesas avulsas entram no lucro líquido como linha própria', () => {
  const deductions = computeMonthlyDeductions({
    employees: [{ monthly_salary: 100 }],
    fixedCosts: [{ type: 'rent', amount: 40 }],
    expenses: [{ amount: 15 }, { amount: 5 }],
  });
  assert.equal(deductions.total_expenses, 20);
  assert.equal(deductions.total_fixed, 40);
  assert.equal(deductions.operating_expenses, 160);
  assert.equal(computeMonthlyNetProfit(500, deductions), 340);
});

test('sem despesas avulsas a linha é zero e a fórmula não muda', () => {
  const d = computeMonthlyDeductions({ fixedCosts: [{ type: 'rent', amount: 40 }] });
  assert.equal(d.total_expenses, 0);
  assert.equal(d.operating_expenses, 40);
});

// Fase 15.2: impostos e INSS do patrao descontam no lucro liquido.
test('impostos: IVA a entregar, ISPC e INSS do patrao (4% dos salarios) entram nas deducoes', () => {
  const d = computeMonthlyDeductions({
    employees: [{ monthly_salary: 1000000 }, { monthly_salary: 750000 }],
    taxes: { vat_due: 12345, ispc: 0 },
    inssPct: 4,
  });
  assert.equal(d.total_inss, 70000); // 4% de 17 500 MT = 700 MT
  assert.equal(d.total_vat_due, 12345);
  assert.equal(d.total_taxes, 82345);
  assert.equal(d.operating_expenses, 1750000 + 82345);
  assert.equal(computeMonthlyNetProfit(5000000, d), 5000000 - 1750000 - 82345);
});

test('sem regime de impostos nem INSS: nada muda (lojas antigas)', () => {
  const d = computeMonthlyDeductions({ employees: [{ monthly_salary: 1000000 }] });
  assert.equal(d.total_taxes, 0);
  assert.equal(d.operating_expenses, 1000000);
});

// Fase 15.3: multas numa linha propria; custos anuais repartidos por 12.
test('multas: linha propria, descontam no lucro e nao contam como despesas avulsas', () => {
  const d = computeMonthlyDeductions({ expenses: [{ amount: 50000, kind: 'expense' }, { amount: 250000, kind: 'fine' }, { amount: 1000 }] });
  assert.equal(d.total_expenses, 51000);
  assert.equal(d.total_fines, 250000);
  assert.equal(d.operating_expenses, 301000);
});

test('taxa anual do municipio: 1/12 por mes, arredondado ao centavo', () => {
  const d = computeMonthlyDeductions({ fixedCosts: [{ type: 'municipal', amount: 1200000, period: 'annual' }, { type: 'rent', amount: 500000 }, { type: 'other', amount: 100, period: 'annual' }] });
  assert.equal(d.total_rent, 500000);
  assert.equal(d.total_other_fixed, 100000 + 8); // 12 000 MT / 12 = 1 000 MT; 1 MT / 12 = 0,08 MT
  assert.equal(d.total_fixed, 600008);
});
