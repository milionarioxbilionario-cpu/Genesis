const money = (v) => Number(v || 0);

const isRent = (type) => String(type || '').trim().toLowerCase() === 'rent';
// Fase 15.3: custo fixo anual (ex.: taxas do municipio) conta 1/12 em cada mes.
const monthlyAmount = (fc) => (fc.period === 'annual' ? Math.round(money(fc.amount) / 12) : money(fc.amount));
const isFine = (e) => e.kind === 'fine';

const visitKey = (supplierId, createdAt) => {
  const d = new Date(createdAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${supplierId}|${y}-${m}-${day}`;
};

// expenses: despesas avulsas JA filtradas pelo mes (limpeza, transporte, luz...).
// Fase 15.2: taxes = { vat_due, ispc } ja calculados (services/tax.js) e inssPct = %
// do INSS do patrao sobre os salarios (0 = trabalhadores nao inscritos).
function computeMonthlyDeductions({ employees = [], fixedCosts = [], suppliers = [], stockEntries = [], expenses = [], taxes = {}, inssPct = 0 } = {}) {
  const total_salaries = employees.reduce((sum, emp) => sum + money(emp.monthly_salary), 0);
  const total_rent = fixedCosts.reduce((sum, fc) => sum + (isRent(fc.type) ? monthlyAmount(fc) : 0), 0);
  const total_other_fixed = fixedCosts.reduce((sum, fc) => sum + (isRent(fc.type) ? 0 : monthlyAmount(fc)), 0);
  const total_fixed = total_rent + total_other_fixed;

  const costBySupplier = new Map(
    suppliers.map((supplier) => [supplier.id, money(supplier.delivery_cost_per_visit)])
  );

  const visits = new Set();
  for (const entry of stockEntries) {
    if (!entry.supplier_id) continue;
    visits.add(visitKey(entry.supplier_id, entry.created_at));
  }

  let total_supplier_delivery = 0;
  for (const key of visits) {
    const supplierId = key.slice(0, key.indexOf('|'));
    total_supplier_delivery += costBySupplier.get(supplierId) || 0;
  }

  // Multas (Fase 15.3) ficam numa linha propria; o resto sao despesas avulsas.
  const total_expenses = expenses.reduce((sum, e) => sum + (isFine(e) ? 0 : money(e.amount)), 0);
  const total_fines = expenses.reduce((sum, e) => sum + (isFine(e) ? money(e.amount) : 0), 0);

  const total_vat_due = money(taxes.vat_due);
  const total_ispc = money(taxes.ispc);
  const total_inss = Math.round((total_salaries * money(inssPct)) / 100);
  const total_taxes = total_vat_due + total_ispc + total_inss;

  const operating_expenses = total_salaries + total_fixed + total_supplier_delivery + total_expenses + total_fines + total_taxes;

  return {
    total_salaries,
    total_rent,
    total_other_fixed,
    total_fixed,
    total_supplier_delivery,
    total_expenses,
    total_fines,
    total_vat_due,
    total_ispc,
    total_inss,
    total_taxes,
    operating_expenses,
  };
}

function computeMonthlyNetProfit(grossProfit, deductions) {
  return money(grossProfit) - money(deductions?.operating_expenses);
}

module.exports = {
  monthlyAmount,
  computeMonthlyDeductions,
  computeMonthlyNetProfit,
};
