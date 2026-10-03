// Autenticacao das ESCRITAS do POS (vendas, pedidos de reposicao, quebras).
//
// 1) Com sessao valida (cookie `token` / Bearer) -> authMiddleware normal.
// 2) Sem sessao valida mas com o cookie do TERMINAL emparelhado -> aceite SO
//    para POST e SO se o corpo indicar `seller_user_id` de um caixista activo
//    desta loja. E o caminho da fila offline: uma venda feita as 23h pode
//    sincronizar de manha, depois de a sessao de 12 h do caixista expirar.
//    Substitui as antigas "device keys" (segredo em texto claro no IndexedDB).
const authMiddleware = require('./auth');
const terminalAuth = require('./terminalAuth');
const { verifyAccessToken } = require('../utils/tokens');
const { TERMINAL_COOKIE } = require('../utils/terminals');
const { loadSessionUser } = require('../utils/sessionUser');

function hasUsableSession(req) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : req.cookies && req.cookies.token;
  if (!token) return false;
  try { verifyAccessToken(token); return true; } catch { return false; }
}

module.exports = function posWriteAuth(req, res, next) {
  if (hasUsableSession(req)) return authMiddleware(req, res, next);
  if (req.method !== 'POST' || !(req.cookies && req.cookies[TERMINAL_COOKIE])) return authMiddleware(req, res, next);

  return terminalAuth(req, res, async () => {
    try {
      const sellerId = req.body && req.body.seller_user_id;
      if (!sellerId) return res.status(401).json({ error: 'Sessão do caixista expirada', code: 'NO_SESSION' });
      const seller = await loadSessionUser(sellerId);
      if (!seller || !seller.is_active || seller.role !== 'cashier' || seller.tenant_id !== req.terminal.tenantId) {
        // 403: recusa definitiva (a fila marca como recusado, nao insiste).
        return res.status(403).json({ error: 'Caixista inválido ou inactivo para este terminal', code: 'INVALID_SELLER' });
      }
      req.user = { userId: seller.id, tenantId: seller.tenant_id, role: 'cashier', name: seller.name, scope: 'pos', tid: req.terminal.id, viaTerminal: true };
      req.authVia = 'terminal';
      return next();
    } catch (err) {
      console.error('posWriteAuth error', err && err.message ? err.message : err);
      return res.status(503).json({ error: 'Serviço temporariamente indisponível' });
    }
  });
};

module.exports.hasUsableSession = hasUsableSession;
