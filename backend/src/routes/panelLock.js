// Bloqueio do painel do dono (Fase 12.4) — PIN pessoal + Face ID / impressao digital.
//
//   GET    /api/lock/status                  tem PIN? esta desbloqueado? chaves de acesso
//   PUT    /api/lock/pin                     criar (1.a vez) ou mudar (pede a senha) o PIN
//   POST   /api/lock/unlock                  PIN -> cookie de desbloqueio (5 min deslizantes)
//   POST   /api/lock/forgot                  esqueceu o PIN: a senha da conta apaga-o e pede um novo
//   POST   /api/lock/lock                    bloqueia ja (inactividade, sair da app)
//   POST   /api/lock/passkey/register-options + /passkey/register   (com o painel desbloqueado)
//   POST   /api/lock/passkey/options          + /passkey/unlock
//   DELETE /api/lock/passkey/:id
//
// 5 PINs errados (ou Face ID falhado, ou senha errada em «esqueci o PIN») em 15
// minutos terminam a sessao: o dono volta a entrar com o email e a senha.
// Contagem PROPRIA (PANEL_UNLOCK_FAIL), separada do PIN de autorizacao do balcao.
//
// O PIN, as chaves de acesso e as falhas sao da PESSOA, nao do estabelecimento:
// vivem no estabelecimento de casa e leem-se com utils/ownerSelf.js, para valerem
// igual em todos os estabelecimentos do dono.
const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { clearSessionCookies } = require('../utils/tokens');
const { invalidateSessionUser } = require('../utils/sessionUser');
const { setUnlocked, clearUnlocked, readUnlocked } = require('../utils/panelLock');
const { homeOf, findSelf, updateSelf, auditSelf } = require('../utils/ownerSelf');

const router = express.Router();
const FAIL_MAX = 5;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const pinSchema = z.string().regex(/^\d{4,6}$/, 'O PIN tem 4 a 6 dígitos');

// So o dono, com sessao normal (nem caixista, nem modo suporte).
router.use(auth, requireRole('owner'), (req, _res, next) => {
  if (req.user.scope) return next(httpError(403, 'Não disponível nesta sessão.', 'SCOPE_RESTRICTED'));
  return next();
});

const ownerRow = (req) => findSelf(req, { id: true, tenant_id: true, role: true, password_hash: true, lock_pin_hash: true });
// Chaves de acesso do dono: no estabelecimento de casa, como a conta.
const passkeyDb = () => prisma.system.webAuthnCredential;

async function recentFails(req) {
  return prisma.system.auditLog.count({ where: { tenant_id: homeOf(req), user_id: req.user.userId, action: 'PANEL_UNLOCK_FAIL', created_at: { gt: new Date(Date.now() - FAIL_WINDOW_MS) } } });
}

function tooMany(res) {
  clearSessionCookies(res);
  clearUnlocked(res);
  return httpError(401, 'Demasiadas tentativas erradas. Entre de novo com o email e a senha.', 'LOCK_TOO_MANY');
}

// Uma falha a mais; a 5.a termina a sessao.
async function registerFail(req, res, how) {
  await auditSelf(req, 'PANEL_UNLOCK_FAIL', { newValue: { how } });
  const fails = await recentFails(req);
  if (fails >= FAIL_MAX) {
    await auditSelf(req, 'PANEL_LOCK_SIGNED_OUT');
    throw tooMany(res);
  }
  return FAIL_MAX - fails;
}

router.get('/status', asyncHandler(async (req, res) => {
  const user = await ownerRow(req);
  if (!user) throw httpError(404, 'Conta não encontrada', 'USER_NOT_FOUND');
  const passkeys = await passkeyDb().findMany({ where: { tenant_id: homeOf(req), user_id: user.id }, select: { id: true, name: true, created_at: true, last_used_at: true }, orderBy: { created_at: 'asc' } });
  res.json({ has_pin: Boolean(user.lock_pin_hash), unlocked: !user.lock_pin_hash || Boolean(readUnlocked(req, user)), passkeys });
}));

router.put('/pin', asyncHandler(async (req, res) => {
  const { pin, password } = z.object({ pin: pinSchema, password: z.string().optional() }).parse(req.body || {});
  const user = await ownerRow(req);
  if (!user) throw httpError(404, 'Conta não encontrada', 'USER_NOT_FOUND');
  // Mudar um PIN que ja existe pede a senha da conta (quem so tem o telemovel nao consegue).
  if (user.lock_pin_hash) {
    if (!password || !(await bcrypt.compare(password, user.password_hash))) throw httpError(403, 'Senha incorrecta.', 'INVALID_PASSWORD');
  }
  const lock_pin_hash = await bcrypt.hash(pin, 10);
  if (!(await updateSelf(req, { lock_pin_hash }))) throw httpError(404, 'Conta não encontrada', 'USER_NOT_FOUND');
  invalidateSessionUser(user.id);
  await auditSelf(req, user.lock_pin_hash ? 'PANEL_PIN_CHANGED' : 'PANEL_PIN_CREATED');
  setUnlocked(res, { ...user, lock_pin_hash });
  res.json({ ok: true });
}));

router.post('/unlock', asyncHandler(async (req, res) => {
  const { pin } = z.object({ pin: pinSchema }).parse(req.body || {});
  const user = await ownerRow(req);
  if (!user) throw httpError(404, 'Conta não encontrada', 'USER_NOT_FOUND');
  // Sem PIN nao ha nada a desbloquear (o painel abre e pede para criar um).
  if (!user.lock_pin_hash) return res.json({ ok: true, has_pin: false });
  if ((await recentFails(req)) >= FAIL_MAX) throw tooMany(res);
  if (!(await bcrypt.compare(pin, user.lock_pin_hash))) {
    const remaining = await registerFail(req, res, 'pin');
    return res.status(403).json({ error: 'PIN incorrecto.', code: 'INVALID_LOCK_PIN', remaining });
  }
  setUnlocked(res, user);
  res.json({ ok: true });
}));

// Esqueceu o PIN: a senha da conta prova quem e (a mesma senha que abre o painel
// num aparelho novo). O PIN antigo e apagado e o painel pede logo um novo.
// Senha errada conta como as falhas do PIN (5 em 15 min terminam a sessao).
router.post('/forgot', asyncHandler(async (req, res) => {
  const { password } = z.object({ password: z.string().min(1, 'Escreva a senha da conta').max(200) }).parse(req.body || {});
  const user = await ownerRow(req);
  if (!user) throw httpError(404, 'Conta não encontrada', 'USER_NOT_FOUND');
  if ((await recentFails(req)) >= FAIL_MAX) throw tooMany(res);
  if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    const remaining = await registerFail(req, res, 'password');
    return res.status(403).json({ error: 'A senha não está certa.', code: 'INVALID_PASSWORD', remaining });
  }
  await updateSelf(req, { lock_pin_hash: null });
  invalidateSessionUser(user.id);
  await auditSelf(req, 'PANEL_PIN_RESET');
  clearUnlocked(res);
  res.json({ ok: true, has_pin: false });
}));

router.post('/lock', (req, res) => {
  clearUnlocked(res);
  res.json({ ok: true });
});

// ---------------------------------------------------------------- Face ID
// A origem tem de estar na lista (env WEBAUTHN_ORIGINS); o rpID e o nome do
// dominio dessa origem. Desafios em memoria, uso unico, 3 minutos.
const ORIGINS = (process.env.WEBAUTHN_ORIGINS || 'https://genesismz.com,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5180,http://127.0.0.1:5180,http://localhost:5190,http://127.0.0.1:5190')
  .split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
const challenges = new Map(); // userId -> { challenge, kind, expiresAt }
const CHALLENGE_MS = 3 * 60 * 1000;
const webauthn = () => import('@simplewebauthn/server');

function relyingParty(req) {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  if (!ORIGINS.includes(origin)) throw httpError(400, 'Este endereço não pode usar o Face ID.', 'WEBAUTHN_ORIGIN');
  return { origin, rpID: new URL(origin).hostname };
}

function takeChallenge(userId, kind) {
  const c = challenges.get(userId);
  challenges.delete(userId);
  if (!c || c.kind !== kind || c.expiresAt < Date.now()) throw httpError(400, 'O pedido expirou. Tente de novo.', 'WEBAUTHN_EXPIRED');
  return c.challenge;
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

router.post('/passkey/register-options', asyncHandler(async (req, res) => {
  const user = await ownerRow(req);
  if (!user?.lock_pin_hash || !readUnlocked(req, user)) throw httpError(423, 'Desbloqueie o painel primeiro.', 'PANEL_LOCKED');
  const { rpID } = relyingParty(req);
  const existing = await passkeyDb().findMany({ where: { tenant_id: homeOf(req), user_id: user.id }, select: { id: true, transports: true } });
  const { generateRegistrationOptions } = await webauthn();
  const options = await generateRegistrationOptions({
    rpName: 'Genesis', rpID,
    userName: req.user.name || 'Dono', userDisplayName: req.user.name || 'Dono',
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.id, transports: c.transports ? c.transports.split(',') : undefined })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required', authenticatorAttachment: 'platform' },
  });
  challenges.set(user.id, { challenge: options.challenge, kind: 'register', expiresAt: Date.now() + CHALLENGE_MS });
  res.json(options);
}));

router.post('/passkey/register', asyncHandler(async (req, res) => {
  const body = z.object({ response: z.any(), name: z.string().max(60).optional() }).parse(req.body || {});
  const user = await ownerRow(req);
  if (!user?.lock_pin_hash || !readUnlocked(req, user)) throw httpError(423, 'Desbloqueie o painel primeiro.', 'PANEL_LOCKED');
  const { origin, rpID } = relyingParty(req);
  const { verifyRegistrationResponse } = await webauthn();
  let v;
  try {
    v = await verifyRegistrationResponse({ response: body.response, expectedChallenge: takeChallenge(user.id, 'register'), expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true });
  } catch (err) {
    if (err.status) throw err;
    throw httpError(400, 'Não foi possível confirmar o Face ID / impressão digital.', 'WEBAUTHN_FAILED');
  }
  if (!v.verified || !v.registrationInfo) throw httpError(400, 'Não foi possível confirmar o Face ID / impressão digital.', 'WEBAUTHN_FAILED');
  const cred = v.registrationInfo.credential;
  await passkeyDb().create({ data: {
    id: cred.id, user_id: user.id, tenant_id: homeOf(req), public_key: b64url(cred.publicKey), counter: cred.counter || 0,
    transports: (body.response?.response?.transports || []).join(',') || null, name: body.name || null,
  } });
  await auditSelf(req, 'PASSKEY_ADDED', { newValue: { name: body.name || null } });
  res.status(201).json({ ok: true });
}));

router.post('/passkey/options', asyncHandler(async (req, res) => {
  const user = await ownerRow(req);
  if (!user?.lock_pin_hash) throw httpError(400, 'Ainda não criou o PIN do painel.', 'LOCK_PIN_NOT_SET');
  const { rpID } = relyingParty(req);
  const creds = await passkeyDb().findMany({ where: { tenant_id: homeOf(req), user_id: user.id }, select: { id: true, transports: true } });
  if (!creds.length) throw httpError(404, 'Este aparelho ainda não tem Face ID registado.', 'NO_PASSKEY');
  const { generateAuthenticationOptions } = await webauthn();
  const options = await generateAuthenticationOptions({ rpID, userVerification: 'required', allowCredentials: creds.map((c) => ({ id: c.id, transports: c.transports ? c.transports.split(',') : undefined })) });
  challenges.set(user.id, { challenge: options.challenge, kind: 'auth', expiresAt: Date.now() + CHALLENGE_MS });
  res.json(options);
}));

router.post('/passkey/unlock', asyncHandler(async (req, res) => {
  const { response } = z.object({ response: z.any() }).parse(req.body || {});
  const user = await ownerRow(req);
  if (!user?.lock_pin_hash) throw httpError(400, 'Ainda não criou o PIN do painel.', 'LOCK_PIN_NOT_SET');
  if ((await recentFails(req)) >= FAIL_MAX) throw tooMany(res);
  const { origin, rpID } = relyingParty(req);
  const cred = response?.id ? await passkeyDb().findFirst({ where: { id: String(response.id), tenant_id: homeOf(req), user_id: user.id } }) : null;
  if (!cred) throw httpError(404, 'Este Face ID não está registado nesta conta.', 'NO_PASSKEY');
  const { verifyAuthenticationResponse } = await webauthn();
  let v = null;
  try {
    v = await verifyAuthenticationResponse({
      response, expectedChallenge: takeChallenge(user.id, 'auth'), expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true,
      credential: { id: cred.id, publicKey: Buffer.from(cred.public_key, 'base64url'), counter: cred.counter, transports: cred.transports ? cred.transports.split(',') : undefined },
    });
  } catch (err) {
    if (err.status) throw err;
  }
  if (!v?.verified) {
    await registerFail(req, res, 'passkey');
    throw httpError(403, 'O Face ID não foi aceite. Use o PIN.', 'WEBAUTHN_FAILED');
  }
  await passkeyDb().updateMany({ where: { id: cred.id, tenant_id: homeOf(req) }, data: { counter: v.authenticationInfo.newCounter, last_used_at: new Date() } });
  setUnlocked(res, user);
  res.json({ ok: true });
}));

router.delete('/passkey/:id', asyncHandler(async (req, res) => {
  const user = await ownerRow(req);
  if (!user?.lock_pin_hash || !readUnlocked(req, user)) throw httpError(423, 'Desbloqueie o painel primeiro.', 'PANEL_LOCKED');
  const done = await passkeyDb().deleteMany({ where: { id: String(req.params.id), tenant_id: homeOf(req), user_id: user.id } });
  if (!done.count) throw httpError(404, 'Não encontrado', 'NOT_FOUND');
  await auditSelf(req, 'PASSKEY_REMOVED');
  res.json({ ok: true });
}));

module.exports = router;
