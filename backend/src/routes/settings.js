// Definicoes da loja (Genesis 2.0) — so o dono.
//
// Antes: o horario vivia num Map em memoria (perdia-se a cada reinicio) e NAO
// existia forma nenhuma de registar custos fixos — o relatorio mensal deduzia
// sempre renda 0, por mais que o dono pagasse. O PIN de autorizacao podia ser
// trocado sem confirmar a identidade.
const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');

const router = express.Router();
router.use(auth, requireRole('owner'));

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const FIXED_COST_TYPES = ['rent', 'utilities', 'transport', 'other'];

const storeSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  email: z.string().trim().email().optional().nullable(),
});
const hoursSchema = z.object({
  opening_time: z.string().regex(HHMM, 'Hora no formato HH:MM'),
  closing_time: z.string().regex(HHMM, 'Hora no formato HH:MM'),
});
const discountSchema = z.object({ discount_free_pct: z.number().int().min(0).max(100) });
const monthCloseSchema = z.object({ month_close_day: z.number().int().min(1, 'entre 1 e 28').max(28, 'entre 1 e 28') });
const expiryAlertSchema = z.object({ expiry_alert_days: z.number().int().min(1, 'mínimo 1 dia').max(90, 'máximo 90 dias') });
const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'O PIN tem 4 a 6 dígitos'),
  owner_password: z.string().min(1, 'Confirme com a sua senha'),
});
const fixedCostSchema = z.object({
  description: z.string().trim().min(2).max(120),
  amount: z.number().int().positive(), // centavos
  type: z.enum(FIXED_COST_TYPES),
});

const tenantId = (req) => req.user.tenantId;

router.get('/', asyncHandler(async (req, res) => {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId(req) } });
  if (!t) throw httpError(404, 'Loja não encontrada');
  const fixed = await prisma.fixedCost.findMany({ where: { tenant_id: t.id }, orderBy: { description: 'asc' } });
  res.json({
    store: { name: t.name, location: t.location, phone: t.phone, email: t.email, business_type: t.business_type },
    hours: { opening_time: t.opening_time || '08:00', closing_time: t.closing_time || '20:00' },
    discount_free_pct: t.discount_free_pct,
    expiry_alert_days: t.expiry_alert_days,
    month_close_day: t.month_close_day,
    authorization_pin_configured: Boolean(t.cancel_pin_hash),
    status: t.status,
    trial_ends_at: t.trial_ends_at,
    fixed_costs: fixed,
    fixed_costs_monthly_total: fixed.reduce((s, c) => s + c.amount, 0),
  });
}));

router.put('/store', asyncHandler(async (req, res) => {
  const data = storeSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { name: true, location: true, phone: true, email: true } });
  const t = await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_STORE', entityType: 'tenant', entityId: t.id, oldValue: before, newValue: data });
  res.json({ ok: true });
}));

router.put('/hours', asyncHandler(async (req, res) => {
  const data = hoursSchema.parse(req.body);
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_HOURS', entityType: 'tenant', entityId: tenantId(req), newValue: data });
  res.json({ ok: true, ...data });
}));

router.put('/discount', asyncHandler(async (req, res) => {
  const data = discountSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { discount_free_pct: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_DISCOUNT_POLICY', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: data });
  res.json({ ok: true, ...data });
}));

// Quantos dias antes da validade um lote aparece nos alertas.
router.put('/expiry-alert', asyncHandler(async (req, res) => {
  const data = expiryAlertSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { expiry_alert_days: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_EXPIRY_ALERT', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: data });
  res.json({ ok: true, ...data });
}));

// Dia do mes em que o Genesis mostra o fecho do mes anterior (1-28: existe
// em todos os meses).
router.put('/month-close', asyncHandler(async (req, res) => {
  const data = monthCloseSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { month_close_day: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_MONTH_CLOSE_DAY', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: data });
  res.json({ ok: true, ...data });
}));

// PIN de autorizacao (cancelamentos e descontos acima do limite). Trocar o PIN
// exige a senha do dono: uma sessao aberta esquecida nao chega.
router.put('/authorization-pin', asyncHandler(async (req, res) => {
  const { pin, owner_password } = pinSchema.parse(req.body);
  const me = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!me || !(await bcrypt.compare(owner_password, me.password_hash))) {
    await writeAudit({ req, action: 'AUTH_PIN_CHANGE_FAIL', entityType: 'tenant', entityId: tenantId(req) });
    throw httpError(401, 'Senha do dono incorrecta', 'BAD_PASSWORD');
  }
  await prisma.tenant.update({ where: { id: tenantId(req) }, data: { cancel_pin_hash: await bcrypt.hash(pin, 10) } });
  await writeAudit({ req, action: 'AUTH_PIN_CHANGED', entityType: 'tenant', entityId: tenantId(req) });
  res.json({ ok: true, configured: true });
}));

router.get('/fixed-costs', asyncHandler(async (req, res) => {
  res.json(await prisma.fixedCost.findMany({ where: { tenant_id: tenantId(req) }, orderBy: { description: 'asc' } }));
}));

router.post('/fixed-costs', asyncHandler(async (req, res) => {
  const data = fixedCostSchema.parse(req.body);
  const cost = await prisma.fixedCost.create({ data: { ...data, tenant_id: tenantId(req) } });
  await writeAudit({ req, action: 'CREATE_FIXED_COST', entityType: 'fixed_cost', entityId: cost.id, newValue: data });
  res.status(201).json(cost);
}));

async function ownFixedCost(req) {
  const cost = await prisma.fixedCost.findFirst({ where: { id: req.params.id, tenant_id: tenantId(req) } });
  if (!cost) throw httpError(404, 'Custo fixo não encontrado');
  return cost;
}

router.put('/fixed-costs/:id', asyncHandler(async (req, res) => {
  const before = await ownFixedCost(req);
  const data = fixedCostSchema.parse(req.body);
  const cost = await prisma.fixedCost.update({ where: { id: before.id }, data });
  await writeAudit({ req, action: 'UPDATE_FIXED_COST', entityType: 'fixed_cost', entityId: cost.id, oldValue: before, newValue: data });
  res.json(cost);
}));

router.delete('/fixed-costs/:id', asyncHandler(async (req, res) => {
  const before = await ownFixedCost(req);
  await prisma.fixedCost.delete({ where: { id: before.id } });
  await writeAudit({ req, action: 'DELETE_FIXED_COST', entityType: 'fixed_cost', entityId: before.id, oldValue: before });
  res.json({ ok: true });
}));

// ------------------------------------------------------- despesas avulsas
// Gastos do dia a dia (limpeza, transporte do stock, luz...), alem dos custos
// fixos. Entram no lucro liquido do mes em que foram pagos. As categorias
// sugeridas aparecem no ecra, mas o dono pode escrever outra.
const EXPENSE_CATEGORIES = ['Limpeza', 'Transporte do stock', 'Software', 'Luz', 'Água', 'Manutenção', 'Outros'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const expenseSchema = z.object({
  date: z.string().regex(DAY, 'Data no formato AAAA-MM-DD'),
  category: z.string().trim().min(2, 'Escolha ou escreva a categoria').max(40),
  description: z.string().trim().max(160).optional().default(''),
  amount: z.number().int().positive(), // centavos
});
const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

// Meio-dia (hora do servidor) do dia escolhido: fica dentro do dia e do mes
// que os relatorios usam, seja qual for o fuso de quem le.
function expenseDate(day) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime()) || date.getDate() !== d) throw httpError(400, 'Data inválida', 'BAD_DATE');
  if (day > todayKey()) throw httpError(400, 'A data da despesa não pode ser no futuro', 'FUTURE_DATE');
  return date;
}

router.get('/expenses', asyncHandler(async (req, res) => {
  const now = new Date();
  const q = z.object({
    year: z.coerce.number().int().min(2020).max(2100).default(now.getFullYear()),
    month: z.coerce.number().int().min(1).max(12).default(now.getMonth() + 1),
  }).parse(req.query);
  const start = new Date(q.year, q.month - 1, 1, 0, 0, 0, 0);
  const end = new Date(q.year, q.month, 0, 23, 59, 59, 999);
  const rows = await prisma.expense.findMany({ where: { tenant_id: tenantId(req), date: { gte: start, lte: end } }, orderBy: [{ date: 'desc' }, { created_at: 'desc' }] });
  const byCategory = {};
  for (const e of rows) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  res.json({
    year: q.year, month: q.month, rows,
    total: rows.reduce((s, e) => s + e.amount, 0),
    by_category: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    categories: EXPENSE_CATEGORIES,
  });
}));

router.post('/expenses', asyncHandler(async (req, res) => {
  const data = expenseSchema.parse(req.body);
  const expense = await prisma.expense.create({
    data: { tenant_id: tenantId(req), date: expenseDate(data.date), category: data.category, description: data.description, amount: data.amount, created_by: req.user.userId },
  });
  await writeAudit({ req, action: 'CREATE_EXPENSE', entityType: 'expense', entityId: expense.id, newValue: data });
  res.status(201).json(expense);
}));

async function ownExpense(req) {
  const expense = await prisma.expense.findFirst({ where: { id: req.params.id, tenant_id: tenantId(req) } });
  if (!expense) throw httpError(404, 'Despesa não encontrada');
  return expense;
}

router.put('/expenses/:id', asyncHandler(async (req, res) => {
  const before = await ownExpense(req);
  const data = expenseSchema.parse(req.body);
  const expense = await prisma.expense.update({
    where: { id: before.id },
    data: { date: expenseDate(data.date), category: data.category, description: data.description, amount: data.amount },
  });
  await writeAudit({ req, action: 'UPDATE_EXPENSE', entityType: 'expense', entityId: expense.id, oldValue: before, newValue: data });
  res.json(expense);
}));

router.delete('/expenses/:id', asyncHandler(async (req, res) => {
  const before = await ownExpense(req);
  await prisma.expense.delete({ where: { id: before.id } });
  await writeAudit({ req, action: 'DELETE_EXPENSE', entityType: 'expense', entityId: before.id, oldValue: before });
  res.json({ ok: true });
}));

module.exports = router;
module.exports.FIXED_COST_TYPES = FIXED_COST_TYPES;
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
