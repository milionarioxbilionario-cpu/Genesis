// Bloqueio de perfil por erros repetidos no FECHO CEGO de turno.
//
// Regra (nao negociavel): 3 falhas DEPOIS do ultimo desbloqueio do dono
// => perfil bloqueado. A auditoria NUNCA e apagada: a contagem reinicia
// a partir do registo CASHIER_UNLOCKED mais recente.
//
// Usado por:
//  - routes/owner.js  (GET /cashiers -> badge BLOQUEADO no Hub;
//                      shift-state; close-shift-blind)
//  - routes/sales.js  (impede VENDER enquanto o perfil esta bloqueado)
const MAX_ATTEMPTS = 3;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getShiftLock(db, tenantId, cashierId) {
  const dayStart = startOfToday();
  const lastUnlock = await db.auditLog.findFirst({
    where: { tenant_id: tenantId, action: 'CASHIER_UNLOCKED', entity_id: cashierId },
    orderBy: { created_at: 'desc' },
  });
  const since = lastUnlock ? lastUnlock.created_at : dayStart;
  const attempts = await db.auditLog.count({
    where: {
      tenant_id: tenantId,
      action: 'SHIFT_ATTEMPT_FAIL',
      entity_id: cashierId,
      created_at: { gt: since },
    },
  });
  return { attempts, maxAttempts: MAX_ATTEMPTS, locked: attempts >= MAX_ATTEMPTS };
}

module.exports = { getShiftLock, MAX_ATTEMPTS };
