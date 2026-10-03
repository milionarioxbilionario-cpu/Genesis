// Relatorios do dono (Genesis 2.0) — especificacao 6.3.
//
// Regras de calculo (todas em centavos inteiros):
//  - so vendas `completed` contam como receita; canceladas sao listadas a parte;
//  - custo das mercadorias = unit_cost_price gravado NA VENDA x quantidade;
//  - lucro liquido mensal = lucro bruto - salarios - renda - outros fixos -
//    entregas de fornecedores (services/monthlyDeductions.js, ja testado).
const prisma = require('../utils/prisma');
const { computeMonthlyDeductions, computeMonthlyNetProfit } = require('./monthlyDeductions');

// 'mobile_money' (antes de separar M-Pesa e e-Mola) so aparece se houver vendas.
const PAYMENT_METHODS = ['cash', 'mpesa', 'emola', 'card'];
const dayKey = (d) => {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
};

function dayRange(dateStr) {
  const [y, m, d] = String(dateStr || dayKey(new Date())).split('-').map(Number);
  const start = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  const end = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
  return { start, end };
}

// Nucleo comum a todos os periodos.
async function summarize(tenantId, start, end) {
  const range = { gte: start, lte: end };
  const [sales, cancelled, closings, demand] = await Promise.all([
    prisma.sale.findMany({ where: { tenant_id: tenantId, status: 'completed', created_at: range }, include: { items: true, cashier: { select: { name: true } } } }),
    prisma.sale.findMany({ where: { tenant_id: tenantId, status: 'cancelled', created_at: range }, include: { cashier: { select: { name: true } } }, orderBy: { created_at: 'desc' } }),
    prisma.shiftClosing.findMany({ where: { tenant_id: tenantId, closed_at: range }, include: { cashier: { select: { name: true } } }, orderBy: { closed_at: 'desc' } }),
    prisma.demandCapture.findMany({ where: { tenant_id: tenantId, requested_at: range }, include: { product: { select: { name: true } } } }),
  ]);

  const byPayment = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, 0]));
  const products = new Map();
  const categories = new Map();
  const cashiers = new Map();
  const byDay = new Map();
  let gross = 0; let cogs = 0; let discounts = 0;

  for (const s of sales) {
    gross += s.total_amount;
    discounts += s.discount_amount || 0;
    byPayment[s.payment_method] = (byPayment[s.payment_method] || 0) + s.total_amount;
    const k = dayKey(s.created_at);
    const d = byDay.get(k) || { date: k, revenue: 0, sales: 0 };
    d.revenue += s.total_amount; d.sales += 1; byDay.set(k, d);
    const c = cashiers.get(s.cashier_user_id) || { cashier_id: s.cashier_user_id, name: s.cashier?.name || '—', sales: 0, revenue: 0 };
    c.sales += 1; c.revenue += s.total_amount; cashiers.set(s.cashier_user_id, c);
    for (const it of s.items) {
      const line = it.quantity * it.unit_sell_price;
      const lineCost = it.quantity * it.unit_cost_price;
      cogs += lineCost;
      const p = products.get(it.product_id) || { product_id: it.product_id, name: it.product_name, quantity: 0, revenue: 0, profit: 0 };
      p.quantity += it.quantity; p.revenue += line; p.profit += line - lineCost; products.set(it.product_id, p);
    }
  }

  // Categoria vem do produto actual (a venda nao guarda categoria).
  if (products.size) {
    const cats = await prisma.product.findMany({ where: { tenant_id: tenantId, id: { in: [...products.keys()] } }, select: { id: true, category: true } });
    const catOf = new Map(cats.map((p) => [p.id, p.category || 'Geral']));
    for (const p of products.values()) {
      const name = catOf.get(p.product_id) || 'Geral';
      const c = categories.get(name) || { category: name, revenue: 0, quantity: 0 };
      c.revenue += p.revenue; c.quantity += p.quantity; categories.set(name, c);
    }
  }

  const demandByProduct = new Map();
  for (const dc of demand) {
    const e = demandByProduct.get(dc.product_id) || { product_id: dc.product_id, name: dc.product?.name || '—', requests: 0 };
    e.requests += 1; demandByProduct.set(dc.product_id, e);
  }

  const productList = [...products.values()];
  return {
    period: { start, end },
    sales_count: sales.length,
    gross_revenue: gross,
    cost_of_goods: cogs,
    gross_profit: gross - cogs,
    average_ticket: sales.length ? Math.round(gross / sales.length) : 0,
    discounts_total: discounts,
    by_payment: byPayment,
    by_day: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
    top_products: [...productList].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
    most_profitable: [...productList].sort((a, b) => b.profit - a.profit)[0] || null,
    by_category: [...categories.values()].sort((a, b) => b.revenue - a.revenue),
    by_cashier: [...cashiers.values()].sort((a, b) => b.revenue - a.revenue),
    cancellations: cancelled.map((s) => ({ id: s.id, daily_number: s.daily_number, total_amount: s.total_amount, cashier: s.cashier?.name || '—', reason: s.cancel_reason, created_at: s.created_at })),
    cancelled_total: cancelled.reduce((sum, s) => sum + s.total_amount, 0),
    shift_closings: closings.map((c) => ({ id: c.id, cashier: c.cashier?.name || '—', counted_amount: c.counted_amount, expected_amount: c.expected_amount, difference: c.difference, closed_at: c.closed_at })),
    lost_demand: [...demandByProduct.values()].sort((a, b) => b.requests - a.requests),
  };
}

async function dailyReport(tenantId, dateStr) {
  const { start, end } = dayRange(dateStr);
  return { date: dayKey(start), ...(await summarize(tenantId, start, end)) };
}

async function weeklyReport(tenantId, startStr, endStr) {
  const end = dayRange(endStr).end;
  const start = startStr ? dayRange(startStr).start : new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);
  const report = await summarize(tenantId, start, end);
  // Serie diaria completa (dias sem vendas a zero) para o grafico.
  const series = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = dayKey(d);
    series.push(report.by_day.find((x) => x.date === k) || { date: k, revenue: 0, sales: 0 });
  }
  return { start: dayKey(start), end: dayKey(end), ...report, by_day: series };
}

async function monthlyReport(tenantId, year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const historyStart = new Date(year, month - 6, 1, 0, 0, 0, 0);
  const [report, employees, fixedCosts, suppliers, stockEntries, history] = await Promise.all([
    summarize(tenantId, start, end),
    prisma.employee.findMany({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.fixedCost.findMany({ where: { tenant_id: tenantId } }),
    prisma.supplier.findMany({ where: { tenant_id: tenantId } }),
    prisma.stockEntry.findMany({ where: { tenant_id: tenantId, created_at: { gte: start, lte: end } }, select: { supplier_id: true, created_at: true } }),
    prisma.sale.findMany({ where: { tenant_id: tenantId, status: 'completed', created_at: { gte: historyStart, lte: end } }, select: { total_amount: true, created_at: true } }),
  ]);
  const deductions = computeMonthlyDeductions({ employees, fixedCosts, suppliers, stockEntries });
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    months.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), revenue: 0 });
  }
  for (const s of history) {
    const d = new Date(s.created_at);
    const m = months.find((x) => x.key === d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    if (m) m.revenue += s.total_amount;
  }
  return {
    period: { year, month },
    ...report,
    deductions,
    net_profit: computeMonthlyNetProfit(report.gross_profit, deductions),
    revenue_history: months,
  };
}

async function totalReport(tenantId) {
  const [agg, first] = await Promise.all([
    prisma.sale.aggregate({ where: { tenant_id: tenantId, status: 'completed' }, _sum: { total_amount: true }, _count: true }),
    prisma.sale.findFirst({ where: { tenant_id: tenantId }, orderBy: { created_at: 'asc' }, select: { created_at: true } }),
  ]);
  return { total_revenue: Number(agg._sum.total_amount || 0), sales_count: agg._count, since: first?.created_at || null };
}

module.exports = { dailyReport, weeklyReport, monthlyReport, totalReport, dayKey, dayRange };
