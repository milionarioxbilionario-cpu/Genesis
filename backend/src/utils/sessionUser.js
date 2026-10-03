// Validacao da sessao contra o estado ACTUAL da conta (2026-10-03).
//
// Antes, um JWT valido bastava: o middleware nunca olhava para a BD. Um caixista
// desactivado pelo dono (ou cuja senha foi mudada) continuava a vender ate o
// token expirar — e com o refresh token de 30 dias, para sempre.
//
// Agora cada pedido autenticado confirma:
//   - a conta existe e esta activa;
//   - o token foi emitido com a senha actual (claim `pv`, ver utils/tokens.js);
//   - o papel vem da BD, nao do token (uma despromocao conta logo).
//
// Cache curta (5 s) para nao fazer 1 SELECT por pedido em rajadas do POS. As
// rotas que desactivam contas ou mudam senhas chamam invalidateSessionUser()
// para o efeito ser imediato nesta instancia.
const prisma = require('./prisma');
const { passwordVersion } = require('./tokens');

const TTL_MS = Number(process.env.SESSION_USER_CACHE_MS || 5000);
const cache = new Map(); // userId -> { user, at }

async function loadSessionUser(userId) {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.user;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenant_id: true, role: true, name: true, is_active: true, password_hash: true },
  });
  cache.set(userId, { user, at: Date.now() });
  return user;
}

function invalidateSessionUser(userId) {
  if (userId) cache.delete(userId); else cache.clear();
}

// Devolve { ok: true, user } ou { ok: false, status, error, code }.
async function validateSessionClaims(decoded) {
  const userId = decoded && (decoded.userId || decoded.id);
  if (!userId) return { ok: false, status: 401, error: 'Sessão inválida', code: 'SESSION_INVALID' };

  const user = await loadSessionUser(userId);
  if (!user || !user.is_active) {
    return { ok: false, status: 401, error: 'Conta inactiva ou removida. Fale com o dono da loja.', code: 'ACCOUNT_INACTIVE' };
  }
  if (!decoded.pv || decoded.pv !== passwordVersion(user.password_hash)) {
    return { ok: false, status: 401, error: 'Sessão expirada: a senha desta conta foi alterada. Entre de novo.', code: 'PASSWORD_CHANGED' };
  }
  if ((decoded.tenantId || null) !== (user.tenant_id || null)) {
    return { ok: false, status: 401, error: 'Sessão inválida', code: 'SESSION_INVALID' };
  }
  return { ok: true, user };
}

module.exports = { validateSessionClaims, invalidateSessionUser, loadSessionUser };
