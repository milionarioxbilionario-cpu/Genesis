// Relatorios do dono (Genesis 2.0) — especificacao 6.3.
//
// Regras de calculo (todas em centavos inteiros):
//  - so vendas `completed` contam como receita; canceladas sao listadas a parte;
//  - custo das mercadorias = unit_cost_price gravado NA VENDA x quantidade;
//  - lucro liquido mensal = lucro bruto - salarios - renda - outros fixos -
//    entregas de fornecedores (services/monthlyDeductions.js, ja testado).
const prisma = require('../utils/prisma');
const { computeMonthlyDeductions, computeMonthlyNetProfit } = require('./monthlyDeductions');
const { recommendRestock } = require('./restock');

const SHRINK_REASON = { broken: 'Partido', expired: 'Validade expirada', internal_consumption: 'Consumo interno', other: 'Outro' };
const pctChange = (now, before) => (before ? Math.round(((now - before) / Math.abs(before)) * 1000) / 10 : null);

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
  const [sales, cancelled, closings, demand, shrinkage] = await Promise.all([
    prisma.sale.findMany({ where: { tenant_id: tenantId, status: 'completed', created_at: range }, include: { items: true, cashier: { select: { name: true } } } }),
    prisma.sale.findMany({ where: { tenant_id: tenantId, status: 'cancelled', created_at: range }, include: { cashier: { select: { name: true } } }, orderBy: { created_at: 'desc' } }),
    prisma.shiftClosing.findMany({ where: { tenant_id: tenantId, closed_at: range }, include: { cashier: { select: { name: true } } }, orderBy: { closed_at: 'desc' } }),
    prisma.demandCapture.findMany({ where: { tenant_id: tenantId, requested_at: range }, include: { product: { select: { name: true } } } }),
    prisma.shrinkageRecord.findMany({ where: { tenant_id: tenantId, recorded_at: range }, include: { product: { select: { name: true, barcode: true, cost_price: true } } }, orderBy: { recorded_at: 'desc' } }),
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
    const d = byDay.get(k) || { date: k, revenue: 0, sales: 0, gross_profit: 0, losses: 0 };
    d.revenue += s.total_amount; d.sales += 1; byDay.set(k, d);
    // Lucro bruto por venda = total (ja com desconto) - custo gravado na venda.
    d.gross_profit += s.total_amount - s.items.reduce((sum, it) => sum + it.quantity * it.unit_cost_price, 0);
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

  // Perdas (quebras, validades, consumo interno) a preco de custo. Registos
  // antigos sem custo usam o custo actual do produto.
  const losses = shrinkage.map((r) => {
    const unit = r.unit_cost ?? r.product?.cost_price ?? 0;
    return { id: r.id, product_id: r.product_id, name: r.product?.name || '—', barcode: r.product?.barcode || null, quantity: r.quantity, reason: r.reason, reason_label: SHRINK_REASON[r.reason] || r.reason, value: r.quantity * unit, recorded_at: r.recorded_at, lot_id: r.lot_id || null };
  });
  for (const l of losses) {
    const k = dayKey(l.recorded_at);
    const d = byDay.get(k) || { date: k, revenue: 0, sales: 0, gross_profit: 0, losses: 0 };
    d.losses += l.value; byDay.set(k, d);
  }
  const lossesByReason = {};
  for (const l of losses) lossesByReason[l.reason] = (lossesByReason[l.reason] || 0) + l.value;
  const lossesTotal = losses.reduce((s, l) => s + l.value, 0);

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
    // "Mais vendido" (quantidade) e "mais rentavel" (lucro) sao coisas diferentes.
    top_profitable: [...productList].sort((a, b) => b.profit - a.profit).slice(0, 10),
    most_sold: [...productList].sort((a, b) => b.quantity - a.quantity)[0] || null,
    most_profitable: [...productList].sort((a, b) => b.profit - a.profit)[0] || null,
    losses,
    losses_total: lossesTotal,
    losses_by_reason: lossesByReason,
    // Resultado do periodo = lucro bruto - perdas (antes das despesas fixas).
    result_after_losses: gross - cogs - lossesTotal,
    by_category: [...categories.values()].sort((a, b) => b.revenue - a.revenue),
    by_cashier: [...cashiers.values()].sort((a, b) => b.revenue - a.revenue),
    cancellations: cancelled.map((s) => ({ id: s.id, daily_number: s.daily_number, total_amount: s.total_amount, cashier: s.cashier?.name || '—', reason: s.cancel_reason, created_at: s.created_at })),
    cancelled_total: cancelled.reduce((sum, s) => sum + s.total_amount, 0),
    shift_closings: closings.map((c) => ({ id: c.id, cashier: c.cashier?.name || '—', counted_amount: c.counted_amount, expected_amount: c.expected_amount, difference: c.difference, closed_at: c.closed_at })),
    lost_demand: [...demandByProduct.values()].sort((a, b) => b.requests - a.requests),
  };
}

// Receita e numero de vendas concluidas num intervalo (comparacoes baratas).
async function revenueBetween(tenantId, start, end) {
  const agg = await prisma.sale.aggregate({ where: { tenant_id: tenantId, status: 'completed', created_at: { gte: start, lte: end } }, _sum: { total_amount: true }, _count: true });
  return { revenue: Number(agg._sum.total_amount || 0), sales: agg._count };
}

// Recomendacao de restock: ritmo das ultimas `windowDays` ate `end`.
async function restockFor(tenantId, end, coverDays, windowDays = 28) {
  const from = new Date(end.getTime() - windowDays * 86400000);
  const [products, items, demand] = await Promise.all([
    prisma.product.findMany({ where: { tenant_id: tenantId, is_active: true }, select: { id: true, name: true, stock_qty: true, cost_price: true } }),
    prisma.saleItem.findMany({ where: { sale: { tenant_id: tenantId, status: 'completed', created_at: { gte: from, lte: end } } }, select: { product_id: true, quantity: true } }),
    prisma.demandCapture.findMany({ where: { tenant_id: tenantId, requested_at: { gte: from, lte: end } }, select: { product_id: true } }),
  ]);
  const soldByProduct = {};
  for (const it of items) soldByProduct[it.product_id] = (soldByProduct[it.product_id] || 0) + it.quantity;
  const lostByProduct = {};
  for (const d of demand) lostByProduct[d.product_id] = (lostByProduct[d.product_id] || 0) + 1;
  return recommendRestock({ products, soldByProduct, lostByProduct, windowDays, coverDays });
}

// Serie diaria completa (dias sem movimento a zero).
function fillDays(byDay, start, end) {
  const series = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = dayKey(d);
    series.push(byDay.find((x) => x.date === k) || { date: k, revenue: 0, sales: 0, gross_profit: 0, losses: 0 });
  }
  return series;
}
const bestWorst = (days, key) => {
  const active = days.filter((d) => d.sales > 0 || d.losses > 0);
  if (!active.length) return { best: null, worst: null };
  const sorted = [...active].sort((a, b) => (b[key] - b.losses) - (a[key] - a.losses));
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
};

async function dailyReport(tenantId, dateStr) {
  const { start, end } = dayRange(dateStr);
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
  const prev = { start: new Date(start.getTime() - 86400000), end: new Date(end.getTime() - 86400000) };
  const [report, goal, monthToDate, previous] = await Promise.all([
    summarize(tenantId, start, end),
    prisma.saleGoal.findFirst({ where: { tenant_id: tenantId, month: start.getMonth() + 1, year: start.getFullYear() }, orderBy: { created_at: 'desc' } }),
    revenueBetween(tenantId, monthStart, end),
    revenueBetween(tenantId, prev.start, prev.end),
  ]);
  // Quanto da meta do mes entrou neste dia e quanto ja vai acumulado.
  const target = goal?.target_amount || 0;
  const goal_progress = target ? {
    target,
    today_pct: Math.round((report.gross_revenue / target) * 1000) / 10,
    accumulated: monthToDate.revenue,
    accumulated_pct: Math.round((monthToDate.revenue / target) * 1000) / 10,
  } : null;
  return {
    date: dayKey(start),
    ...report,
    goal_progress,
    compare: { previous_date: dayKey(prev.start), previous_revenue: previous.revenue, previous_sales: previous.sales, revenue_change_pct: pctChange(report.gross_revenue, previous.revenue) },
  };
}

async function weeklyReport(tenantId, startStr, endStr) {
  const end = dayRange(endStr).end;
  const start = startStr ? dayRange(startStr).start : new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);
  const span = end.getTime() - start.getTime() + 1;
  const [report, previous, restock] = await Promise.all([
    summarize(tenantId, start, end),
    revenueBetween(tenantId, new Date(start.getTime() - span), new Date(start.getTime() - 1)),
    restockFor(tenantId, end, 7),
  ]);
  const series = fillDays(report.by_day, start, end);
  const { best, worst } = bestWorst(series, 'gross_profit');
  return {
    start: dayKey(start), end: dayKey(end), ...report, by_day: series,
    best_day: best, worst_day: worst,
    compare: { previous_revenue: previous.revenue, previous_sales: previous.sales, revenue_change_pct: pctChange(report.gross_revenue, previous.revenue) },
    restock,
  };
}

// Chenecas do periodo: novas, pagamentos recebidos e o que esta em aberto agora.
async function debtsSummary(tenantId, start, end) {
  const [created, payments, open] = await Promise.all([
    prisma.debt.findMany({ where: { tenant_id: tenantId, created_at: { gte: start, lte: end } }, orderBy: { created_at: 'asc' } }),
    prisma.debtPayment.findMany({ where: { paid_at: { gte: start, lte: end }, debt: { tenant_id: tenantId } }, include: { debt: { select: { debtor_name: true } } }, orderBy: { paid_at: 'asc' } }),
    prisma.debt.findMany({ where: { tenant_id: tenantId, status: { not: 'paid' } }, orderBy: { due_date: 'asc' } }),
  ]);
  return {
    new_total: created.reduce((s, d) => s + d.total_amount, 0),
    new: created.map((d) => ({ id: d.id, debtor: d.debtor_name, amount: d.total_amount, created_at: d.created_at, due_date: d.due_date })),
    received_total: payments.reduce((s, p) => s + p.amount, 0),
    received: payments.map((p) => ({ id: p.id, debtor: p.debt?.debtor_name || '—', amount: p.amount, paid_at: p.paid_at })),
    outstanding_total: open.reduce((s, d) => s + (d.total_amount - d.amount_paid), 0),
    outstanding: open.map((d) => ({ id: d.id, debtor: d.debtor_name, remaining: d.total_amount - d.amount_paid, due_date: d.due_date, overdue: new Date(d.due_date) < new Date() })),
  };
}

// Metas dos ultimos `months` meses: meta, atingido e percentagem.
async function goalsHistory(tenantId, months = 12, now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const [goals, sales] = await Promise.all([
    prisma.saleGoal.findMany({ where: { tenant_id: tenantId }, orderBy: { created_at: 'desc' } }),
    prisma.sale.findMany({ where: { tenant_id: tenantId, status: 'completed', created_at: { gte: from } }, select: { total_amount: true, created_at: true } }),
  ]);
  const rows = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear(); const month = d.getMonth() + 1;
    const g = goals.find((x) => x.year === year && x.month === month);
    const achieved = sales.filter((s) => { const c = new Date(s.created_at); return c.getFullYear() === year && c.getMonth() + 1 === month; }).reduce((s, x) => s + x.total_amount, 0);
    rows.push({ year, month, target: g?.target_amount || 0, achieved, pct: g?.target_amount ? Math.round((achieved / g.target_amount) * 1000) / 10 : null, current: i === 0 });
  }
  return rows;
}

async function monthlyReport(tenantId, year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const historyStart = new Date(year, month - 6, 1, 0, 0, 0, 0);
  const prevStart = new Date(year, month - 2, 1, 0, 0, 0, 0);
  const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
  const [report, employees, fixedCosts, suppliers, stockEntries, history, prevItems, debts, goal, restock] = await Promise.all([
    summarize(tenantId, start, end),
    prisma.employee.findMany({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.fixedCost.findMany({ where: { tenant_id: tenantId } }),
    prisma.supplier.findMany({ where: { tenant_id: tenantId } }),
    prisma.stockEntry.findMany({ where: { tenant_id: tenantId, created_at: { gte: start, lte: end } }, select: { supplier_id: true, created_at: true } }),
    prisma.sale.findMany({ where: { tenant_id: tenantId, status: 'completed', created_at: { gte: historyStart, lte: end } }, select: { total_amount: true, created_at: true } }),
    prisma.saleItem.findMany({ where: { sale: { tenant_id: tenantId, status: 'completed', created_at: { gte: prevStart, lte: prevEnd } } }, select: { product_id: true, product_name: true, quantity: true, unit_sell_price: true, unit_cost_price: true } }),
    debtsSummary(tenantId, start, end),
    prisma.saleGoal.findFirst({ where: { tenant_id: tenantId, month, year }, orderBy: { created_at: 'desc' } }),
    restockFor(tenantId, end < new Date() ? end : new Date(), 30),
  ]);

  // Mes anterior: receita e lucro bruto, para comparar.
  const prevRevenue = history.filter((s) => s.created_at >= prevStart && s.created_at <= prevEnd).reduce((s, x) => s + x.total_amount, 0);
  const prevGross = prevRevenue - prevItems.reduce((s, it) => s + it.quantity * it.unit_cost_price, 0);

  // Semanas do mes (1-7, 8-14, 15-21, 22-28, 29-fim).
  const days = fillDays(report.by_day, start, end);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    weeks.push({ week: weeks.length + 1, from: chunk[0].date, to: chunk[chunk.length - 1].date, revenue: chunk.reduce((s, d) => s + d.revenue, 0), gross_profit: chunk.reduce((s, d) => s + d.gross_profit, 0), losses: chunk.reduce((s, d) => s + d.losses, 0), sales: chunk.reduce((s, d) => s + d.sales, 0) });
  }
  const activeWeeks = weeks.filter((w) => w.sales > 0);
  const byResult = [...activeWeeks].sort((a, b) => (b.gross_profit - b.losses) - (a.gross_profit - a.losses));

  // Tendencias: quantidade vendida por produto vs mes anterior.
  const prevQty = new Map();
  for (const it of prevItems) prevQty.set(it.product_id, (prevQty.get(it.product_id) || 0) + it.quantity);
  const allNow = await prisma.saleItem.findMany({ where: { sale: { tenant_id: tenantId, status: 'completed', created_at: { gte: start, lte: end } } }, select: { product_id: true, product_name: true, quantity: true } });
  const nowQty = new Map();
  for (const it of allNow) { const e = nowQty.get(it.product_id) || { name: it.product_name, qty: 0 }; e.qty += it.quantity; nowQty.set(it.product_id, e); }
  const trends = [];
  for (const id of new Set([...nowQty.keys(), ...prevQty.keys()])) {
    const now = nowQty.get(id)?.qty || 0; const before = prevQty.get(id) || 0;
    const name = nowQty.get(id)?.name || prevItems.find((x) => x.product_id === id)?.product_name || '—';
    trends.push({ product_id: id, name, quantity: now, previous_quantity: before, change: now - before, change_pct: pctChange(now, before) });
  }
  trends.sort((a, b) => b.change - a.change);
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
  const netProfit = computeMonthlyNetProfit(report.gross_profit, deductions);
  return {
    period: { year, month },
    ...report,
    deductions,
    net_profit: netProfit,
    revenue_history: months,
    compare: {
      previous_revenue: prevRevenue, previous_gross_profit: prevGross,
      revenue_change_pct: pctChange(report.gross_revenue, prevRevenue),
      gross_profit_change_pct: pctChange(report.gross_profit, prevGross),
    },
    weeks,
    best_week: byResult[0] || null,
    worst_week: byResult.length > 1 ? byResult[byResult.length - 1] : null,
    trends: { growing: trends.filter((t) => t.change > 0).slice(0, 8), declining: trends.filter((t) => t.change < 0).reverse().slice(0, 8) },
    debts,
    goal: goal ? { target: goal.target_amount, achieved: report.gross_revenue, pct: Math.round((report.gross_revenue / goal.target_amount) * 1000) / 10 } : null,
    restock,
  };
}

// RASTREIO: tudo o que aconteceu no periodo, por ordem, com o efeito no
// resultado. effect: 'gain' (entra no lucro), 'loss' (sai do lucro), 'info'
// (movimento sem efeito directo no lucro: compra de stock, cheneca, fecho...).
// Vendas trazem os itens e o caixista, para abrir o recibo.
const TIMELINE_TYPES = ['sale', 'cancelled', 'loss', 'stock', 'debt', 'debt_payment', 'shift', 'demand'];

async function timeline(tenantId, start, end, { types = TIMELINE_TYPES, page = 1, pageSize = 50 } = {}) {
  const range = { gte: start, lte: end };
  const want = (t) => types.includes(t);
  const none = Promise.resolve([]);
  const [sales, losses, entries, debts, payments, shifts, demand, suppliers] = await Promise.all([
    want('sale') || want('cancelled')
      ? prisma.sale.findMany({ where: { tenant_id: tenantId, created_at: range, status: { in: [want('sale') && 'completed', want('cancelled') && 'cancelled'].filter(Boolean) } }, include: { items: true, cashier: { select: { id: true, name: true } } } })
      : none,
    want('loss') ? prisma.shrinkageRecord.findMany({ where: { tenant_id: tenantId, recorded_at: range }, include: { product: { select: { name: true, barcode: true, cost_price: true } }, recordedBy: { select: { name: true } } } }) : none,
    want('stock') ? prisma.stockEntry.findMany({ where: { tenant_id: tenantId, created_at: range }, include: { product: { select: { name: true } }, recordedBy: { select: { name: true } } } }) : none,
    want('debt') ? prisma.debt.findMany({ where: { tenant_id: tenantId, created_at: range } }) : none,
    want('debt_payment') ? prisma.debtPayment.findMany({ where: { paid_at: range, debt: { tenant_id: tenantId } }, include: { debt: { select: { debtor_name: true } } } }) : none,
    want('shift') ? prisma.shiftClosing.findMany({ where: { tenant_id: tenantId, closed_at: range }, include: { cashier: { select: { name: true } } } }) : none,
    want('demand') ? prisma.demandCapture.findMany({ where: { tenant_id: tenantId, requested_at: range }, include: { product: { select: { name: true } }, recordedBy: { select: { name: true } } } }) : none,
    want('stock') ? prisma.supplier.findMany({ where: { tenant_id: tenantId }, select: { id: true, name: true } }) : none,
  ]);
  // Validade do lote de onde saiu cada perda.
  const lotIds = losses.map((l) => l.lot_id).filter(Boolean);
  const lots = lotIds.length ? await prisma.stockLot.findMany({ where: { tenant_id: tenantId, id: { in: lotIds } }, select: { id: true, expiry_date: true } }) : [];
  const lotExpiry = new Map(lots.map((l) => [l.id, l.expiry_date]));
  const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));

  const events = [];
  for (const s of sales) {
    const cost = s.items.reduce((sum, it) => sum + it.quantity * it.unit_cost_price, 0);
    const cancelled = s.status === 'cancelled';
    events.push({
      id: 'sale-' + s.id, type: cancelled ? 'cancelled' : 'sale', at: s.created_at,
      effect: cancelled ? 'info' : 'gain', amount: cancelled ? 0 : s.total_amount, profit: cancelled ? 0 : s.total_amount - cost,
      title: (cancelled ? 'Venda cancelada n.º ' : 'Venda n.º ') + String(s.daily_number || '').padStart(3, '0'),
      who: s.cashier?.name || '—',
      detail: s.items.map((it) => `${it.quantity} × ${it.product_name}`).join(', ') + (cancelled && s.cancel_reason ? ` · motivo: ${s.cancel_reason}` : ''),
      discount: s.discount_amount || 0,
      sale: { ...s, cashier: s.cashier },
    });
  }
  for (const l of losses) {
    const unit = l.unit_cost ?? l.product?.cost_price ?? 0;
    const expiry = l.lot_id ? lotExpiry.get(l.lot_id) : null;
    events.push({
      id: 'loss-' + l.id, type: 'loss', at: l.recorded_at, effect: 'loss', amount: -(l.quantity * unit), profit: -(l.quantity * unit),
      title: `Perda: ${l.quantity} × ${l.product?.name || '—'}`,
      who: l.reason === 'expired' ? 'Genesis (automático)' : (l.recordedBy?.name || '—'),
      detail: [SHRINK_REASON[l.reason] || l.reason, l.product?.barcode ? `código ${l.product.barcode}` : null, expiry ? `validade ${dayKey(expiry)}` : null].filter(Boolean).join(' · '),
      unit_cost: unit,
      reason: l.reason, barcode: l.product?.barcode || null, expiry_date: expiry || null,
    });
  }
  for (const e of entries) {
    events.push({
      id: 'stock-' + e.id, type: 'stock', at: e.created_at, effect: 'info', amount: e.quantity * e.unit_cost, profit: 0,
      title: (e.quantity >= 0 ? 'Entrada de stock: ' : 'Ajuste de stock: ') + `${e.quantity > 0 ? '+' : ''}${e.quantity} × ${e.product?.name || '—'}`,
      who: e.recordedBy?.name || '—',
      detail: e.supplier_id ? `fornecedor ${supplierName.get(e.supplier_id) || '—'}` : (e.quantity >= 0 ? 'sem fornecedor' : 'ajuste do dono'),
      unit_cost: e.unit_cost,
    });
  }
  for (const d of debts) events.push({ id: 'debt-' + d.id, type: 'debt', at: d.created_at, effect: 'info', amount: d.total_amount, profit: 0, title: `Cheneca nova: ${d.debtor_name}`, who: '—', detail: `vence a ${dayKey(d.due_date)}` });
  for (const p of payments) events.push({ id: 'pay-' + p.id, type: 'debt_payment', at: p.paid_at, effect: 'info', amount: p.amount, profit: 0, title: `Cheneca paga: ${p.debt?.debtor_name || '—'}`, who: '—', detail: 'pagamento recebido' });
  for (const s of shifts) events.push({ id: 'shift-' + s.id, type: 'shift', at: s.closed_at, effect: 'info', amount: s.difference, profit: 0, title: 'Fecho de turno', who: s.cashier?.name || '—', detail: s.difference === 0 ? 'contagem certa' : 'contagem com diferença', counted: s.counted_amount, expected: s.expected_amount });
  for (const d of demand) events.push({ id: 'demand-' + d.id, type: 'demand', at: d.requested_at, effect: 'info', amount: 0, profit: 0, title: `Cliente pediu: ${d.product?.name || '—'} (em falta)`, who: d.recordedBy?.name || '—', detail: 'oportunidade perdida' });

  events.sort((a, b) => new Date(b.at) - new Date(a.at));
  const totals = {
    gains: events.filter((e) => e.effect === 'gain').reduce((s, e) => s + e.amount, 0),
    losses: events.filter((e) => e.effect === 'loss').reduce((s, e) => s + e.amount, 0),
    profit: events.reduce((s, e) => s + e.profit, 0),
    count: events.length,
  };
  const from = (page - 1) * pageSize;
  return { totals, page, page_size: pageSize, total: events.length, rows: events.slice(from, from + pageSize) };
}

async function totalReport(tenantId) {
  const [agg, first] = await Promise.all([
    prisma.sale.aggregate({ where: { tenant_id: tenantId, status: 'completed' }, _sum: { total_amount: true }, _count: true }),
    prisma.sale.findFirst({ where: { tenant_id: tenantId }, orderBy: { created_at: 'asc' }, select: { created_at: true } }),
  ]);
  return { total_revenue: Number(agg._sum.total_amount || 0), sales_count: agg._count, since: first?.created_at || null };
}

module.exports = { dailyReport, weeklyReport, monthlyReport, totalReport, timeline, goalsHistory, restockFor, dayKey, dayRange };
