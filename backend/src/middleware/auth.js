const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { blockedTenantStatus, isTrialExpired } = require('../utils/tenantStatus');
const { isScopeAllowed } = require('../utils/sessionScopes');
const { validateSessionClaims } = require('../utils/sessionUser');

// Autenticacao por sessao (cookie httpOnly `token` ou Authorization: Bearer).
// Define req.user = { userId, tenantId, role, name, scope, tid }.
//
// Ordem das verificacoes:
//  1. assinatura/expiracao do JWT                       -> 401
//  2. conta activa + emitido com a senha actual (pv)    -> 401 (utils/sessionUser.js)
//  3. ambito restrito ('pos', 'support')                -> 403 SCOPE_RESTRICTED
//  4. loja suspensa/bloqueada/eliminada                 -> 403
//  5. trial expirado: so leitura                        -> 402 TRIAL_EXPIRED
// Falha de infra-estrutura (BD em baixo) -> 503, nunca 401: um 401 mandaria
// todos os POS para o login e a fila offline deixaria de tentar.
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  else if (req.cookies && req.cookies.token) token = req.cookies.token;

  if (!token) return res.status(401).json({ error: 'Sessão não iniciada', code: 'NO_SESSION' });

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Sessão expirada. Entre de novo.', code: 'SESSION_EXPIRED' });
    }

    const check = await validateSessionClaims(decoded);
    if (!check.ok) return res.status(check.status).json({ error: check.error, code: check.code });

    req.user = {
      userId: check.user.id,
      tenantId: check.user.tenant_id || null,
      // Papel e nome vem da BD, nao do token: uma alteracao conta logo.
      role: check.user.role,
      name: check.user.name,
      scope: decoded.scope || null,
      tid: decoded.tid || null,
    };

    if (req.user.scope && !isScopeAllowed(req.user.scope, req.method, req.originalUrl)) {
      return res.status(403).json({
        error: req.user.scope === 'support' ? 'Modo suporte: só leitura.' : 'Esta acção não está disponível no terminal.',
        code: 'SCOPE_RESTRICTED',
      });
    }

    if (req.user.role !== 'super_admin' && req.user.tenantId) {
      const blocked = await blockedTenantStatus(req.user.tenantId);
      if (blocked) return res.status(403).json({ error: 'Conta suspensa. Contacte o suporte.', code: 'TENANT_BLOCKED' });
      if (req.method !== 'GET' && await isTrialExpired(req.user.tenantId)) {
        return res.status(402).json({ error: 'O período de teste terminou. Contacte a Genesis para activar a subscrição.', code: 'TRIAL_EXPIRED' });
      }
    }

    // Contexto da loja para o resto do pedido: todas as queries passam a usar o
    // papel SEM bypassrls com app.tenant_id desta loja (utils/prisma.js).
    return prisma.runWithTenant(req.user.tenantId, next);
  } catch (err) {
    console.error('Auth middleware error', err && err.message ? err.message : err);
    return res.status(503).json({ error: 'Serviço temporariamente indisponível' });
  }
};

module.exports = authMiddleware;
