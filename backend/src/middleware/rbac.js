const requireRole = (...roles) => {
  return (req, res, next) => {
    // If request is authenticated via device key, allow (device keys are scoped to sync endpoints only)
    if (req.deviceKey) {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado: privilégios insuficientes' });
    }

    next();
  };
};

module.exports = requireRole;
