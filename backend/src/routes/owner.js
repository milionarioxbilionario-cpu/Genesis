// Painel do dono (Genesis 2.0).
//
// Mudancas estruturais face a versao anterior:
//  - O balcao deixou de usar a sessao do dono (modo quiosque/Hub). O POS corre
//    num TERMINAL emparelhado e cada caixista entra com o seu PIN (routes/pos.js).
//    Sairam daqui: kiosk/*, operate, open-shift, verify-password,
//    cashiers/:id/verify-password, shift-state e close-shift-blind.
//  - O dono desbloqueia um caixista a partir do PROPRIO painel (ja autenticado),
//    por isso a senha do dono nunca e escrita no balcao.
//  - Validacao com zod em todas as escritas; auditoria via utils/audit.js.
//  - Horario e definicoes vivem na BD (routes/settings.js), nao num Map.
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { sendWhatsAppAlert } = require('../utils/whatsapp');
const { getTenantAlertSnapshot, buildAlertSummary } = require('../services/tenantAlerts');
const { dailyReport, weeklyReport, monthlyReport, totalReport, timeline, goalsHistory, dayRange } = require('../services/reports');
const { getShiftLock } = require('../utils/shiftLock');
const { invalidateSessionUser } = require('../utils/sessionUser');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { createPairingCode } = require('../utils/terminals');

const router = express.Router();
router.use(auth);
router.use(requireRole('owner'));

const tenantOf = (req) => req.user.tenantId;
// PIN do caixista: exactamente 4 digitos (o teclado do terminal submete ao 4.o).
const PIN = z.string().regex(/^\d{4}$/, 'O PIN tem 4 dígitos');
const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Data inválida');

// Envio de WhatsApp pela conta da plataforma: limitado e SO para o telefone da
// propria loja (antes qualquer dono enviava qualquer texto para qualquer numero
// a custa da conta Twilio do fundador).
const whatsappLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.tenantId || req.ip,
  message: { error: 'Limite de mensagens WhatsApp atingido. Tente daqui a 1 hora.', code: 'TOO_MANY_MESSAGES' },
});

// ---------------------------------------------------------------- loja
router.get('/tenant', asyncHandler(async (req, res) => {
  const t = await prisma.tenant.findUnique({ where: { id: tenantOf(req) } });
  if (!t) throw httpError(404, 'Estabelecimento não encontrado');
  res.json({
    id: t.id, name: t.name, owner_name: t.owner_name, business_type: t.business_type, location: t.location,
    phone: t.phone, email: t.email, status: t.status, trial_ends_at: t.trial_ends_at,
    subscription_price: t.subscription_price, onboarding_completed: t.onboarding_completed, created_at: t.created_at,
  });
}));

router.get('/audit', asyncHandler(async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 100, 300);
  const where = { tenant_id: tenantOf(req) };
  if (typeof req.query.action === 'string' && req.query.action) where.action = req.query.action;
  const logs = await prisma.auditLog.findMany({ where, orderBy: { created_at: 'desc' }, take, include: { user: { select: { name: true } } } });
  const parse = (v) => { try { return v ? JSON.parse(v) : null; } catch { return v; } };
  res.json(logs.map((l) => ({
    id: l.id, action: l.action, entity_type: l.entity_type, entity_id: l.entity_id,
    user_name: l.user?.name || '—', ip_address: l.ip_address, created_at: l.created_at,
    old_value: parse(l.old_value), new_value: parse(l.new_value),
  })));
}));

// ---------------------------------------------------------------- equipa: caixistas
async function ownCashier(req, id = req.params.id) {
  const c = await prisma.user.findFirst({ where: { id, tenant_id: tenantOf(req), role: 'cashier' } });
  if (!c) throw httpError(404, 'Caixista não encontrado nesta loja');
  return c;
}

router.get('/cashiers', asyncHandler(async (req, res) => {
  const tenantId = tenantOf(req);
  const cashiers = await prisma.user.findMany({ where: { tenant_id: tenantId, role: 'cashier' }, orderBy: { name: 'asc' } });
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const rows = await Promise.all(cashiers.map(async (c) => {
    const [lock, today] = await Promise.all([
      getShiftLock(prisma, tenantId, c.id),
      prisma.sale.aggregate({ where: { tenant_id: tenantId, cashier_user_id: c.id, status: 'completed', created_at: { gte: start } }, _sum: { total_amount: true }, _count: true }),
    ]);
    return {
      id: c.id, name: c.name, phone: c.phone, is_active: c.is_active, created_at: c.created_at,
      has_pin: Boolean(c.pin_hash), locked: lock.locked, attempts: lock.attempts, max_attempts: lock.maxAttempts,
      today_sales: today._count, today_revenue: Number(today._sum.total_amount || 0),
    };
  }));
  res.json(rows);
}));

// Caixistas entram no terminal com nome + PIN. Nao precisam de email nem de
// senha: a conta recebe um email interno e uma senha aleatoria inutilizavel
// (o login por email recusa o papel cashier — ver routes/auth.js).
router.post('/cashiers', asyncHandler(async (req, res) => {
  const data = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().max(20).optional().nullable(), pin: PIN }).parse(req.body);
  const user = await prisma.user.create({ data: {
    tenant_id: tenantOf(req), role: 'cashier', name: data.name, phone: data.phone || null,
    email: `caixa-${crypto.randomUUID()}@pos.genesis.local`,
    password_hash: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
    pin_hash: await bcrypt.hash(data.pin, 10), is_active: true,
  } });
  await writeAudit({ req, action: 'CREATE_CASHIER', entityType: 'user', entityId: user.id, newValue: { name: user.name } });
  res.status(201).json({ id: user.id, name: user.name, is_active: true, has_pin: true });
}));

router.put('/cashiers/:id', asyncHandler(async (req, res) => {
  const c = await ownCashier(req);
  const data = z.object({ name: z.string().trim().min(2).max(80).optional(), phone: z.string().trim().max(20).optional().nullable() }).parse(req.body);
  await prisma.user.update({ where: { id: c.id }, data });
  invalidateSessionUser(c.id);
  await writeAudit({ req, action: 'UPDATE_CASHIER', entityType: 'user', entityId: c.id, oldValue: { name: c.name, phone: c.phone }, newValue: data });
  res.json({ ok: true });
}));

// Novo PIN: tambem roda a password_hash (aleatoria) para que o claim `pv` mude
// e todas as sessoes abertas desse caixista caiam no pedido seguinte.
router.put('/cashiers/:id/pin', asyncHandler(async (req, res) => {
  const c = await ownCashier(req);
  const { pin } = z.object({ pin: PIN }).parse(req.body);
  await prisma.user.update({ where: { id: c.id }, data: {
    pin_hash: await bcrypt.hash(pin, 10),
    password_hash: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
  } });
  invalidateSessionUser(c.id);
  await writeAudit({ req, action: 'RESET_CASHIER_PIN', entityType: 'user', entityId: c.id });
  res.json({ ok: true });
}));

async function setCashierActive(req, res, active) {
  const c = await ownCashier(req);
  await prisma.user.update({ where: { id: c.id }, data: { is_active: active } });
  invalidateSessionUser(c.id); // efeito imediato na sessao aberta
  await writeAudit({ req, action: active ? 'REACTIVATE_CASHIER' : 'DEACTIVATE_CASHIER', entityType: 'user', entityId: c.id, oldValue: { is_active: c.is_active }, newValue: { is_active: active } });
  res.json({ ok: true, user: { id: c.id, name: c.name, is_active: active } });
}
router.put('/cashiers/:id/deactivate', asyncHandler((req, res) => setCashierActive(req, res, false)));
router.put('/cashiers/:id/reactivate', asyncHandler((req, res) => setCashierActive(req, res, true)));

// Desbloqueio apos 3 erros no fecho cego. Nao apaga auditoria: regista
// CASHIER_UNLOCKED e a contagem de falhas recomeca a partir dai.
router.post('/cashiers/:id/unlock', asyncHandler(async (req, res) => {
  const c = await ownCashier(req);
  await writeAudit({ req, action: 'CASHIER_UNLOCKED', entityType: 'user', entityId: c.id, newValue: { cashierName: c.name } });
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- terminais
router.get('/terminals', asyncHandler(async (req, res) => {
  const rows = await prisma.posTerminal.findMany({ where: { tenant_id: tenantOf(req) }, orderBy: { created_at: 'desc' } });
  res.json(rows.map(({ secret_hash, ...t }) => t));
}));

router.post('/terminals/pairing-code', asyncHandler(async (req, res) => {
  const { name } = z.object({ name: z.string().trim().min(2).max(60) }).parse(req.body);
  const pairing = createPairingCode({ tenantId: tenantOf(req), name, createdBy: req.user.userId });
  await writeAudit({ req, action: 'TERMINAL_PAIRING_CODE', entityType: 'terminal', newValue: { name } });
  res.status(201).json(pairing);
}));

router.post('/terminals/:id/revoke', asyncHandler(async (req, res) => {
  const t = await prisma.posTerminal.findFirst({ where: { id: req.params.id, tenant_id: tenantOf(req) } });
  if (!t) throw httpError(404, 'Terminal não encontrado');
  if (!t.revoked_at) await prisma.posTerminal.update({ where: { id: t.id }, data: { revoked_at: new Date() } });
  await writeAudit({ req, action: 'TERMINAL_REVOKED', entityType: 'terminal', entityId: t.id, newValue: { name: t.name } });
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- vendas e turnos
router.get('/sales', asyncHandler(async (req, res) => {
  const q = z.object({
    from: isoDate.optional(), to: isoDate.optional(), cashier_id: z.string().uuid().optional(),
    method: z.enum(['cash', 'mpesa', 'emola', 'card', 'mobile_money']).optional(), status: z.enum(['completed', 'cancelled']).optional(),
    page: z.coerce.number().int().min(1).default(1), page_size: z.coerce.number().int().min(1).max(100).default(25),
  }).parse(req.query);
  const where = { tenant_id: tenantOf(req) };
  if (q.from || q.to) {
    where.created_at = {};
    if (q.from) { const d = new Date(q.from); d.setHours(0, 0, 0, 0); where.created_at.gte = d; }
    if (q.to) { const d = new Date(q.to); d.setHours(23, 59, 59, 999); where.created_at.lte = d; }
  }
  if (q.cashier_id) where.cashier_user_id = q.cashier_id;
  if (q.method) where.payment_method = q.method;
  if (q.status) where.status = q.status;
  const [rows, total] = await Promise.all([
    prisma.sale.findMany({ where, include: { items: true, cashier: { select: { id: true, name: true } } }, orderBy: { created_at: 'desc' }, skip: (q.page - 1) * q.page_size, take: q.page_size }),
    prisma.sale.count({ where }),
  ]);
  res.json({ rows, total, page: q.page, page_size: q.page_size });
}));

router.get('/shift-closings', asyncHandler(async (req, res) => {
  const rows = await prisma.shiftClosing.findMany({
    where: { tenant_id: tenantOf(req) }, include: { cashier: { select: { name: true } } }, orderBy: { closed_at: 'desc' }, take: 100,
  });
  res.json(rows.map((r) => ({ ...r, cashier_name: r.cashier?.name || '—' })));
}));

// ---------------------------------------------------------------- trabalhadores
const employeeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(60),
  monthly_salary: z.number().int().nonnegative(), // centavos
  phone: z.string().trim().max(20).optional().nullable(),
  start_date: isoDate.optional().nullable(),
  is_active: z.boolean().optional(),
});

router.get('/employees', asyncHandler(async (req, res) => {
  res.json(await prisma.employee.findMany({ where: { tenant_id: tenantOf(req) }, orderBy: [{ is_active: 'desc' }, { name: 'asc' }] }));
}));

router.get('/payroll', asyncHandler(async (req, res) => {
  const employees = await prisma.employee.findMany({ where: { tenant_id: tenantOf(req), is_active: true }, orderBy: { name: 'asc' } });
  const monthlyTotal = employees.reduce((s, e) => s + e.monthly_salary, 0);
  res.json({ employeeCount: employees.length, monthlyTotal, averageSalary: employees.length ? Math.round(monthlyTotal / employees.length) : 0, employees });
}));

router.post('/employees', asyncHandler(async (req, res) => {
  const d = employeeSchema.parse(req.body);
  const e = await prisma.employee.create({ data: {
    tenant_id: tenantOf(req), name: d.name, role: d.role, monthly_salary: d.monthly_salary, phone: d.phone || null,
    start_date: d.start_date ? new Date(d.start_date) : new Date(), is_active: d.is_active ?? true,
  } });
  await writeAudit({ req, action: 'CREATE_EMPLOYEE', entityType: 'employee', entityId: e.id, newValue: { name: e.name, monthly_salary: e.monthly_salary } });
  res.status(201).json(e);
}));

router.put('/employees/:id', asyncHandler(async (req, res) => {
  const before = await prisma.employee.findFirst({ where: { id: req.params.id, tenant_id: tenantOf(req) } });
  if (!before) throw httpError(404, 'Trabalhador não encontrado');
  const d = employeeSchema.partial().parse(req.body);
  const e = await prisma.employee.update({ where: { id: before.id }, data: { ...d, start_date: d.start_date ? new Date(d.start_date) : undefined } });
  await writeAudit({ req, action: 'UPDATE_EMPLOYEE', entityType: 'employee', entityId: e.id, oldValue: { monthly_salary: before.monthly_salary, is_active: before.is_active }, newValue: d });
  res.json(e);
}));

// ---------------------------------------------------------------- chenecas
// Estado pela DATA (nao pela hora): no proprio dia do vencimento ainda nao
// esta vencida (antes ficava "overdue" logo as 00:00 do dia limite).
function debtStatus(debt) {
  const remaining = debt.total_amount - debt.amount_paid;
  if (remaining <= 0) return 'paid';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(debt.due_date); due.setHours(0, 0, 0, 0);
  if (due < today) return 'overdue';
  return debt.amount_paid > 0 ? 'partially_paid' : 'active';
}

router.get('/debts', asyncHandler(async (req, res) => {
  const debts = await prisma.debt.findMany({ where: { tenant_id: tenantOf(req) }, orderBy: { due_date: 'asc' }, include: { payments: { orderBy: { paid_at: 'desc' } } } });
  res.json(debts.map((d) => ({ ...d, status: debtStatus(d), remaining: d.total_amount - d.amount_paid })));
}));

router.post('/debts', asyncHandler(async (req, res) => {
  const d = z.object({
    debtor_name: z.string().trim().min(2).max(80),
    debtor_phone: z.string().trim().min(8).max(20),
    total_amount: z.number().int().positive(), // centavos
    due_date: isoDate,
    notes: z.string().trim().max(200).optional(),
  }).parse(req.body);
  const debt = await prisma.debt.create({ data: {
    tenant_id: tenantOf(req), debtor_name: d.debtor_name, debtor_phone: d.debtor_phone, total_amount: d.total_amount,
    amount_paid: 0, due_date: new Date(d.due_date), status: 'active', created_by: req.user.userId,
  } });
  await writeAudit({ req, action: 'CREATE_DEBT', entityType: 'debt', entityId: debt.id, newValue: { debtor_name: d.debtor_name, total_amount: d.total_amount } });
  res.status(201).json({ ...debt, status: debtStatus(debt), remaining: debt.total_amount });
}));

router.post('/debts/:id/payment', asyncHandler(async (req, res) => {
  const { amount } = z.object({ amount: z.number().int().positive() }).parse(req.body);
  const tenantId = tenantOf(req);
  const updated = await prisma.$transaction(async (tx) => {
    const debt = await tx.debt.findFirst({ where: { id: req.params.id, tenant_id: tenantId } });
    if (!debt) throw httpError(404, 'Cheneca não encontrada');
    if (debt.amount_paid + amount > debt.total_amount) throw httpError(400, 'Pagamento superior ao valor em falta.');
    const next = await tx.debt.update({ where: { id: debt.id }, data: {
      amount_paid: { increment: amount }, status: debtStatus({ ...debt, amount_paid: debt.amount_paid + amount }),
    } });
    await tx.debtPayment.create({ data: { debt_id: debt.id, amount, recorded_by: req.user.userId } });
    await writeAudit({ db: tx, req, action: 'DEBT_PAYMENT', entityType: 'debt', entityId: debt.id, newValue: { amount } });
    return next;
  });
  res.json({ ok: true, debt: { ...updated, status: debtStatus(updated), remaining: updated.total_amount - updated.amount_paid } });
}));

// ---------------------------------------------------------------- metas
router.get('/goals/current', asyncHandler(async (req, res) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [goal, agg] = await Promise.all([
    prisma.saleGoal.findFirst({ where: { tenant_id: tenantOf(req), month, year }, orderBy: { created_at: 'desc' } }),
    // So vendas concluidas (antes contava as canceladas).
    prisma.sale.aggregate({ where: { tenant_id: tenantOf(req), status: 'completed', created_at: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59, 999) } }, _sum: { total_amount: true } }),
  ]);
  const current = Number(agg._sum.total_amount || 0);
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = now.getDate();
  // Projeccao linear pelo ritmo actual (especificacao 6.8).
  const projected = Math.round((current / day) * daysInMonth);
  const target = goal?.target_amount || 0;
  const dailyPace = current / day;
  const reachDay = target > 0 && dailyPace > 0 ? Math.ceil(target / dailyPace) : null;
  res.json({
    target, current, projected, month, year, has_goal: Boolean(goal),
    pct: target > 0 ? Math.round((current / target) * 1000) / 10 : 0,
    reach_day: reachDay && reachDay <= daysInMonth ? reachDay : null,
  });
}));

router.post('/goals', asyncHandler(async (req, res) => {
  const { target_amount } = z.object({ target_amount: z.number().int().positive() }).parse(req.body);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const existing = await prisma.saleGoal.findFirst({ where: { tenant_id: tenantOf(req), month, year } });
  const goal = existing
    ? await prisma.saleGoal.update({ where: { id: existing.id }, data: { target_amount } })
    : await prisma.saleGoal.create({ data: { tenant_id: tenantOf(req), month, year, target_amount } });
  await writeAudit({ req, action: 'SET_GOAL', entityType: 'sale_goal', entityId: goal.id, oldValue: existing ? { target_amount: existing.target_amount } : null, newValue: { target_amount } });
  res.status(201).json(goal);
}));

// ---------------------------------------------------------------- relatorios
router.get('/reports/daily', asyncHandler(async (req, res) => {
  res.json(await dailyReport(tenantOf(req), typeof req.query.date === 'string' ? req.query.date : undefined));
}));
router.get('/reports/weekly', asyncHandler(async (req, res) => {
  res.json(await weeklyReport(tenantOf(req), req.query.start, req.query.end));
}));
router.get('/reports/monthly', asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;
  if (month < 1 || month > 12) throw httpError(400, 'Mês inválido');
  res.json(await monthlyReport(tenantOf(req), year, month));
}));
// Rastreio de tudo o que aconteceu no periodo (paginado; filtro por tipo).
router.get('/reports/timeline', asyncHandler(async (req, res) => {
  const q = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    types: z.string().optional(), page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(200).default(50),
  }).parse(req.query);
  const start = dayRange(q.from).start; const end = dayRange(q.to).end;
  if (end < start) throw httpError(400, 'Intervalo de datas inválido', 'BAD_RANGE');
  if (end - start > 92 * 86400000) throw httpError(400, 'Máximo de 3 meses por rastreio', 'RANGE_TOO_LARGE');
  const types = q.types ? q.types.split(',').filter(Boolean) : undefined;
  res.json(await timeline(tenantOf(req), start, end, { ...(types ? { types } : {}), page: q.page, pageSize: q.page_size }));
}));

// Metas dos ultimos 12 meses (meta, atingido, %).
router.get('/goals/history', asyncHandler(async (req, res) => {
  res.json(await goalsHistory(tenantOf(req), 12));
}));

router.get('/reports/total', asyncHandler(async (req, res) => {
  res.json(await totalReport(tenantOf(req)));
}));

// ---------------------------------------------------------------- alertas
router.get('/alerts', asyncHandler(async (req, res) => {
  const snapshot = await getTenantAlertSnapshot(tenantOf(req));
  const level = (p) => (p.stock_qty <= 10 ? 'critical' : p.stock_qty <= 20 ? 'severe' : 'low');
  res.json({
    lowStockProducts: snapshot.lowStockProducts.map((p) => ({ ...p, level: level(p) })),
    expiringLots: snapshot.expiringLots,
    expiredProducts: snapshot.expiredProducts,
    alertDays: snapshot.alert_days,
    totalAlerts: snapshot.totalAlerts,
  });
}));

router.post('/alerts/send', whatsappLimiter, asyncHandler(async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantOf(req) } });
  if (!tenant?.phone) throw httpError(400, 'A loja não tem telefone configurado.');
  const snapshot = await getTenantAlertSnapshot(tenant.id);
  if (!snapshot.totalAlerts) return res.json({ ok: true, sent: 0, message: 'Sem alertas para enviar.' });
  const summary = buildAlertSummary(tenant, snapshot);
  const result = await sendWhatsAppAlert({ to: tenant.phone, message: summary, tenantName: tenant.name });
  await writeAudit({ req, action: 'WHATSAPP_ALERTS_SENT', entityType: 'tenant', entityId: tenant.id, newValue: { alerts: snapshot.totalAlerts } });
  res.json({ ok: true, sent: snapshot.totalAlerts, ...result });
}));

// Mensagem de teste: so para o telefone da propria loja, texto fixo.
router.post('/whatsapp/test', whatsappLimiter, asyncHandler(async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantOf(req) } });
  if (!tenant?.phone) throw httpError(400, 'A loja não tem telefone configurado.');
  const result = await sendWhatsAppAlert({ to: tenant.phone, message: `Genesis: teste de ligação WhatsApp da loja ${tenant.name}.`, tenantName: tenant.name });
  res.json({ ok: result.ok ?? false, ...result });
}));

module.exports = router;
