// Fase 10.1: notificacoes do sino do dono (Prompt Mestre 4.3, 6.4, 7.1;
// especificacao 6.2, 6.4, 6.5, 6.8). Calculadas na leitura, sem tabela nem
// «lido»: cada uma existe enquanto a situacao existe (repor o stock, receber a
// cheneca ou desbloquear o caixista tira-a do sino).
const prisma = require('../utils/prisma');
const { getTenantAlertSnapshot } = require('./tenantAlerts');
const { getShiftLock } = require('../utils/shiftLock');
const { dayInMaputo } = require('../utils/fefo');

const LEVELS = ['critical', 'warning', 'info', 'success'];
const TYPES = ['cashier_locked', 'debt_due', 'stock_low', 'lot_expiring', 'shift_difference', 'goal_reached', 'day_closed'];
const DEBT_DAYS = 7; // chenecas: 7 dias antes, 1 dia antes e no dia (especificacao 6.5)
const SHIFT_DAYS = 7; // diferencas de caixa dos ultimos 7 dias

// Niveis do stock da especificacao 6.4: critica <= 10, severa <= 20, normal acima.
const stockLevel = (qty) => (qty <= 10 ? 'critical' : qty <= 20 ? 'severe' : 'low');
const daysBetween = (fromDay, toDay) => Math.round((Date.parse(toDay) - Date.parse(fromDay)) / 86400000);
const minutesOf = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };

// Puro (testado em tests/notifications.test.js). Datas e horas pelo calendario
// de Maputo; dinheiro em centavos. O texto e montado no ecra (lingua de quem ve).
function buildNotifications({
  now = new Date(), lowStock = [], expiringLots = [], debts = [], closings = [],
  lockedCashiers = [], goal = null, todaySales = null, closingTime = '20:00',
}) {
  const today = dayInMaputo(now);
  const items = [];

  for (const c of lockedCashiers) {
    items.push({ id: `cashier_locked:${c.id}`, type: 'cashier_locked', level: 'critical', link: '/app/equipa', params: { cashier: c.name } });
  }

  for (const d of debts) {
    const remaining = d.total_amount - d.amount_paid;
    if (remaining <= 0) continue;
    const daysLeft = daysBetween(today, dayInMaputo(d.due_date));
    if (daysLeft > DEBT_DAYS) continue;
    const level = daysLeft <= 0 ? 'critical' : daysLeft === 1 ? 'warning' : 'info';
    items.push({ id: `debt_due:${d.id}`, type: 'debt_due', level, link: '/app/chenecas', params: { debtor: d.debtor_name, remaining, days_left: daysLeft } });
  }

  for (const p of lowStock) {
    const stock = stockLevel(p.stock_qty);
    const level = stock === 'critical' ? 'critical' : stock === 'severe' ? 'warning' : 'info';
    items.push({ id: `stock_low:${p.id}`, type: 'stock_low', level, link: '/app/produtos?tab=stock', params: { name: p.name, qty: p.stock_qty, min: p.min_stock, stock_level: stock } });
  }

  for (const l of expiringLots) {
    const level = l.days_left <= 0 ? 'critical' : l.days_left <= 2 ? 'warning' : 'info';
    items.push({ id: `lot_expiring:${l.lot_id}`, type: 'lot_expiring', level, link: '/app/produtos?tab=stock', params: { name: l.name, quantity: l.quantity, days_left: l.days_left } });
  }

  for (const s of closings) {
    if (!s.difference) continue;
    const day = s.shift_day || dayInMaputo(s.closed_at);
    if (daysBetween(day, today) >= SHIFT_DAYS) continue;
    items.push({
      id: `shift_difference:${s.id}`, type: 'shift_difference', level: s.difference < 0 ? 'warning' : 'info',
      link: `/app/relatorios?tab=daily&date=${day}`, params: { cashier: s.cashier_name, difference: s.difference, day },
    });
  }

  if (goal && goal.target > 0 && goal.current >= goal.target) {
    items.push({ id: `goal_reached:${goal.year}-${goal.month}`, type: 'goal_reached', level: 'success', link: '/app', params: { target: goal.target, current: goal.current, month: goal.month, year: goal.year } });
  }

  // Fecho do dia: a partir da hora de fecho da loja, se houve vendas hoje.
  const nowMinutes = minutesOf(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Maputo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now));
  if (todaySales && todaySales.count > 0 && nowMinutes >= minutesOf(closingTime || '20:00')) {
    items.push({ id: `day_closed:${today}`, type: 'day_closed', level: 'info', link: `/app/relatorios?tab=daily&date=${today}`, params: { sales: todaySales.count, revenue: todaySales.revenue, day: today } });
  }

  return items.sort((a, b) => (LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level)) || (TYPES.indexOf(a.type) - TYPES.indexOf(b.type)));
}

// Junta os dados da loja (filtro por tenant_id em todas as leituras; a RLS e a
// segunda linha de defesa).
async function loadOwnerNotifications(tenantId, now = new Date()) {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const [snapshot, tenant, debts, closings, cashiers, goalRow, monthAgg, todayAgg] = await Promise.all([
    getTenantAlertSnapshot(tenantId, now),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { closing_time: true } }),
    prisma.debt.findMany({ where: { tenant_id: tenantId, status: { not: 'paid' }, due_date: { lte: new Date(now.getTime() + (DEBT_DAYS + 1) * 86400000) } } }),
    prisma.shiftClosing.findMany({
      where: { tenant_id: tenantId, closed_at: { gte: new Date(now.getTime() - (SHIFT_DAYS + 1) * 86400000) }, NOT: { difference: 0 } },
      include: { cashier: { select: { name: true } } }, orderBy: { closed_at: 'desc' },
    }),
    prisma.user.findMany({ where: { tenant_id: tenantId, role: 'cashier', is_active: true }, select: { id: true, name: true } }),
    prisma.saleGoal.findFirst({ where: { tenant_id: tenantId, month, year }, orderBy: { created_at: 'desc' } }),
    prisma.sale.aggregate({ where: { tenant_id: tenantId, status: 'completed', created_at: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59, 999) } }, _sum: { total_amount: true } }),
    prisma.sale.aggregate({ where: { tenant_id: tenantId, status: 'completed', created_at: { gte: dayStart, lte: now } }, _sum: { total_amount: true }, _count: true }),
  ]);
  const locks = await Promise.all(cashiers.map((c) => getShiftLock(prisma, tenantId, c.id)));
  return buildNotifications({
    now,
    lowStock: snapshot.lowStockProducts,
    expiringLots: snapshot.expiringLots,
    debts,
    closings: closings.map((s) => ({ ...s, cashier_name: s.cashier?.name || '—' })),
    lockedCashiers: cashiers.filter((_, i) => locks[i].locked),
    goal: goalRow ? { target: goalRow.target_amount, current: Number(monthAgg._sum.total_amount || 0), month, year } : null,
    todaySales: { count: todayAgg._count, revenue: Number(todayAgg._sum.total_amount || 0) },
    closingTime: tenant?.closing_time || '20:00',
  });
}

module.exports = { buildNotifications, loadOwnerNotifications, stockLevel, LEVELS, TYPES };
