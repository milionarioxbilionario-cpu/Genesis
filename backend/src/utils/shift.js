// Turno do caixista e FECHO CEGO — logica unica (Genesis 2.0).
//
// Antes estava duplicada em routes/owner.js (close-shift-blind) e
// routes/shift_closings.js. Agora o terminal (routes/pos.js) e o unico sitio
// onde se fecha um turno, e e o PROPRIO caixista que o fecha.
//
// Regras (inalteradas):
//  - esperado = vendas em DINHEIRO do caixista desde o ultimo fecho (ou desde
//    o inicio do dia); o valor esperado NUNCA e devolvido antes de contar;
//  - declarar menos do que o esperado = tentativa falhada; 3 falhas desde o
//    ultimo desbloqueio do dono = perfil bloqueado (ver utils/shiftLock.js);
//  - sem vendas desde o ultimo fecho nao ha turno aberto.
const prisma = require('./prisma');
const { getShiftLock, MAX_ATTEMPTS } = require('./shiftLock');
const { writeAudit } = require('./audit');
const { httpError } = require('./http');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function shiftWindow(tenantId, cashierId) {
  const lastClosing = await prisma.shiftClosing.findFirst({
    where: { tenant_id: tenantId, cashier_user_id: cashierId },
    orderBy: { closed_at: 'desc' },
  });
  const since = lastClosing ? lastClosing.closed_at : startOfToday();
  const base = { tenant_id: tenantId, cashier_user_id: cashierId, status: 'completed', created_at: { gt: since } };
  const [cashAgg, openSales] = await Promise.all([
    prisma.sale.aggregate({ where: { ...base, payment_method: 'cash' }, _sum: { total_amount: true } }),
    prisma.sale.count({ where: base }),
  ]);
  return { lastClosing, since, expectedCash: Number(cashAgg._sum.total_amount || 0), openSales };
}

// Estado visivel no POS: nunca inclui o valor esperado.
async function getShiftState(tenantId, cashierId) {
  const [win, lock] = await Promise.all([shiftWindow(tenantId, cashierId), getShiftLock(prisma, tenantId, cashierId)]);
  return {
    hasOpenSales: win.openSales > 0,
    salesCount: win.openSales,
    attempts: lock.attempts,
    maxAttempts: lock.maxAttempts,
    locked: lock.locked,
    lastClosingAt: win.lastClosing?.closed_at || null,
  };
}

async function closeShiftBlind({ req, tenantId, cashier, declared }) {
  if (!Number.isInteger(declared) || declared < 0) throw httpError(400, 'Valor inválido', 'INVALID_AMOUNT');
  const lock = await getShiftLock(prisma, tenantId, cashier.id);
  if (lock.locked) throw httpError(423, 'Perfil bloqueado por erros no fecho. O dono tem de desbloquear no painel dele.', 'CASHIER_LOCKED');

  const win = await shiftWindow(tenantId, cashier.id);
  if (win.lastClosing && win.openSales === 0) {
    throw httpError(409, 'Este turno já está fechado. Não há vendas desde o último fecho.', 'NO_OPEN_SHIFT');
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

  const difference = declared - win.expectedCash;
  const record = await prisma.shiftClosing.create({
    data: { tenant_id: tenantId, cashier_user_id: cashier.id, counted_amount: declared, expected_amount: win.expectedCash, difference },
  });
  await writeAudit({ req, tenantId, action: 'SHIFT_CLOSING_OK', entityType: 'shift_closing', entityId: record.id, newValue: { ...detail, difference } });
  return {
    status: 201,
    body: {
      ok: true, accepted: true, exact: difference === 0, difference, closed_at: record.closed_at,
      message: difference === 0 ? 'Turno fechado. Valor certo.' : 'Turno fechado. O valor a mais ficou registado para o dono.',
    },
  };
}

module.exports = { getShiftState, closeShiftBlind, startOfToday };
