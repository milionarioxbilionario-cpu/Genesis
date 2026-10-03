// Terminais POS emparelhados (Genesis 2.0).
//
// Modelo (o mesmo do Square/Loyverse/Lightspeed): o dono gera um codigo de 6
// digitos valido 10 minutos; no PC do balcao introduz-se o codigo e o servidor
// grava um cookie httpOnly com o segredo do terminal. A conta do dono NUNCA
// fica no balcao — antes o PC ficava com a sessao do dono o dia todo.
//
// O segredo do terminal tem 256 bits de entropia, por isso basta SHA-256 (sem
// bcrypt) para o guardar: nao ha dicionario possivel, e cada pedido do POS
// verifica-o sem gastar ~70 ms de CPU.
//
// Limitacao assumida: os CODIGOS de emparelhamento vivem em memoria (como os
// codigos de reset de senha). Um reinicio invalida os pendentes — o dono gera
// outro. Com varias instancias seria preciso guarda-los na BD.
const crypto = require('crypto');
const prisma = require('./prisma');

const TERMINAL_COOKIE = 'genesis_terminal';
const TERMINAL_COOKIE_MS = 365 * 24 * 60 * 60 * 1000;
const PAIRING_TTL_MS = 10 * 60 * 1000;
const pairingCodes = new Map(); // code -> { tenantId, name, createdBy, expiresAt }

const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

function createPairingCode({ tenantId, name, createdBy }) {
  const now = Date.now();
  for (const [code, entry] of pairingCodes) if (entry.expiresAt < now) pairingCodes.delete(code);
  let code;
  do { code = String(crypto.randomInt(100000, 1000000)); } while (pairingCodes.has(code));
  const expiresAt = now + PAIRING_TTL_MS;
  pairingCodes.set(code, { tenantId, name, createdBy, expiresAt });
  return { code, expires_at: new Date(expiresAt).toISOString() };
}

// Uso unico: um codigo valido e apagado logo que e usado.
function consumePairingCode(code) {
  const entry = pairingCodes.get(String(code));
  if (!entry) return null;
  pairingCodes.delete(String(code));
  if (entry.expiresAt < Date.now()) return null;
  return entry;
}

async function createTerminal({ tenantId, name, createdBy }) {
  const id = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('base64url');
  const terminal = await prisma.posTerminal.create({ data: { id, tenant_id: tenantId, name, secret_hash: sha256(secret), created_by: createdBy } });
  return { terminal, cookieValue: `${id}.${secret}` };
}

const seenAt = new Map(); // id -> ultima escrita de last_seen_at (evita 1 UPDATE por pedido)

async function verifyTerminalCookie(value) {
  if (!value || typeof value !== 'string') return null;
  const dot = value.indexOf('.');
  if (dot < 1) return null;
  const id = value.slice(0, dot);
  const secret = value.slice(dot + 1);
  const t = await prisma.posTerminal.findUnique({ where: { id } });
  if (!t || t.revoked_at) return null;
  const a = Buffer.from(t.secret_hash, 'hex');
  const b = Buffer.from(sha256(secret), 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (!seenAt.get(id) || Date.now() - seenAt.get(id) > 5 * 60 * 1000) {
    seenAt.set(id, Date.now());
    prisma.posTerminal.update({ where: { id }, data: { last_seen_at: new Date() } }).catch(() => {});
  }
  return { id: t.id, tenantId: t.tenant_id, name: t.name };
}

function terminalCookieOptions() {
  const options = { httpOnly: true, sameSite: 'lax', maxAge: TERMINAL_COOKIE_MS };
  if (process.env.NODE_ENV === 'production') options.secure = true;
  return options;
}

module.exports = {
  TERMINAL_COOKIE, createPairingCode, consumePairingCode, createTerminal, verifyTerminalCookie, terminalCookieOptions,
};
