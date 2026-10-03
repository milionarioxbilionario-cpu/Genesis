// Controlo de papel. Sem excepcoes: as antigas device keys (que saltavam este
// controlo) foram substituidas pelo terminal emparelhado, cujo pedido chega
// aqui ja com req.user.role = 'cashier' (ver middleware/posWriteAuth.js).
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado', code: 'NO_SESSION' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado: privilégios insuficientes', code: 'FORBIDDEN' });
  }
  return next();
};

module.exports = requireRole;
