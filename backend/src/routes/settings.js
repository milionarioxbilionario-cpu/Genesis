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

module.exports = router;
module.exports.FIXED_COST_TYPES = FIXED_COST_TYPES;
