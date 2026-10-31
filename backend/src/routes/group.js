// E2 (31/10/2026): PAINEL GERAL do dono com varios estabelecimentos.
//   GET /api/group/overview   hoje, 7 dias e mes de cada um e de todos (com comparacoes)
//   GET /api/group/recent     ultimas vendas de todos: estabelecimento, terminal, perfil, o que se vendeu
//   GET /api/group/timeline   rastreio de todos juntos (por pagina), com o estabelecimento
//   GET /api/group/stock      a acabar e a expirar em todos, somado pelo mesmo produto
//   GET /api/group/reports    diario, semanal ou mensal de todos e de cada um
//   GET /api/group/live       canal ao vivo dos estabelecimentos deste dono
// Seguranca: a lista de estabelecimentos vem de ownerTenantIds (Membership, cliente
// de sistema) e CADA numero e lido dentro do estabelecimento respectivo
// (prisma.runWithTenant: filtro tenant_id + RLS). As somas fazem-se aqui, na
// memoria do servidor; nunca ha uma consulta que atravesse estabelecimentos.
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { ownerTenantIds } = require('../utils/actingTenant');
const { attachPeople } = require('../utils/peopleNames');
const { openStream } = require('../utils/liveBus');
const H = require('../utils/hours');
const { scheduleOf } = require('../utils/tenantHours');
const { ownerOverview } = require('../services/overview');
const { dailyReport, weeklyReport, monthlyReport, timeline, tenantDayRange } = require('../services/reports');
const { getTenantAlertSnapshot } = require('../services/tenantAlerts');

const router = express.Router();
router.use(auth, requireRole('owner'));
router.use((req, res, next) => (req.user.scope ? next(httpError(403, 'Não disponível nesta sessão.', 'SCOPE_RESTRICTED')) : next()));

const DAY_MS = 86400000;
const HIDDEN = new Set(['deleted', 'rejected']);
const pctChange = (now, before) => (before ? Math.round(((now - before) / Math.abs(before)) * 1000) / 10 : null);

// Os estabelecimentos deste dono (o de casa primeiro), sem os apagados.
async function groupOf(req) {
  const user = await prisma.system.user.findUnique({ where: { id: req.user.userId }, select: { id: true, tenant_id: true } });
  const ids = await ownerTenantIds(user);
  const rows = await prisma.system.tenant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, business_type: true, location: true, status: true, closed_at: true, lat: true, lng: true } });
  const byId = new Map(rows.map((t) => [t.id, t]));
  const list = ids.map((id) => byId.get(id)).filter((t) => t && !HIDDEN.has(t.status))
    .map((t) => ({ ...t, is_home: t.id === user.tenant_id, is_current: t.id === req.user.tenantId }));
  return { user, list, names: new Map(list.map((t) => [t.id, t.name])) };
}

// Corre fn(id) dentro de cada estabelecimento, poucos de cada vez (a BD agradece).
async function eachIn(list, fn, limit = 3) {
  const out = new Array(list.length);
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const i = next++;
      out[i] = await prisma.runWithTenant(list[i].id, () => fn(list[i]));
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}

const sumSales = async (id, from, to) => {
  const a = await prisma.sale.aggregate({ where: { tenant_id: id, status: 'completed', created_at: { gte: from, lte: to } }, _sum: { total_amount: true, total_cost: true }, _count: true });
  const revenue = Number(a._sum.total_amount || 0);
  return { revenue, count: a._count, profit: revenue - Number(a._sum.total_cost || 0) };
};

// ?light=1 (o hub): so hoje e o mes, sem 7 dias nem lucro liquido (mais rapido).
const EMPTY = { revenue: 0, count: 0, profit: 0, previous_revenue: 0, change_pct: null };
router.get('/overview', asyncHandler(async (req, res) => {
  const { list } = await groupOf(req);
  const now = new Date();
  const light = req.query.light === '1';
  const rows = await eachIn(list, async (t) => {
    // «Hoje» e «mes» exactamente como no Inicio de cada estabelecimento (services/overview.js).
    const [o, sched] = await Promise.all([ownerOverview(t.id, now), scheduleOf(t.id)]);
    const base = {
      id: t.id, name: t.name, business_type: t.business_type, location: t.location, status: t.status,
      closed: Boolean(t.closed_at), is_home: t.is_home, is_current: t.is_current, lat: t.lat, lng: t.lng,
      open_now: !t.closed_at && H.isOpenAt(sched, now),
      today: { revenue: o.today.revenue, count: o.today.sales_count, profit: o.today.gross_profit, previous_revenue: o.today.yesterday_same_time, change_pct: o.today.change_pct },
    };
    if (light) return { ...base, week: EMPTY, month: { ...EMPTY, revenue: o.month.revenue, count: o.month.sales_count, net_profit: null } };
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(dayStart.getTime() - 6 * DAY_MS);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthSameTime = new Date(Math.min(prevMonthStart.getTime() + (now - monthStart), monthStart.getTime() - 1));
    const [week, prevWeek, monthAgg, prevMonth] = await Promise.all([
      sumSales(t.id, weekStart, now),
      sumSales(t.id, new Date(weekStart.getTime() - 7 * DAY_MS), new Date(weekStart.getTime() - 1)),
      sumSales(t.id, monthStart, now),
      sumSales(t.id, prevMonthStart, prevMonthSameTime),
    ]);
    let netProfit = null;
    try { netProfit = (await monthlyReport(t.id, now.getFullYear(), now.getMonth() + 1)).net_profit; } catch { netProfit = null; }
    return {
      ...base,
      week: { ...week, previous_revenue: prevWeek.revenue, change_pct: pctChange(week.revenue, prevWeek.revenue) },
      month: { revenue: o.month.revenue, count: o.month.sales_count, profit: monthAgg.profit, net_profit: netProfit, previous_revenue: prevMonth.revenue, change_pct: pctChange(o.month.revenue, prevMonth.revenue) },
    };
  });
  const add = (k) => {
    const s = rows.reduce((acc, r) => ({ revenue: acc.revenue + r[k].revenue, count: acc.count + r[k].count, profit: acc.profit + r[k].profit, previous_revenue: acc.previous_revenue + (r[k].previous_revenue || 0) }), { revenue: 0, count: 0, profit: 0, previous_revenue: 0 });
    return { ...s, change_pct: pctChange(s.revenue, s.previous_revenue) };
  };
  const month = add('month');
  month.net_profit = rows.every((r) => r.month.net_profit != null) ? rows.reduce((s, r) => s + r.month.net_profit, 0) : null;
  res.json({ generated_at: now.toISOString(), establishments: rows, totals: { today: add('today'), week: add('week'), month } });
}));

// Ultimas vendas de todos (o que se vendeu, quem, em que terminal).
router.get('/recent', asyncHandler(async (req, res) => {
  const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }).parse(req.query);
  const { list } = await groupOf(req);
  const parts = await eachIn(list, async (t) => {
    const [sales, terminals] = await Promise.all([
      prisma.sale.findMany({ where: { tenant_id: t.id }, orderBy: { created_at: 'desc' }, take: limit, select: { id: true, created_at: true, total_amount: true, total_cost: true, status: true, daily_number: true, payment_method: true, cashier_user_id: true, terminal_id: true, items: { select: { product_name: true, quantity: true, unit: true } } } }),
      prisma.posTerminal.findMany({ where: { tenant_id: t.id }, select: { id: true, name: true } }),
    ]);
    await attachPeople(t.id, sales, [['cashier', 'cashier_user_id']]);
    const tName = new Map(terminals.map((x) => [x.id, x.name]));
    return sales.map((s) => ({
      id: s.id, tenant_id: t.id, establishment: t.name, created_at: s.created_at, total_amount: s.total_amount,
      profit: s.status === 'completed' ? s.total_amount - s.total_cost : 0, status: s.status, daily_number: s.daily_number,
      payment_method: s.payment_method, cashier: s.cashier?.name || null, terminal: s.terminal_id ? tName.get(s.terminal_id) || null : null, items: s.items,
    }));
  });
  res.json(parts.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit));
}));

// Rastreio geral: o de cada estabelecimento (services/reports.js timeline), juntos por ordem.
router.get('/timeline', asyncHandler(async (req, res) => {
  const q = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    types: z.string().optional(), tenant_id: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).max(200).default(1), page_size: z.coerce.number().int().min(1).max(100).default(50),
  }).parse(req.query);
  const { list } = await groupOf(req);
  const chosen = q.tenant_id ? list.filter((t) => t.id === q.tenant_id) : list;
  if (q.tenant_id && !chosen.length) throw httpError(404, 'Estabelecimento não encontrado', 'ESTABLISHMENT_NOT_FOUND');
  const types = q.types ? q.types.split(',').filter(Boolean) : undefined;
  const need = q.page * q.page_size; // os primeiros N de todos estao nos primeiros N de cada um
  const parts = await eachIn(chosen, async (t) => {
    const start = (await tenantDayRange(t.id, q.from)).start;
    const end = (await tenantDayRange(t.id, q.to)).end;
    if (end < start) throw httpError(400, 'Intervalo de datas inválido', 'BAD_RANGE');
    if (end - start > 92 * DAY_MS) throw httpError(400, 'Máximo de 3 meses por rastreio', 'RANGE_TOO_LARGE');
    const r = await timeline(t.id, start, end, { ...(types ? { types } : {}), page: 1, pageSize: need });
    return { totals: r.totals, total: r.total, rows: r.rows.map((e) => ({ ...e, tenant_id: t.id, establishment: t.name })) };
  });
  const rows = parts.flatMap((p) => p.rows).sort((a, b) => new Date(b.at) - new Date(a.at));
  const totals = parts.reduce((acc, p) => ({ gains: acc.gains + p.totals.gains, losses: acc.losses + p.totals.losses, profit: acc.profit + p.totals.profit, count: acc.count + p.totals.count }), { gains: 0, losses: 0, profit: 0, count: 0 });
  const from = (q.page - 1) * q.page_size;
  res.json({ totals, page: q.page, page_size: q.page_size, total: parts.reduce((s, p) => s + p.total, 0), rows: rows.slice(from, from + q.page_size) });
}));

// Stock geral: o mesmo produto (codigo de barras, ou o nome) em todos os estabelecimentos.
const productKey = (p) => (p.barcode ? 'b:' + String(p.barcode).trim() : 'n:' + String(p.name || '').trim().toLowerCase().replace(/\s+/g, ' '));
router.get('/stock', asyncHandler(async (req, res) => {
  const { list } = await groupOf(req);
  const parts = await eachIn(list, async (t) => {
    const [products, snap] = await Promise.all([
      prisma.product.findMany({ where: { tenant_id: t.id, is_active: true }, select: { id: true, name: true, barcode: true, stock_qty: true, min_stock: true, unit: true } }),
      getTenantAlertSnapshot(t.id),
    ]);
    return { t, products, expiring: snap.expiringLots };
  });
  const groups = new Map();
  for (const { t, products } of parts) {
    for (const p of products) {
      const k = productKey(p);
      const g = groups.get(k) || { key: k, name: p.name, barcode: p.barcode || null, unit: p.unit || 'un', total: 0, low: false, per: [] };
      g.total += p.stock_qty || 0;
      const low = (p.stock_qty || 0) <= (p.min_stock || 0);
      g.low = g.low || low;
      g.per.push({ tenant_id: t.id, establishment: t.name, product_id: p.id, qty: p.stock_qty || 0, min: p.min_stock || 0, low });
      groups.set(k, g);
    }
  }
  // Cada estabelecimento aparece em cada produto (0 onde nao existe), para se ver «12 em A, 0 em B».
  const low = [...groups.values()].filter((g) => g.low).map((g) => ({
    ...g,
    per: list.map((t) => g.per.find((x) => x.tenant_id === t.id) || { tenant_id: t.id, establishment: t.name, product_id: null, qty: 0, min: 0, low: false, missing: true }),
  })).sort((a, b) => a.total - b.total || a.name.localeCompare(b.name));
  const expiring = parts.flatMap(({ t, expiring: lots }) => lots.map((l) => ({ lot_id: l.lot_id, tenant_id: t.id, establishment: t.name, name: l.name, barcode: l.barcode, quantity: l.quantity, unit: l.unit, days_left: l.days_left, expiry_date: l.expiry_date })))
    .sort((a, b) => a.days_left - b.days_left);
  res.json({ establishments: list.map((t) => ({ id: t.id, name: t.name })), low, expiring });
}));

// Relatorios de todos: os numeros de cada um (como no relatorio dele) e a soma.
const REPORT_SUMS = ['gross_revenue', 'sales_count', 'cost_of_goods', 'gross_profit', 'discounts_total', 'losses_total', 'cancelled_total'];
router.get('/reports', asyncHandler(async (req, res) => {
  const q = z.object({
    period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(), month: z.coerce.number().int().min(1).max(12).optional(),
  }).parse(req.query);
  const { list } = await groupOf(req);
  const now = new Date();
  const rows = await eachIn(list, async (t) => {
    const r = q.period === 'daily' ? await dailyReport(t.id, q.date)
      : q.period === 'weekly' ? await weeklyReport(t.id, q.start, q.end)
        : await monthlyReport(t.id, q.year || now.getFullYear(), q.month || now.getMonth() + 1);
    const row = { id: t.id, name: t.name, previous_revenue: r.compare?.previous_revenue ?? null, revenue_change_pct: r.compare?.revenue_change_pct ?? null, by_payment: r.by_payment || {}, top_products: (r.top_products || []).flat ? (r.top_products || []).flat().slice(0, 5) : [] };
    for (const k of REPORT_SUMS) row[k] = Number(r[k] || 0);
    if (q.period === 'monthly') { row.net_profit = r.net_profit; row.deductions_total = r.deductions?.total ?? null; }
    return row;
  }, 2);
  const totals = {};
  for (const k of REPORT_SUMS) totals[k] = rows.reduce((s, r) => s + r[k], 0);
  totals.previous_revenue = rows.reduce((s, r) => s + (r.previous_revenue || 0), 0);
  totals.revenue_change_pct = pctChange(totals.gross_revenue, totals.previous_revenue);
  totals.average_ticket = totals.sales_count ? Math.round(totals.gross_revenue / totals.sales_count) : 0;
  totals.by_payment = {};
  for (const r of rows) for (const [m, v] of Object.entries(r.by_payment)) totals.by_payment[m] = (totals.by_payment[m] || 0) + (typeof v === 'number' ? v : Number(v?.amount || v?.total || 0));
  if (q.period === 'monthly') {
    totals.net_profit = rows.every((r) => r.net_profit != null) ? rows.reduce((s, r) => s + r.net_profit, 0) : null;
    totals.deductions_total = rows.every((r) => r.deductions_total != null) ? rows.reduce((s, r) => s + r.deductions_total, 0) : null;
  }
  res.json({ period: q.period, establishments: rows, totals });
}));

// Ao vivo: so os estabelecimentos deste dono (lista fixada ao abrir; o ecra volta
// a ligar-se de 5 em 5 s se cair, e ai le a lista outra vez).
const GROUP_LIVE = new Set(['sale', 'cancel', 'loss', 'debt', 'debt_payment', 'expense', 'stock_in', 'shift_open', 'shift_close', 'shift_fail']);
router.get('/live', asyncHandler(async (req, res) => {
  const { names } = await groupOf(req);
  openStream(req, res, {
    filter: (e) => names.has(e.tenant_id) && GROUP_LIVE.has(e.type),
    shape: (e) => ({
      type: e.type, tenant_id: e.tenant_id, establishment: names.get(e.tenant_id), sale_id: e.sale_id || null, daily_number: e.daily_number ?? null,
      total: e.total ?? null, profit: e.profit ?? null, payment_method: e.payment_method || null,
      name: e.name || e.product_name || e.cashier_name || e.label || null, at: e.at,
    }),
  });
}));

module.exports = router;
