// Estado de acesso do tenant, verificado no middleware de autenticacao.
//
// Antes, o estado "suspended"/"blocked"/"deleted" so era verificado no login
// (auth.js) e no /api/auth/me. Um JWT valido (12h) de uma loja entretanto
// suspensa continuava a operar (vender, mexer em stock, fechar turno) ate o
// token expirar. Agora cada pedido autenticado confirma o estado do tenant.
//
// Ha um cache curto (por omissao 30s) para nao fazer 1 SELECT por request. O
// atraso maximo de 30s ate uma suspensao fazer efeito e aceitavel; o custo de
// uma query a mais em cada pedido nao seria.
const prisma = require('./prisma');

const BLOCKED_STATUSES = new Set(['suspended', 'blocked', 'deleted']);
const TTL_MS = Number(process.env.TENANT_STATUS_CACHE_MS || 30000);

const cache = new Map(); // tenantId -> { blocked, status, at }

async function getTenantStatus(tenantId) {
  const now = Date.now();
  const hit = cache.get(tenantId);
  if (hit && now - hit.at < TTL_MS) return hit;

  let status = null;
  let trialEndsAt = null;
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { status: true, trial_ends_at: true },
    });
    status = tenant ? tenant.status : null;
    trialEndsAt = tenant ? tenant.trial_ends_at : null;
  } catch (err) {
    // Nao transformamos uma falha transitoria de leitura numa queda de toda a
    // operacao. O isolamento entre lojas nao depende disto (depende dos filtros
    // por tenant_id + RLS), por isso aqui falhamos "aberto" e registamos.
    console.error(
      '[tenantStatus] falha ao ler estado do tenant',
      tenantId,
      err && err.message ? err.message : err
    );
    return { blocked: false, status: null, at: now };
  }

  const entry = { blocked: BLOCKED_STATUSES.has(status), status, trialEndsAt, at: now };
  cache.set(tenantId, entry);
  return entry;
}

// Devolve o estado que bloqueia o acesso (string), ou null se estiver tudo ok.
async function blockedTenantStatus(tenantId) {
  if (!tenantId) return null;
  const { blocked, status } = await getTenantStatus(tenantId);
  return blocked ? status : null;
}

// Trial de 30 dias expirado (Genesis 2.0). Antes trial_ends_at era gravado e
// nunca verificado: o trial durava para sempre. Trial expirado = so leitura
// (o dono continua a ver historico e relatorios, como pede a especificacao 4.2).
async function isTrialExpired(tenantId) {
  if (!tenantId) return false;
  const { status, trialEndsAt } = await getTenantStatus(tenantId);
  return status === 'trial' && Boolean(trialEndsAt) && new Date(trialEndsAt) < new Date();
}

function clearTenantStatusCache() {
  cache.clear();
}

module.exports = { blockedTenantStatus, isTrialExpired, clearTenantStatusCache };
