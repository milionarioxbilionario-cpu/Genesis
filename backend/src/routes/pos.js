// Terminal POS (Genesis 2.0) — emparelhamento, PIN do caixista e turno.
//
//   POST /api/pos/pair          codigo do dono -> cookie do terminal (1 ano)
//   GET  /api/pos/terminal      loja + perfis dos caixistas (ecra de PIN)
//   POST /api/pos/login         caixista + PIN -> sessao 'pos' de 12 h
//   POST /api/pos/lock          termina a sessao do caixista (o terminal fica)
//   GET  /api/pos/shift         estado do turno do caixista (sem o esperado)
//   POST /api/pos/shift/close   fecho cego feito pelo proprio caixista
//   POST /api/pos/shift/open    turno novo depois de fechado (PIN do dono)
//   POST /api/pos/sales         ultimas vendas do caixista (PIN do dono)
const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prisma');
const { publish } = require('../utils/liveBus');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const terminalAuth = require('../middleware/terminalAuth');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { setSessionCookies, clearSessionCookies, verifyAccessToken, passwordVersion } = require('../utils/tokens');
const { TERMINAL_COOKIE, consumePairingCode, createTerminal, rotateTerminal, terminalMemberIds, terminalCookieOptions } = require('../utils/terminals');
const { getShiftLock } = require('../utils/shiftLock');
const { getShiftState, closeShiftBlind, shiftStatus } = require('../utils/shift');
const { checkAuthorizationPin } = require('../utils/authPin');
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
  if (!pairing) throw httpError(400, 'Código inválido ou expirado. Peça um novo ao dono do estabelecimento.', 'INVALID_PAIRING_CODE');
  if (await blockedTenantStatus(pairing.tenantId)) throw httpError(403, 'Conta suspensa. Contacte o suporte.', 'TENANT_BLOCKED');
  // Codigo de um terminal que ja existe: volta a ser o mesmo terminal (perfis e nome mantidos).
  const made = pairing.terminalId ? await rotateTerminal({ tenantId: pairing.tenantId, terminalId: pairing.terminalId }) : await createTerminal(pairing);
  if (!made) throw httpError(400, 'Código inválido ou expirado. Peça um novo ao dono do estabelecimento.', 'INVALID_PAIRING_CODE');
  const { terminal, cookieValue } = made;
  res.cookie(TERMINAL_COOKIE, cookieValue, terminalCookieOptions());
  clearSessionCookies(res); // nenhuma sessao anterior (ex.: do dono) fica neste browser
  await writeAudit({ tenantId: pairing.tenantId, userId: pairing.createdBy, req, action: pairing.terminalId ? 'TERMINAL_REPAIRED' : 'TERMINAL_PAIRED', entityType: 'terminal', entityId: terminal.id, newValue: { name: terminal.name } });
  res.status(201).json({ ok: true, terminal: { id: terminal.id, name: terminal.name } });
}));

// Quem esta com sessao aberta NESTE terminal (para o POS retomar depois de F5).
function currentPosSession(req, terminalId) {
  const token = req.cookies && req.cookies.token;
  if (!token) return null;
  try {
    const d = verifyAccessToken(token);
    return (d.scope === 'pos' || d.scope === 'guard') && d.tid === terminalId ? d.userId : null;
  } catch { return null; }
}

router.get('/terminal', terminalAuth, asyncHandler(async (req, res) => {
  const { tenantId, id } = req.terminal;
  const [tenant, allCashiers, memberIds] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, location: true, phone: true, nuit: true, receipt_footer: true, logo_data: true, discount_free_pct: true, vat_mode: true, custom_items_enabled: true, cancel_pin_hash: true } }),
    prisma.user.findMany({ where: { tenant_id: tenantId, role: { in: ['cashier', 'guard'] }, is_active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, role: true, pin_hash: true, language: true } }),
    terminalMemberIds(prisma, id),
  ]);
  // Etapa A: so os perfis deste terminal (sem lista = todos, como antes).
  // 31/10: o terminal da saida mostra so os guardas.
  const byPurpose = req.terminal.purpose === 'exit' ? allCashiers.filter((c) => c.role === 'guard') : allCashiers;
  const cashiers = memberIds ? byPurpose.filter((c) => memberIds.includes(c.id)) : byPurpose;
  const profiles = await Promise.all(cashiers.map(async (c) => {
    const [lock, shift] = await Promise.all([getShiftLock(prisma, tenantId, c.id), shiftStatus(prisma, tenantId, c.id)]);
    // O cadeado e uma pausa: o perfil mostra se o turno ficou aberto ou fechado.
    // pin_v: muda quando o PIN muda — o terminal apaga o verificador do PIN sem rede (Fase 12.2).
    return { id: c.id, name: c.name, role: c.role, language: c.language, has_pin: Boolean(c.pin_hash), pin_v: c.pin_hash ? passwordVersion(c.pin_hash) : null, locked: lock.locked, shift_open: shift.open };
  }));
  const sessionUserId = currentPosSession(req, id);
  res.json({
    terminal: { id, name: req.terminal.name, purpose: req.terminal.purpose || 'counter' },
    // 15.1: o recibo leva o logotipo, o telefone, o NUIT e a mensagem final (tambem sem rede).
    store: { name: tenant?.name || 'Estabelecimento', location: tenant?.location || '', phone: tenant?.phone || '', nuit: tenant?.nuit || null, receipt_footer: tenant?.receipt_footer || null, logo: tenant?.logo_data || null, discount_free_pct: tenant?.discount_free_pct ?? 10, vat_mode: tenant?.vat_mode || 'none', custom_items_enabled: tenant?.custom_items_enabled !== false },
    cashiers: profiles,
    // 30/10/2026: versao do PIN de autorizacao do dono (nunca o PIN). Quando muda,
    // o terminal apaga o verificador que permite abrir as vendas sem rede.
    auth_pin_v: tenant?.cancel_pin_hash ? passwordVersion(tenant.cancel_pin_hash) : null,
    session_cashier_id: profiles.some((p) => p.id === sessionUserId) ? sessionUserId : null,
  });
}));

router.post('/login', terminalAuth, pinLimiter, asyncHandler(async (req, res) => {
  const { cashier_id, pin } = z.object({ cashier_id: z.string().uuid(), pin: z.string().regex(/^\d{4}$/, 'PIN inválido') }).parse(req.body);
  const { tenantId, id: terminalId } = req.terminal;
  // 31/10: encerrado: ninguem comeca a trabalhar (a fila sem rede continua a enviar).
  if (req.terminalClosed) throw httpError(403, 'Este estabelecimento foi encerrado pelo dono. As vendas que estavam por enviar continuam a ser enviadas.', 'ESTABLISHMENT_CLOSED');
  const cashier = await prisma.user.findFirst({ where: { id: cashier_id, tenant_id: tenantId, role: { in: ['cashier', 'guard'] }, is_active: true } });
  if (!cashier) throw httpError(404, 'Perfil não encontrado neste terminal', 'CASHIER_NOT_FOUND');
  if (!cashier.pin_hash) throw httpError(400, 'Este caixista ainda não tem PIN. O dono define-o em Equipa.', 'PIN_NOT_SET');
  const memberIds = await terminalMemberIds(prisma, terminalId);
  if (memberIds && !memberIds.includes(cashier.id)) throw httpError(403, 'Este perfil não trabalha neste terminal.', 'NOT_ON_TERMINAL');

  const fails = await prisma.auditLog.count({ where: { tenant_id: tenantId, action: 'POS_PIN_FAIL', entity_id: cashier.id, created_at: { gt: new Date(Date.now() - PIN_FAIL_WINDOW_MS) } } });
  if (fails >= PIN_FAIL_MAX) throw httpError(423, 'Demasiados PINs errados. Este perfil fica bloqueado 15 minutos.', 'PIN_LOCKED');

  if (!(await bcrypt.compare(pin, cashier.pin_hash))) {
    await writeAudit({ req, tenantId, userId: cashier.id, action: 'POS_PIN_FAIL', entityType: 'user', entityId: cashier.id, newValue: { terminal: terminalId } });
    return res.status(401).json({ error: 'PIN incorrecto', code: 'INVALID_PIN', remaining: Math.max(0, PIN_FAIL_MAX - fails - 1) });
  }

  // Etapa B: o guarda tem uma sessao propria, que so le e confere recibos.
  setSessionCookies(res, cashier, { scope: cashier.role === 'guard' ? 'guard' : 'pos', tid: terminalId });
  await writeAudit({ req, tenantId, userId: cashier.id, action: 'POS_LOGIN', entityType: 'user', entityId: cashier.id, newValue: { terminal: terminalId } });
  res.json({ ok: true, cashier: { id: cashier.id, name: cashier.name, role: cashier.role, language: cashier.language } });
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

const pinBody = z.object({ pin: z.string().regex(/^\d{4,6}$/, 'PIN inválido') });

// Turno fechado -> so o dono abre outro, com o PIN de autorizacao no terminal.
router.post('/shift/open', auth, requireRole('cashier'), asyncHandler(async (req, res) => {
  const { pin } = pinBody.parse(req.body);
  const { tenantId, userId } = req.user;
  const lock = await getShiftLock(prisma, tenantId, userId);
  if (lock.locked) throw httpError(423, 'Perfil bloqueado por erros no fecho. O dono tem de desbloquear no painel dele.', 'CASHIER_LOCKED');
  if ((await shiftStatus(prisma, tenantId, userId)).open) throw httpError(409, 'O turno já está aberto.', 'SHIFT_ALREADY_OPEN');
  await checkAuthorizationPin({ req, tenantId, pin, failAction: 'SHIFT_OPEN_PIN_FAIL', entityType: 'user', entityId: userId });
  await writeAudit({ req, tenantId, action: 'SHIFT_OPENED', entityType: 'user', entityId: userId, newValue: { cashierName: req.user.name, terminal: req.user.tid || null } });
  publish({ type: 'shift_open', tenant_id: tenantId, cashier_name: req.user.name || null });
  res.status(201).json(await getShiftState(tenantId, userId));
}));

// Lista de vendas no terminal: o caixista via o total do turno e acertava o
// fecho cego. Agora so abre com o PIN do dono (GET /api/sales recusa caixistas).
router.post('/sales', auth, requireRole('cashier'), asyncHandler(async (req, res) => {
  const { pin } = pinBody.parse(req.body);
  const { tenantId, userId } = req.user;
  await checkAuthorizationPin({ req, tenantId, pin, failAction: 'SALES_VIEW_PIN_FAIL', entityType: 'user', entityId: userId });
  await writeAudit({ req, tenantId, action: 'SALES_VIEWED', entityType: 'user', entityId: userId });
  const sales = await prisma.sale.findMany({
    where: { tenant_id: tenantId, cashier_user_id: userId },
    include: { items: true, payments: { select: { method: true, amount: true } } },
    orderBy: { created_at: 'desc' },
    take: 20,
  });
  // Sem custos (especificacao 4.3).
  res.json(sales.map(({ total_cost, items, ...sale }) => ({ ...sale, items: items.map(({ unit_cost_price, ...item }) => item) })));
}));

// 2.a via do recibo (30/10/2026): so de vendas do proprio caixista, com o PIN do
// dono outra vez (a lista ja o pediu) e sempre na auditoria — reimprimir um
// recibo e a forma classica de levar mercadoria duas vezes com o mesmo talao.
// Sem rede o PIN foi conferido no terminal (verificador local): o registo chega
// depois, sem PIN, marcado «sem ligação» — so escreve na auditoria, nao abre nada.
router.post('/sales/:id/reprint', auth, requireRole('cashier'), asyncHandler(async (req, res) => {
  const body = z.object({ pin: z.string().regex(/^\d{4,6}$/, 'PIN inválido').optional(), offline_at: z.string().datetime().optional() })
    .refine((x) => x.pin || x.offline_at, { message: 'PIN em falta' }).parse(req.body);
  const { tenantId, userId } = req.user;
  const sale = await prisma.sale.findFirst({ where: { id: req.params.id, tenant_id: tenantId, cashier_user_id: userId }, select: { id: true, daily_number: true, total_amount: true } });
  if (!sale) throw httpError(404, 'Venda não encontrada', 'SALE_NOT_FOUND');
  if (body.pin) await checkAuthorizationPin({ req, tenantId, pin: body.pin, failAction: 'SALES_VIEW_PIN_FAIL', entityType: 'sale', entityId: sale.id });
  await writeAudit({ req, tenantId, action: 'RECEIPT_REPRINTED', entityType: 'sale', entityId: sale.id, newValue: { daily_number: sale.daily_number, total_amount: sale.total_amount, terminal_id: req.user.tid || null, ...(body.pin ? {} : { offline_at: body.offline_at }) } });
  res.status(201).json({ ok: true });
}));

module.exports = router;
