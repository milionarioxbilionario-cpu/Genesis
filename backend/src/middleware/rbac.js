// Controlo de papel. Sem excepcoes: as antigas device keys (que saltavam este
// controlo) foram substituidas pelo terminal emparelhado, cujo pedido chega
// aqui ja com req.user.role = 'cashier' (ver middleware/posWriteAuth.js).
// E2 (31/10): o GERENTE so passa nas rotas do dono que utils/managerPolicy.js lista.
const { managerAllowed } = require('../utils/managerPolicy');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado', code: 'NO_SESSION' });
  if (req.user.role === 'manager' && roles.includes('owner') && managerAllowed(req.method, req.originalUrl)) return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado: privilégios insuficientes', code: 'FORBIDDEN' });
  }
  return next();
};

module.exports = requireRole;
