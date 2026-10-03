// Terminal POS (Genesis 2.0) — emparelhamento, PIN do caixista e turno.
//
//   POST /api/pos/pair          codigo do dono -> cookie do terminal (1 ano)
//   GET  /api/pos/terminal      loja + perfis dos caixistas (ecra de PIN)
//   POST /api/pos/login         caixista + PIN -> sessao 'pos' de 12 h
//   POST /api/pos/lock          termina a sessao do caixista (o terminal fica)
//   GET  /api/pos/shift         estado do turno do caixista (sem o esperado)
//   POST /api/pos/shift/close   fecho cego feito pelo proprio caixista
const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const terminalAuth = require('../middleware/terminalAuth');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { setSessionCookies, clearSessionCookies, verifyAccessToken } = require('../utils/tokens');
const { TERMINAL_COOKIE, consumePairingCode, createTerminal, terminalCookieOptions } = require('../utils/terminals');
const { getShiftLock } = require('../utils/shiftLock');
const { getShiftState, closeShiftBlind } = require('../utils/shift');
const { blockedTenantStatus } = require('../utils/tenantStatus');

const router = express.Router();

const PIN_FAIL_MAX = 5;
const PIN_FAIL_WINDOW_MS = 15 * 60 * 1000;

const pairLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas tentativas de emparelhamento. Espere 15 minutos.', code: 'TOO_MANY_ATTEMPTS' },
});
const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => (req.cookies && req.cookies[TERMINAL_COOKIE] ? String(req.cookies[TERMINAL_COOKIE]).split('.')[0] : req.ip),
  message: { error: 'Demasiadas tentativas de PIN neste terminal. Espere 15 minutos.', code: 'TOO_MANY_ATTEMPTS' },
});

router.post('/pair', pairLimiter, asyncHandler(async (req, res) => {
  const { code } = z.object({ code: z.string().regex(/^\d{6}$/, 'O código tem 6 dígitos') }).parse(req.body);
  const pairing = consumePairingCode(code);
  if (!pairing) throw httpError(400, 'Código inválido ou expirado. Peça um novo ao dono da loja.', 'INVALID_PAIRING_CODE');
  if (await blockedTenantStatus(pairing.tenantId)) throw httpError(403, 'Conta suspensa. Contacte o suporte.', 'TENANT_BLOCKED');
  const { terminal, cookieValue } = await createTerminal(pairing);
  res.cookie(TERMINAL_COOKIE, cookieValue, terminalCookieOptions());
  clearSessionCookies(res); // nenhuma sessao anterior (ex.: do dono) fica neste browser
  await writeAudit({ tenantId: pairing.tenantId, userId: pairing.createdBy, req, action: 'TERMINAL_PAIRED', entityType: 'terminal', entityId: terminal.id, newValue: { name: terminal.name } });
  res.status(201).json({ ok: true, terminal: { id: terminal.id, name: terminal.name } });
}));

// Quem esta com sessao aberta NESTE terminal (para o POS retomar depois de F5).
function currentPosSession(req, terminalId) {
  const token = req.cookies && req.cookies.token;
  if (!token) return null;
  try {
    const d = verifyAccessToken(token);
    return d.scope === 'pos' && d.tid === terminalId ? d.userId : null;
  } catch { return null; }
}

router.get('/terminal', terminalAuth, asyncHandler(async (req, res) => {
  const { tenantId, id } = req.terminal;
  const [tenant, cashiers] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, location: true, discount_free_pct: true } }),
    prisma.user.findMany({ where: { tenant_id: tenantId, role: 'cashier', is_active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, pin_hash: true } }),
  ]);
  const profiles = await Promise.all(cashiers.map(async (c) => {
    const lock = await getShiftLock(prisma, tenantId, c.id);
    return { id: c.id, name: c.name, has_pin: Boolean(c.pin_hash), locked: lock.locked };
  }));
  const sessionUserId = currentPosSession(req, id);
  res.json({
    terminal: { id, name: req.terminal.name },
    store: { name: tenant?.name || 'Loja', location: tenant?.location || '', discount_free_pct: tenant?.discount_free_pct ?? 10 },
    cashiers: profiles,
    session_cashier_id: profiles.some((p) => p.id === sessionUserId) ? sessionUserId : null,
  });
}));

router.post('/login', terminalAuth, pinLimiter, asyncHandler(async (req, res) => {
  const { cashier_id, pin } = z.object({ cashier_id: z.string().uuid(), pin: z.string().regex(/^\d{4}$/, 'PIN inválido') }).parse(req.body);
  const { tenantId, id: terminalId } = req.terminal;
  const cashier = await prisma.user.findFirst({ where: { id: cashier_id, tenant_id: tenantId, role: 'cashier', is_active: true } });
  if (!cashier) throw httpError(404, 'Perfil não encontrado neste terminal', 'CASHIER_NOT_FOUND');
  if (!cashier.pin_hash) throw httpError(400, 'Este caixista ainda não tem PIN. O dono define-o em Equipa.', 'PIN_NOT_SET');

  const fails = await prisma.auditLog.count({ where: { tenant_id: tenantId, action: 'POS_PIN_FAIL', entity_id: cashier.id, created_at: { gt: new Date(Date.now() - PIN_FAIL_WINDOW_MS) } } });
  if (fails >= PIN_FAIL_MAX) throw httpError(423, 'Demasiados PINs errados. Este perfil fica bloqueado 15 minutos.', 'PIN_LOCKED');

  if (!(await bcrypt.compare(pin, cashier.pin_hash))) {
    await writeAudit({ req, tenantId, userId: cashier.id, action: 'POS_PIN_FAIL', entityType: 'user', entityId: cashier.id, newValue: { terminal: terminalId } });
    return res.status(401).json({ error: 'PIN incorrecto', code: 'INVALID_PIN', remaining: Math.max(0, PIN_FAIL_MAX - fails - 1) });
  }

  setSessionCookies(res, cashier, { scope: 'pos', tid: terminalId });
  await writeAudit({ req, tenantId, userId: cashier.id, action: 'POS_LOGIN', entityType: 'user', entityId: cashier.id, newValue: { terminal: terminalId } });
  res.json({ ok: true, cashier: { id: cashier.id, name: cashier.name } });
}));

router.post('/lock', (req, res) => {
  clearSessionCookies(res);
  res.json({ ok: true });
});

router.get('/shift', auth, requireRole('cashier'), asyncHandler(async (req, res) => {
  res.json(await getShiftState(req.user.tenantId, req.user.userId));
}));

router.post('/shift/close', auth, requireRole('cashier'), asyncHandler(async (req, res) => {
  const { declared_amount } = z.object({ declared_amount: z.number().int().nonnegative() }).parse(req.body);
  const result = await closeShiftBlind({ req, tenantId: req.user.tenantId, cashier: { id: req.user.userId, name: req.user.name }, declared: declared_amount });
  res.status(result.status).json(result.body);
}));

module.exports = router;
