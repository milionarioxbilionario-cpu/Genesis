// Emissao e leitura de tokens de sessao — FONTE UNICA (2026-10-03).
//
// Antes, a mesma logica estava copiada em routes/auth.js, routes/admin.js e
// routes/refresh.js. Cada copia evoluia sozinha (o login Google nem emitia
// refresh token). Agora todos usam este modulo.
//
// Dois campos novos no payload:
//  - `pv` (password version): fragmento de um hash do password_hash actual. Se a
//    senha mudar, todos os tokens antigos deixam de bater certo e sao recusados
//    (ver utils/sessionUser.js). Sem isto, mudar a senha de um caixista apanhado
//    a roubar nao lhe tirava a sessao aberta.
//  - `scope`: 'pos' (caixista no terminal) ou 'support' (Super Admin, so
//    leitura). Listas fechadas de rotas em utils/sessionScopes.js.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_COOKIE = 'token';
const REFRESH_COOKIE = 'refreshToken';
const ACCESS_COOKIE_MS = 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_MS = 30 * 24 * 60 * 60 * 1000;

const accessSecret = () => process.env.JWT_SECRET;
const refreshSecret = () => process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + 'refresh');

function passwordVersion(passwordHash) {
  return crypto.createHash('sha256').update('pv:' + String(passwordHash || '')).digest('hex').slice(0, 16);
}

// `tid` (opcional): terminal POS onde a sessao do caixista foi aberta.
function buildPayload(user, scope, tid) {
  const payload = {
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
    name: user.name,
    pv: passwordVersion(user.password_hash),
  };
  if (scope) payload.scope = scope;
  if (tid) payload.tid = tid;
  return payload;
}

function signAccessToken(user, { scope, tid } = {}) {
  return jwt.sign(buildPayload(user, scope, tid), accessSecret(), { expiresIn: process.env.JWT_EXPIRY || '12h' });
}

function signRefreshToken(user, { scope, tid } = {}) {
  return jwt.sign(buildPayload(user, scope, tid), refreshSecret(), { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d' });
}

function cookieOptions(maxAge) {
  const options = { httpOnly: true, sameSite: 'lax', maxAge };
  if (process.env.NODE_ENV === 'production') options.secure = true;
  return options;
}

// Emite access + refresh com o MESMO scope. Emitir so o access deixava o
// refresh antigo (sem scope) disponivel para recuperar uma sessao completa.
function setSessionCookies(res, user, { scope, tid } = {}) {
  const token = signAccessToken(user, { scope, tid });
  res.cookie(ACCESS_COOKIE, token, cookieOptions(ACCESS_COOKIE_MS));
  res.cookie(REFRESH_COOKIE, signRefreshToken(user, { scope, tid }), cookieOptions(REFRESH_COOKIE_MS));
  return token;
}

function clearSessionCookies(res) {
  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
}

const verifyAccessToken = (token) => jwt.verify(token, accessSecret());
const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret());

module.exports = {
  cookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  passwordVersion,
  signAccessToken,
  signRefreshToken,
  setSessionCookies,
  clearSessionCookies,
  verifyAccessToken,
  verifyRefreshToken,
};
