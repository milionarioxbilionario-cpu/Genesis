// PIN de AUTORIZACAO do dono (Tenant.cancel_pin_hash) usado no terminal para
// accoes que o caixista nao faz sozinho: abrir um turno novo depois de fechado
// e ver a lista de vendas (06/10/2026). Cancelamentos e descontos (sales.js)
// partilham o MESMO orcamento de falhas: 5 PINs errados na loja em 15 min
// bloqueiam todas estas accoes.
//
// A falha e gravada FORA de qualquer transaccao (tem de sobreviver ao erro).
const bcrypt = require('bcrypt');
const prisma = require('./prisma');
const { writeAudit } = require('./audit');
const { httpError } = require('./http');

const AUTH_PIN_FAIL_ACTIONS = ['CANCEL_ATTEMPT', 'DISCOUNT_PIN_FAIL', 'SHIFT_OPEN_PIN_FAIL', 'SALES_VIEW_PIN_FAIL'];
const AUTH_PIN_MAX_PER_TENANT = 5;
const AUTH_PIN_WINDOW_MS = 15 * 60 * 1000;

async function checkAuthorizationPin({ req, tenantId, pin, failAction, entityType, entityId = null }) {
  const recentFails = await prisma.auditLog.count({
    where: { tenant_id: tenantId, action: { in: AUTH_PIN_FAIL_ACTIONS }, created_at: { gt: new Date(Date.now() - AUTH_PIN_WINDOW_MS) } },
  });
  if (recentFails >= AUTH_PIN_MAX_PER_TENANT) throw httpError(429, 'Demasiados PINs errados neste estabelecimento. Espere 15 minutos.', 'TENANT_CANCEL_LOCKED');

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { cancel_pin_hash: true } });
  if (!tenant || !tenant.cancel_pin_hash) throw httpError(400, 'O dono ainda não definiu o PIN de autorização (Definições).', 'AUTH_PIN_NOT_SET');

  if (!(await bcrypt.compare(pin, tenant.cancel_pin_hash))) {
    await writeAudit({ req, tenantId, action: failAction, entityType, entityId });
    const remaining = Math.max(0, AUTH_PIN_MAX_PER_TENANT - recentFails - 1);
    throw httpError(403, 'PIN do dono incorrecto.' + (remaining ? ` Restam ${remaining} tentativa(s).` : ''), 'INVALID_AUTH_PIN');
  }
}

// E2 (31/10): cancelamentos e descontos acima do limite aceitam o PIN do dono OU
// o PIN de autorizacao de um GERENTE activo (User.pin_hash). O dono «desliga» um
// gerente tirando-lhe o PIN. `client` e o prisma ou o tx da transaccao.
async function loadAuthorizers(client, tenantId) {
  const tenant = await client.tenant.findUnique({ where: { id: tenantId }, select: { cancel_pin_hash: true } });
  const managers = await client.user.findMany({ where: { tenant_id: tenantId, role: 'manager', is_active: true, pin_hash: { not: null } }, select: { id: true, name: true, pin_hash: true } });
  return { ownerHash: tenant?.cancel_pin_hash || null, managers, any: Boolean(tenant?.cancel_pin_hash) || managers.length > 0 };
}

// Quem autorizou: { authorized_by: 'owner' } | { authorized_by: 'manager', manager_id, manager_name } | null.
async function matchAuthorizer(authorizers, pin) {
  if (authorizers.ownerHash && await bcrypt.compare(pin, authorizers.ownerHash)) return { authorized_by: 'owner' };
  for (const m of authorizers.managers) {
    if (await bcrypt.compare(pin, m.pin_hash)) return { authorized_by: 'manager', manager_id: m.id, manager_name: m.name };
  }
  return null;
}

module.exports = { checkAuthorizationPin, loadAuthorizers, matchAuthorizer, AUTH_PIN_FAIL_ACTIONS, AUTH_PIN_MAX_PER_TENANT };
