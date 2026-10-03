// Autenticacao do TERMINAL POS (cookie httpOnly do browser do balcao).
// Define req.terminal = { id, tenantId, name }.
const { TERMINAL_COOKIE, verifyTerminalCookie } = require('../utils/terminals');
const { blockedTenantStatus } = require('../utils/tenantStatus');
const prisma = require('../utils/prisma');

module.exports = async function terminalAuth(req, res, next) {
  try {
    const terminal = await verifyTerminalCookie(req.cookies && req.cookies[TERMINAL_COOKIE]);
    if (!terminal) {
      return res.status(401).json({ error: 'Este dispositivo não está emparelhado com a loja.', code: 'TERMINAL_NOT_PAIRED' });
    }
    const blocked = await blockedTenantStatus(terminal.tenantId);
    if (blocked) return res.status(403).json({ error: 'Conta suspensa. Contacte o suporte.', code: 'TENANT_BLOCKED' });
    req.terminal = terminal;
    // Contexto RLS da loja do terminal para o resto do pedido.
    return prisma.runWithTenant(terminal.tenantId, next);
  } catch (err) {
    console.error('terminalAuth error', err && err.message ? err.message : err);
    return res.status(503).json({ error: 'Serviço temporariamente indisponível' });
  }
};
