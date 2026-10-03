// ATENCAO: o header Origin/Referer e escrito PELO CLIENTE. Isto NAO e uma
// fronteira de seguranca a serio (um atacante forja o header). A protecao real
// desta rota e authMiddleware + requireRole('super_admin'). Este middleware e
// apenas uma barreira extra (defense-in-depth) contra pedidos de um browser
// fora do painel admin, e serve para cientes de painel porem-se a falar com a
// API por engano.
//
// BUG CORRIGIDO: a versao anterior usava origin.startsWith(o), pelo que
// "http://localhost:5175.evil.com" passava o teste de "http://localhost:5175".
// Agora a comparacao e EXATA, sobre o `origin` normalizado.
const ADMIN_ORIGINS = (process.env.ADMIN_ORIGINS
  ? process.env.ADMIN_ORIGINS.split(',')
  : ['http://localhost:5175'])
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

module.exports = function adminOriginCheck(req, res, next) {
  // 1) Preferimos o header Origin (o browser envia-o em pedidos CORS).
  // 2) Se nao existir, extraimos o origin do Referer (URL completo).
  let candidate = '';
  if (req.headers.origin) {
    candidate = String(req.headers.origin).trim();
  } else if (req.headers.referer) {
    try {
      candidate = new URL(req.headers.referer).origin;
    } catch {
      candidate = '';
    }
  }
  candidate = candidate.replace(/\/$/, '');

  const isAllowed = candidate !== '' && ADMIN_ORIGINS.includes(candidate);
  if (!isAllowed) {
    return res.status(403).json({ error: 'Acesso negado: origin inválido' });
  }
  next();
};