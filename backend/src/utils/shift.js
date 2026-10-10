// Turno do caixista e FECHO CEGO — logica unica (Genesis 2.0).
//
// Antes estava duplicada em routes/owner.js (close-shift-blind) e
// routes/shift_closings.js. Agora o terminal (routes/pos.js) e o unico sitio
// onde se fecha um turno, e e o PROPRIO caixista que o fecha.
//
// Regras:
//  - esperado = vendas em DINHEIRO do caixista desde o INICIO do turno (o mais
//    recente entre o ultimo fecho e a ultima abertura); M-Pesa, e-Mola e
//    cartao nao entram na gaveta. O valor esperado NUNCA e devolvido antes de
//    contar; depois de um fecho aceite volta o resumo;
//  - declarar menos do que o esperado = tentativa falhada; 3 falhas desde o
//    ultimo desbloqueio do dono = perfil bloqueado (ver utils/shiftLock.js);
//  - TURNO POR DIA (10/10/2026, utils/shiftDay.js): um fecho por dia de
//    Maputo. Fechado hoje -> so o dono reabre (PIN, registo SHIFT_OPENED na
//    auditoria append-only); dia novo -> abre sozinho. Um turno que passa da
//    meia-noite fecha como turno do dia em que comecou. O cadeado do terminal
//    e uma pausa: nao fecha nem abre o turno.
const prisma = require('./prisma');
const { getShiftLock, MAX_ATTEMPTS } = require('./shiftLock');
const { writeAudit } = require('./audit');
const { httpError } = require('./http');
const { decideShift, shiftDayOf } = require('./shiftDay');

// `db` pode ser a transaccao da venda (routes/sales.js).
async function shiftStatus(db, tenantId, cashierId, now = new Date()) {
  const recentClosings = await db.shiftClosing.findMany({
    where: { tenant_id: tenantId, cashier_user_id: cashierId },
    orderBy: { closed_at: 'desc' },
    take: 5,
  });
  const lastClosing = recentClosings[0] || null;
  const opened = await db.auditLog.findFirst({
    where: { tenant_id: tenantId, action: 'SHIFT_OPENED', entity_id: cashierId, ...(lastClosing ? { created_at: { gt: lastClosing.closed_at } } : {}) },
    orderBy: { created_at: 'desc' },
  });
  const openedAt = opened ? opened.created_at : null;
  const d = decideShift({ recentClosings, openedAt, now });
  return { open: d.open, auto: d.auto, closedToday: d.closedToday, since: d.since, lastClosing, openedAt };
}

async function shiftWindow(tenantId, cashierId) {
  const status = await shiftStatus(prisma, tenantId, cashierId);
  const base = { tenant_id: tenantId, cashier_user_id: cashierId, status: 'completed', ...(status.since ? { created_at: { gt: status.since } } : {}) };
  const byMethod = await prisma.sale.groupBy({ by: ['payment_method'], where: base, _sum: { total_amount: true }, _count: true });
  const totals = Object.fromEntries(byMethod.map((g) => [g.payment_method, Number(g._sum.total_amount || 0)]));
  const openSales = byMethod.reduce((n, g) => n + g._count, 0);
  return { ...status, expectedCash: totals.cash || 0, totals, openSales };
}

// Primeira actividade do turno (entrar no perfil ou vender) — da o dia do turno
// quando nao houve abertura registada.
async function firstActivityAt(tenantId, cashierId, since) {
  const after = since ? { created_at: { gt: since } } : {};
  const [login, sale] = await Promise.all([
    prisma.auditLog.findFirst({ where: { tenant_id: tenantId, action: 'POS_LOGIN', entity_id: cashierId, ...after }, orderBy: { created_at: 'asc' }, select: { created_at: true } }),
    prisma.sale.findFirst({ where: { tenant_id: tenantId, cashier_user_id: cashierId, ...after }, orderBy: { created_at: 'asc' }, select: { created_at: true } }),
  ]);
  const times = [login?.created_at, sale?.created_at].filter(Boolean).sort((a, b) => a - b);
  return times[0] || null;
}

// Estado visivel no POS: nunca inclui o valor esperado.
async function getShiftState(tenantId, cashierId) {
  const [win, lock] = await Promise.all([shiftWindow(tenantId, cashierId), getShiftLock(prisma, tenantId, cashierId)]);
  return {
    open: win.open,
    auto: win.auto,
    closedToday: win.closedToday,
    openedAt: win.openedAt,
    hasOpenSales: win.openSales > 0,
    salesCount: win.openSales,
    attempts: lock.attempts,
    maxAttempts: lock.maxAttempts,
    locked: lock.locked,
    lastClosingAt: win.lastClosing?.closed_at || null,
  };
}

const NON_CASH = ['mpesa', 'emola', 'card', 'mobile_money'];

async function closeShiftBlind({ req, tenantId, cashier, declared }) {
  if (!Number.isInteger(declared) || declared < 0) throw httpError(400, 'Valor inválido', 'INVALID_AMOUNT');
  const lock = await getShiftLock(prisma, tenantId, cashier.id);
  if (lock.locked) throw httpError(423, 'Perfil bloqueado por erros no fecho. O dono tem de desbloquear no painel dele.', 'CASHIER_LOCKED');

  const win = await shiftWindow(tenantId, cashier.id);
  if (!win.open) {
    throw httpError(409, 'O turno de hoje já está fechado. Abre sozinho amanhã; hoje só com o PIN do dono.', 'NO_OPEN_SHIFT');
  }

  const detail = { cashierName: cashier.name, declared, expected: win.expectedCash };
  if (declared < win.expectedCash) {
    const attemptNo = lock.attempts + 1;
    const locked = attemptNo >= MAX_ATTEMPTS;
    await writeAudit({ req, tenantId, action: 'SHIFT_ATTEMPT_FAIL', entityType: 'user', entityId: cashier.id, newValue: { ...detail, attempt: attemptNo } });
    if (locked) await writeAudit({ req, tenantId, action: 'CASHIER_LOCKED', entityType: 'user', entityId: cashier.id, newValue: detail });
    return {
      status: 400,
      body: {
        ok: false, accepted: false, code: locked ? 'CASHIER_LOCKED' : 'COUNT_BELOW_EXPECTED', locked,
        attemptNo, maxAttempts: MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - attemptNo),
        error: locked
          ? 'Valor incorrecto ' + MAX_ATTEMPTS + ' vezes. Perfil bloqueado — o dono tem de o desbloquear.'
          : 'O valor contado é menor do que o dinheiro que devia estar na gaveta. Conte de novo. Restam ' + (MAX_ATTEMPTS - attemptNo) + ' tentativa(s).',
      },
    };
  }

  const shiftDay = shiftDayOf({ openedAt: win.openedAt, firstActivityAt: win.openedAt ? null : await firstActivityAt(tenantId, cashier.id, win.since) });
  const difference = declared - win.expectedCash;
  const record = await prisma.shiftClosing.create({
    data: { tenant_id: tenantId, cashier_user_id: cashier.id, counted_amount: declared, expected_amount: win.expectedCash, difference, shift_day: shiftDay },
  });
  await writeAudit({ req, tenantId, action: 'SHIFT_CLOSING_OK', entityType: 'shift_closing', entityId: record.id, newValue: { ...detail, difference, shift_day: shiftDay } });
  // Depois de aceite (ja nao e cego): a conta do turno. Turno de ontem fechado
  // de madrugada -> o de hoje ja pode comecar.
  const after = await shiftStatus(prisma, tenantId, cashier.id);
  return {
    status: 201,
    body: {
      ok: true, accepted: true, exact: difference === 0, difference, closed_at: record.closed_at,
      shift_day: shiftDay, open_again: after.open,
      summary: {
        expected_cash: win.expectedCash, counted: declared, difference,
        other: Object.fromEntries(NON_CASH.filter((m) => win.totals[m]).map((m) => [m, win.totals[m]])),
      },
      message: difference === 0 ? 'Turno fechado. Valor certo.' : 'Turno fechado. O valor a mais ficou registado para o dono.',
    },
  };
}

module.exports = { getShiftState, closeShiftBlind, shiftStatus };
