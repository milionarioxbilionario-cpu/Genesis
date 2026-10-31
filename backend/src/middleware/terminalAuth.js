// Autenticacao do TERMINAL POS (cookie httpOnly do browser do balcao).
// Define req.terminal = { id, tenantId, name }.
const { TERMINAL_COOKIE, verifyTerminalCookie } = require('../utils/terminals');
const { blockedTenantStatus, closedState } = require('../utils/tenantStatus');
const prisma = require('../utils/prisma');

module.exports = async function terminalAuth(req, res, next) {
  try {
    const terminal = await verifyTerminalCookie(req.cookies && req.cookies[TERMINAL_COOKIE]);
    if (!terminal) {
      return res.status(401).json({ error: 'Este dispositivo não está emparelhado com o estabelecimento.', code: 'TERMINAL_NOT_PAIRED' });
    }
    const blocked = await blockedTenantStatus(terminal.tenantId);
    if (blocked) return res.status(403).json({ error: 'Conta suspensa. Contacte o suporte.', code: 'TENANT_BLOCKED' });
    // 31/10: encerrado ha mais de 7 dias = o terminal deixa de funcionar.
    const closed = await closedState(terminal.tenantId);
    if (closed.closed && !closed.syncOpen) return res.status(403).json({ error: 'Este estabelecimento foi encerrado pelo dono.', code: 'ESTABLISHMENT_CLOSED' });
    req.terminal = terminal;
    req.terminalClosed = closed.closed;
    // Contexto RLS da loja do terminal para o resto do pedido.
    return prisma.runWithTenant(terminal.tenantId, next);
  } catch (err) {
    console.error('terminalAuth error', err && err.message ? err.message : err);
    return res.status(503).json({ error: 'Serviço temporariamente indisponível' });
  }
};
