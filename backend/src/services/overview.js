// Visao geral do dono (Fase 13, pedido do fundador 25/10/2026): "uma visao
// rapida e curta do que importa" — quanto temos hoje, como vai a meta, quem
// esta a trabalhar e as ultimas vendas. Tudo num pedido, sem repetir o que
// ja vive noutras paginas (stock, chenecas e alertas estao no sino e nas suas
// paginas). Dia = dia de Maputo (o servidor corre com TZ=Africa/Maputo).
//
// Estado do turno de cada caixista (cores decididas pelo fundador):
//   working     -> verde    (abriu o turno hoje: entrou no perfil ou vendeu)
//   closed      -> cinzento (ja fechou o turno de hoje)
//   not_started -> laranja  (ainda nao abriu hoje)
//   locked      -> vermelho (problema: 3 contagens erradas no fecho)
//   short       -> vermelho (problema: fechou hoje com dinheiro a menos)
const prisma = require('../utils/prisma');
const { shiftStatus, firstActivityAt } = require('../utils/shift');
const { getShiftLock } = require('../utils/shiftLock');
const { dayInMaputo } = require('../utils/fefo');

const pctChange = (now, before) => (before ? Math.round(((now - before) / Math.abs(before)) * 1000) / 10 : null);
const saleProfit = (s) => s.total_amount - s.items.reduce((sum, it) => sum + it.quantity * it.unit_cost_price, 0);

// Estado puro (testado em tests/overview.test.js).
function cashierState({ locked, open, activityToday, lastClosing, today }) {
  if (locked) return 'locked';
  if (!open) {
    return lastClosing && lastClosing.difference < 0 && (lastClosing.shift_day || dayInMaputo(lastClosing.closed_at)) === today ? 'short' : 'closed';
  }
  return activityToday ? 'working' : 'not_started';
}

async function ownerOverview(tenantId, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const yStart = new Date(start.getTime() - 86400000);
  const yNow = new Date(now.getTime() - 86400000);
  const today = dayInMaputo(now);
  const done = { tenant_id: tenantId, status: 'completed' };

  // Menos pedidos a BD: o total do mes e as vendas de cada caixista saem das listas ja lidas.
  const [todaySales, yesterday, monthSales, goal, recent, cashiers] = await Promise.all([
    prisma.sale.findMany({ where: { ...done, created_at: { gte: start, lte: now } }, select: { total_amount: true, created_at: true, cashier_user_id: true, items: { select: { quantity: true, unit_cost_price: true } } } }),
    // Ontem ATE A MESMA HORA: comparar o dia inteiro de ontem com meio dia de hoje enganava.
    prisma.sale.aggregate({ where: { ...done, created_at: { gte: yStart, lte: yNow } }, _sum: { total_amount: true }, _count: true }),
    prisma.sale.findMany({ where: { ...done, created_at: { gte: monthStart, lte: now } }, select: { total_amount: true, created_at: true } }),
    prisma.saleGoal.findFirst({ where: { tenant_id: tenantId, month: now.getMonth() + 1, year: now.getFullYear() }, orderBy: { created_at: 'desc' } }),
    prisma.sale.findMany({ where: { tenant_id: tenantId }, orderBy: { created_at: 'desc' }, take: 5, select: { id: true, created_at: true, total_amount: true, payment_method: true, status: true, daily_number: true, cashier: { select: { name: true } } } }),
    prisma.user.findMany({ where: { tenant_id: tenantId, role: 'cashier', is_active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  const revenue = todaySales.reduce((s, x) => s + x.total_amount, 0);
  const grossProfit = todaySales.reduce((s, x) => s + saleProfit(x), 0);
  const byHour = Array.from({ length: now.getHours() + 1 }, (_, h) => ({ hour: h, revenue: 0 }));
  for (const s of todaySales) byHour[new Date(s.created_at).getHours()].revenue += s.total_amount;

  // Meta: acumulado dia a dia ate hoje + projeccao linear pelo ritmo (especificacao 6.8).
  const monthRevenue = monthSales.reduce((s, x) => s + x.total_amount, 0);
  const byDay = Array.from({ length: now.getDate() }, (_, i) => ({ day: i + 1, revenue: 0, accumulated: 0 }));
  for (const s of monthSales) byDay[new Date(s.created_at).getDate() - 1].revenue += s.total_amount;
  byDay.reduce((acc, d) => { d.accumulated = acc + d.revenue; return d.accumulated; }, 0);
  const target = goal?.target_amount || 0;
  const pace = monthRevenue / now.getDate();
  const reachDay = target > 0 && pace > 0 ? Math.ceil(target / pace) : null;

  const team = await Promise.all(cashiers.map(async (c) => {
    const [status, lock] = await Promise.all([shiftStatus(prisma, tenantId, c.id, now), getShiftLock(prisma, tenantId, c.id)]);
    const mine = todaySales.filter((x) => x.cashier_user_id === c.id);
    const since = status.since && new Date(status.since) > start ? new Date(status.since) : new Date(start.getTime() - 1);
    const first = await firstActivityAt(tenantId, c.id, since);
    return {
      id: c.id, name: c.name,
      state: cashierState({ locked: lock.locked, open: status.open, activityToday: Boolean(first), lastClosing: status.lastClosing, today }),
      since: first,
      today_sales: mine.length,
      today_revenue: mine.reduce((sum, x) => sum + x.total_amount, 0),
      last_closing_difference: status.lastClosing && (status.lastClosing.shift_day || dayInMaputo(status.lastClosing.closed_at)) === today ? status.lastClosing.difference : null,
    };
  }));

  return {
    date: today,
    generated_at: now.toISOString(),
    today: {
      revenue, sales_count: todaySales.length, gross_profit: grossProfit,
      average_ticket: todaySales.length ? Math.round(revenue / todaySales.length) : 0,
      yesterday_same_time: Number(yesterday._sum.total_amount || 0),
      change_pct: pctChange(revenue, Number(yesterday._sum.total_amount || 0)),
      by_hour: byHour,
    },
    month: {
      revenue: monthRevenue, sales_count: monthSales.length, has_goal: Boolean(goal), target,
      pct: target > 0 ? Math.round((monthRevenue / target) * 1000) / 10 : 0,
      remaining: target > 0 ? Math.max(0, target - monthRevenue) : 0,
      projected: Math.round(pace * daysInMonth),
      reach_day: reachDay && reachDay <= daysInMonth ? reachDay : null,
      days_in_month: daysInMonth,
      by_day: byDay,
    },
    cashiers: team,
    recent_sales: recent.map((s) => ({ id: s.id, created_at: s.created_at, total_amount: s.total_amount, payment_method: s.payment_method, status: s.status, daily_number: s.daily_number, cashier: s.cashier?.name || null })),
  };
}

module.exports = { ownerOverview, cashierState };
