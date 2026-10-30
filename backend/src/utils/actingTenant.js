// Etapa D: estabelecimento em que o dono esta a trabalhar agora.
//
// O token leva `act` (opcional). Sem `act`, ou igual a loja da conta, e a loja
// «de casa» (user.tenant_id), como sempre. Com outro `act`, so vale se:
//   - a conta for de dono, numa sessao normal (nem terminal nem suporte);
//   - existir Membership(user_id, tenant_id = act) — lida com o cliente de sistema.
// Validado em CADA pedido (com cache curta), por isso retirar o acesso conta logo
// (invalidateActing). Daqui para a frente tudo usa este tenant (filtro + RLS).
const prisma = require('./prisma');

const TTL_MS = Number(process.env.SESSION_USER_CACHE_MS || 5000);
const cache = new Map(); // `${userId}:${tenantId}` -> { ok, at }

async function isMember(userId, tenantId) {
  const key = `${userId}:${tenantId}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.ok;
  const row = await prisma.system.membership.findFirst({ where: { user_id: userId, tenant_id: tenantId }, select: { id: true } });
  cache.set(key, { ok: Boolean(row), at: Date.now() });
  return Boolean(row);
}

// -> tenantId em que o pedido corre, ou null se o `act` nao for permitido.
async function resolveActingTenant(user, decoded) {
  const act = decoded && decoded.act;
  if (!act || act === user.tenant_id) return user.tenant_id || null;
  if (user.role !== 'owner' || decoded.scope) return null;
  return (await isMember(user.id, act)) ? act : null;
}

// Todos os estabelecimentos deste dono: o de casa primeiro.
async function ownerTenantIds(user) {
  const rows = await prisma.system.membership.findMany({ where: { user_id: user.id }, select: { tenant_id: true }, orderBy: { created_at: 'asc' } });
  return [user.tenant_id, ...rows.map((r) => r.tenant_id).filter((t) => t !== user.tenant_id)].filter(Boolean);
}

function invalidateActing(userId) {
  for (const k of cache.keys()) if (!userId || k.startsWith(userId + ':')) cache.delete(k);
}

module.exports = { resolveActingTenant, ownerTenantIds, invalidateActing };
