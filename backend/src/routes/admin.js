// Painel do Super Admin (Genesis 2.0). Montado em index.js atras de
// adminOriginCheck + authMiddleware + requireRole('super_admin').
//
// Correccoes face a versao anterior:
//  - TODAS as rotas passam por asyncHandler: antes a maioria era async sem
//    try/catch e um erro (ex.: rejeitar uma loja ja apagada) terminava o
//    processo Node — todas as lojas ficavam sem servidor.
//  - Aprovar/rejeitar so funciona em pedidos `pending` (antes aprovar uma loja
//    activa criava um segundo dono e reiniciava o trial).
//  - Reactivar repoe o estado ANTERIOR a suspensao (antes passava um trial a
//    `active` — subscricao gratis).
//  - "Impersonar" deixou de emitir uma sessao completa de dono: gera um codigo
//    de uso unico para o MODO SUPORTE (so leitura), aberto no frontend da loja.
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { invalidateSessionUser } = require('../utils/sessionUser');
const { clearTenantStatusCache } = require('../utils/tenantStatus');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { createSupportCode } = require('../utils/supportCodes');

const router = express.Router();
const APP_URL = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

const audit = (req, action, tenantId, oldValue, newValue) =>
  writeAudit({ req, tenantId: null, action, entityType: 'tenant', entityId: tenantId, oldValue, newValue });

async function findTenant(id) {
  const t = await prisma.tenant.findUnique({ where: { id } });
  if (!t) throw httpError(404, 'Loja não encontrada');
  return t;
}

// Mudar o estado de uma loja tem efeito imediato nas sessoes abertas.
function afterStatusChange() {
  clearTenantStatusCache();
  invalidateSessionUser();
}

const parseJson = (v) => { try { return v ? JSON.parse(v) : null; } catch { return v; } };

router.get('/audit', asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { created_at: 'desc' }, take: 200, include: { user: { select: { name: true, email: true } }, tenant: { select: { name: true } } } });
  res.json(logs.map((l) => ({
    id: l.id, action: l.action, entity_type: l.entity_type, entity_id: l.entity_id, tenant_id: l.tenant_id,
    tenant_name: l.tenant?.name || null, user_name: l.user?.name || '—', user_email: l.user?.email || null,
    ip_address: l.ip_address, created_at: l.created_at, old_value: parseJson(l.old_value), new_value: parseJson(l.new_value),
  })));
}));

// Metricas globais da plataforma (especificacao 4.1).
router.get('/overview', asyncHandler(async (req, res) => {
  const tenants = await prisma.tenant.findMany({ select: { id: true, status: true, subscription_price: true, created_at: true, trial_ends_at: true } });
  const count = (st) => tenants.filter((t) => t.status === st).length;
  const in7days = new Date(Date.now() + 7 * 86400000);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const growth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); d.setHours(0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    growth.push({ month: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), total: tenants.filter((t) => t.created_at < end && t.status !== 'pending' && t.status !== 'rejected').length });
  }
  res.json({
    active: count('active'), trial: count('trial'), suspended: count('suspended'), blocked: count('blocked'), pending: count('pending'),
    mrr: tenants.filter((t) => t.status === 'active').reduce((s, t) => s + (t.subscription_price || 0), 0),
    trials_ending_soon: tenants.filter((t) => t.status === 'trial' && t.trial_ends_at && t.trial_ends_at < in7days).length,
    new_this_month: tenants.filter((t) => t.created_at >= monthStart).length,
    growth,
  });
}));

router.get('/requests', asyncHandler(async (req, res) => {
  res.json(await prisma.tenant.findMany({ where: { status: 'pending' }, orderBy: { created_at: 'desc' } }));
}));

router.get('/tenants', asyncHandler(async (req, res) => {
  const tenants = await prisma.tenant.findMany({ orderBy: { created_at: 'desc' } });
  const since = new Date(Date.now() - 30 * 86400000);
  const activity = await prisma.sale.groupBy({ by: ['tenant_id'], where: { created_at: { gte: since }, status: 'completed' }, _count: true, _sum: { total_amount: true } });
  const act = new Map(activity.map((a) => [a.tenant_id, a]));
  res.json(tenants.map(({ cancel_pin_hash, ...t }) => ({
    ...t,
    sales_30d: act.get(t.id)?._count || 0,
    revenue_30d: Number(act.get(t.id)?._sum.total_amount || 0),
  })));
}));

router.get('/tenants/:tenantId', asyncHandler(async (req, res) => {
  const { cancel_pin_hash, ...t } = await findTenant(req.params.tenantId);
  const [users, products, sales] = await Promise.all([
    prisma.user.findMany({ where: { tenant_id: t.id }, select: { id: true, name: true, email: true, role: true, is_active: true, created_at: true } }),
    prisma.product.count({ where: { tenant_id: t.id } }),
    prisma.sale.aggregate({ where: { tenant_id: t.id, status: 'completed' }, _count: true, _sum: { total_amount: true } }),
  ]);
  res.json({ ...t, users: users.map((u) => (u.role === 'cashier' ? { ...u, email: null } : u)), products_count: products, sales_count: sales._count, revenue_total: Number(sales._sum.total_amount || 0) });
}));

router.post('/requests/:tenantId/approve', asyncHandler(async (req, res) => {
  const tenant = await findTenant(req.params.tenantId);
  if (tenant.status !== 'pending') throw httpError(409, 'Só pedidos pendentes podem ser aprovados (estado actual: ' + tenant.status + ')', 'NOT_PENDING');
  const tempPassword = crypto.randomBytes(9).toString('base64url');
  const trialEnds = new Date(); trialEnds.setDate(trialEnds.getDate() + 30);
  const ownerEmail = (tenant.email || `${tenant.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@genesis.co.mz`).toLowerCase();
  // Email do pedido ja com conta: antes era inventado um <nome>.<hora>@... que
  // o dono nao conhecia (e o login Google com o email dele nunca acertava).
  // Agora o pedido fica pendente e o admin resolve com a pessoa.
  if (await prisma.user.findUnique({ where: { email: ownerEmail } })) {
    throw httpError(409, `O email ${ownerEmail} já tem uma conta no Genesis. Peça outro email ao dono ou rejeite o pedido.`, 'EMAIL_IN_USE');
  }
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await prisma.$transaction([
    prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'trial', trial_ends_at: trialEnds } }),
    prisma.user.create({ data: { tenant_id: tenant.id, role: 'owner', name: tenant.owner_name, email: ownerEmail, password_hash: passwordHash, phone: tenant.phone, is_active: true } }),
  ]);
  await audit(req, 'APPROVE_TENANT', tenant.id, { status: tenant.status }, { status: 'trial', trial_ends_at: trialEnds, owner_email: ownerEmail });
  afterStatusChange();
  res.json({ email: ownerEmail, temporaryPassword: tempPassword, trial_ends_at: trialEnds });
}));

router.post('/requests/:tenantId/reject', asyncHandler(async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().min(3, 'Indique o motivo') }).parse(req.body);
  const tenant = await findTenant(req.params.tenantId);
  if (tenant.status !== 'pending') throw httpError(409, 'Só pedidos pendentes podem ser rejeitados', 'NOT_PENDING');
  await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'rejected' } });
  await audit(req, 'REJECT_TENANT', tenant.id, { status: tenant.status }, { status: 'rejected', reason });
  res.json({ message: 'Pedido rejeitado' });
}));

// Suspender/bloquear guardam o estado anterior na auditoria; reactivar repoe-no.
async function previousStatus(tenantId) {
  const last = await prisma.auditLog.findFirst({
    where: { entity_type: 'tenant', entity_id: tenantId, action: { in: ['SUSPEND_TENANT', 'BLOCK_TENANT', 'DELETE_TENANT'] } },
    orderBy: { created_at: 'desc' },
  });
  const prev = parseJson(last?.old_value)?.status;
  return ['trial', 'active'].includes(prev) ? prev : 'active';
}

async function setTenantStatus(req, res, { action, to, ownersActive, allUsers = false, reason }) {
  const tenant = await findTenant(req.params.tenantId);
  const status = to === 'previous' ? await previousStatus(tenant.id) : to;
  await prisma.tenant.update({ where: { id: tenant.id }, data: { status } });
  if (ownersActive !== undefined) {
    await prisma.user.updateMany({ where: { tenant_id: tenant.id, ...(allUsers ? {} : { role: 'owner' }) }, data: { is_active: ownersActive } });
  }
  await audit(req, action, tenant.id, { status: tenant.status }, { status, ...(reason ? { reason } : {}) });
  afterStatusChange();
  res.json({ ok: true, status });
}

router.post('/tenants/:tenantId/suspend', asyncHandler((req, res) => setTenantStatus(req, res, { action: 'SUSPEND_TENANT', to: 'suspended' })));
router.post('/tenants/:tenantId/unsuspend', asyncHandler((req, res) => setTenantStatus(req, res, { action: 'UNSUSPEND_TENANT', to: 'previous' })));
router.post('/tenants/:tenantId/block', asyncHandler((req, res) => setTenantStatus(req, res, { action: 'BLOCK_TENANT', to: 'blocked', reason: (req.body && req.body.reason) || 'Sem motivo informado' })));
router.post('/tenants/:tenantId/unblock', asyncHandler((req, res) => setTenantStatus(req, res, { action: 'UNBLOCK_TENANT', to: 'previous' })));
router.post('/tenants/:tenantId/delete', asyncHandler((req, res) => setTenantStatus(req, res, { action: 'DELETE_TENANT', to: 'deleted', ownersActive: false, allUsers: true })));
// Recuperar uma loja eliminada reactiva TODAS as contas (antes so os donos:
// os caixistas ficavam desactivados para sempre).
router.post('/tenants/:tenantId/restore', asyncHandler((req, res) => setTenantStatus(req, res, { action: 'RESTORE_TENANT', to: 'previous', ownersActive: true, allUsers: true })));

router.post('/tenants/:tenantId/extend-trial', asyncHandler(async (req, res) => {
  const { days } = z.object({ days: z.number().int().min(1).max(90) }).parse(req.body);
  const tenant = await findTenant(req.params.tenantId);
  if (tenant.status !== 'trial') throw httpError(409, 'A loja não está em período de teste');
  const base = tenant.trial_ends_at && tenant.trial_ends_at > new Date() ? new Date(tenant.trial_ends_at) : new Date();
  base.setDate(base.getDate() + days);
  await prisma.tenant.update({ where: { id: tenant.id }, data: { trial_ends_at: base } });
  await audit(req, 'EXTEND_TRIAL', tenant.id, { trial_ends_at: tenant.trial_ends_at }, { trial_ends_at: base });
  afterStatusChange();
  res.json({ ok: true, trial_ends_at: base });
}));

router.post('/tenants/:tenantId/activate', asyncHandler((req, res) => setTenantStatus(req, res, { action: 'ACTIVATE_SUBSCRIPTION', to: 'active' })));

// Modo suporte (so leitura): codigo de uso unico valido 60 s.
router.post('/tenants/:tenantId/support', asyncHandler(async (req, res) => {
  const tenant = await findTenant(req.params.tenantId);
  const owner = await prisma.user.findFirst({ where: { tenant_id: tenant.id, role: 'owner' }, orderBy: { created_at: 'asc' } });
  if (!owner) throw httpError(404, 'Esta loja ainda não tem dono');
  const code = createSupportCode({ ownerUserId: owner.id, tenantId: tenant.id, adminUserId: req.user.userId });
  await audit(req, 'SUPPORT_CODE_ISSUED', tenant.id, null, { owner: owner.id });
  res.json({ url: `${APP_URL()}/suporte#${code}` });
}));

module.exports = router;
