// Bloqueio do painel do dono (Fase 12.4, decisao do fundador 25/10/2026).
//
// O problema: os cookies de sessao duram 30 dias. Quem pegasse no telemovel do
// dono abria o Genesis e via logo o dinheiro da loja.
//
// Agora, depois de o dono criar o PIN pessoal (User.lock_pin_hash), TODAS as
// rotas do dono exigem tambem o cookie `genesis_unlock`:
//   - e um cookie de SESSAO (sem maxAge): morre quando o browser/app fecha;
//   - o token la dentro vale 5 minutos e e renovado a cada pedido (janela
//     deslizante): 5 minutos sem mexer = bloqueado de novo;
//   - leva o pv (senha) e a versao do PIN: mudar um ou outro invalida-o.
// Sem ele: 423 PANEL_LOCKED. O cliente mostra o ecra do PIN / Face ID.
// O caixista (scope pos) e o modo suporte nao sao afectados.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { passwordVersion, cookieOptions } = require('./tokens');

const UNLOCK_COOKIE = 'genesis_unlock';
const IDLE_MS = Number(process.env.PANEL_LOCK_IDLE_MS || 5 * 60 * 1000);
const RENEW_AFTER_MS = 30 * 1000;
// Rotas que funcionam com o painel bloqueado: desbloquear, criar o PIN, Face ID.
const EXEMPT = /^\/api\/lock(\/|$)/;

const secret = () => (process.env.JWT_SECRET || '') + ':unlock';
const pinVersion = (hash) => crypto.createHash('sha256').update('lk:' + String(hash || '')).digest('hex').slice(0, 16);

const needsUnlock = (user, scope) => Boolean(user && user.role === 'owner' && !scope && user.lock_pin_hash);

function setUnlocked(res, user) {
  const token = jwt.sign({ u: user.id, pv: passwordVersion(user.password_hash), lk: pinVersion(user.lock_pin_hash) }, secret(), { expiresIn: Math.round(IDLE_MS / 1000) });
  const opts = cookieOptions(undefined);
  delete opts.maxAge; // cookie de sessao
  res.cookie(UNLOCK_COOKIE, token, opts);
}

function clearUnlocked(res) {
  res.clearCookie(UNLOCK_COOKIE);
}

// Devolve o payload valido ou null.
function readUnlocked(req, user) {
  const token = req.cookies && req.cookies[UNLOCK_COOKIE];
  if (!token || !user) return null;
  try {
    const d = jwt.verify(token, secret());
    if (d.u !== user.id || d.pv !== passwordVersion(user.password_hash) || d.lk !== pinVersion(user.lock_pin_hash)) return null;
    return d;
  } catch { return null; }
}

// Chamado pelo authMiddleware. true = pode seguir (e renova o cookie se preciso).
function checkPanelLock(req, res, user, scope) {
  if (!needsUnlock(user, scope)) return true;
  if (EXEMPT.test(String(req.originalUrl || '').split('?')[0])) return true;
  const d = readUnlocked(req, user);
  if (!d) return false;
  if (Date.now() - d.iat * 1000 > RENEW_AFTER_MS) setUnlocked(res, user);
  return true;
}

module.exports = { UNLOCK_COOKIE, IDLE_MS, needsUnlock, setUnlocked, clearUnlocked, readUnlocked, checkPanelLock, pinVersion };
