const ADMIN_ORIGINS = process.env.ADMIN_ORIGINS
  ? process.env.ADMIN_ORIGINS.split(',')
  : ['http://localhost:5175'];

module.exports = function adminOriginCheck(req, res, next) {
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = ADMIN_ORIGINS.some(o => origin && origin.startsWith(o));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Acesso negado: origin inválido' });
  }
  next();
};