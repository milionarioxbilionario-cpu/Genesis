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
const { iconSchema } = require('../utils/productIcons');
const { nameKey, groupSuggestions } = require('../utils/catalogSuggestions');
const { groupLostRequests } = require('../utils/lostRequests');
const { PLANS, PERIODS, effectivePlan } = require('../services/plans');
const { BUSINESS_TYPES } = require('../utils/businessTypes');
const { openStream, publish } = require('../utils/liveBus');
const { invalidateActing } = require('../utils/actingTenant');
const ADMIN_LIVE = new Set(['sale', 'cancel', 'loss', 'debt', 'debt_payment', 'expense', 'stock_in', 'shift_open', 'shift_close', 'shift_fail', 'subscription']);

const router = express.Router();
const APP_URL = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

const audit = (req, action, tenantId, oldValue, newValue) =>
  writeAudit({ req, tenantId: null, action, entityType: 'tenant', entityId: tenantId, oldValue, newValue });

async function findTenant(id) {
  const t = await prisma.tenant.findUnique({ where: { id } });
  if (!t) throw httpError(404, 'Estabelecimento não encontrado');
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
// Etapa C: mapa ao vivo. Estabelecimentos com ponto no mapa + vendas de hoje (dia de Maputo).
const MAP_STATUSES = ['active', 'trial', 'suspended'];
const maputoTodayStart = () => new Date(new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10) + 'T00:00:00+02:00');
router.get('/map', asyncHandler(async (req, res) => {
  const tenants = await prisma.tenant.findMany({ where: { status: { in: MAP_STATUSES } }, select: { id: true, name: true, business_type: true, status: true, plan: true, location: true, lat: true, lng: true } });
  const since = maputoTodayStart();
  const sums = await prisma.sale.groupBy({ by: ['tenant_id'], where: { status: 'completed', created_at: { gte: since } }, _sum: { total_amount: true }, _count: true });
  const byId = new Map(sums.map((s) => [s.tenant_id, s]));
  res.json({
    points: tenants.filter((t) => t.lat != null && t.lng != null).map((t) => ({
      id: t.id, name: t.name, business_type: t.business_type, status: t.status, plan: t.plan, place: t.location, lat: t.lat, lng: t.lng,
      today_total: Number(byId.get(t.id)?._sum.total_amount || 0), today_count: byId.get(t.id)?._count || 0,
    })),
    without_location: tenants.filter((t) => t.lat == null || t.lng == null).map((t) => ({ id: t.id, name: t.name, place: t.location })),
  });
}));

// Etapa C: acontecimentos de todos os estabelecimentos (sem lucros nem caixistas).
let mapCache = { at: 0, byId: new Map() };
async function mapInfo(id) {
  if (Date.now() - mapCache.at > 60000 || !mapCache.byId.has(id)) {
    const rows = await prisma.tenant.findMany({ where: { status: { in: MAP_STATUSES } }, select: { id: true, name: true, lat: true, lng: true } });
    mapCache = { at: Date.now(), byId: new Map(rows.map((r) => [r.id, r])) };
  }
  return mapCache.byId.get(id) || null;
}
router.get('/live', (req, res) => {
  openStream(req, res, {
    // 31/10: o mapa mostra tambem perdas, txenekas, despesas, compras, turnos e subscricoes
    // — sem lucros dos estabelecimentos, sem nomes de pessoas nem valores do fecho.
    filter: (e) => ADMIN_LIVE.has(e.type),
    // Nome e ponto vem da cache (refeita a cada minuto). Loja que ainda nao esta
    // na cache: o evento vai sem ponto (o painel actualiza a lista) e a cache refaz-se.
    shape: (e) => {
      const t = mapCache.byId.get(e.tenant_id);
      if (!t) mapInfo(e.tenant_id).catch(() => {});
      return { type: e.type, tenant_id: e.tenant_id, name: t?.name || null, lat: t?.lat ?? null, lng: t?.lng ?? null, total: e.type.startsWith('shift_') ? null : (e.total ?? null), at: e.at };
    },
  });
  mapInfo('').catch(() => {});
});

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
    catalog_suggestions: await prisma.catalogSuggestion.count({ where: { status: 'pending' } }),
    lost_requests_30d: await prisma.demandCapture.count({ where: { product_id: null, requested_at: { gte: new Date(Date.now() - 30 * 86400000) } } }),
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
  // O logotipo (ate 300 KB por loja) nao vai na lista: so has_logo.
  res.json(tenants.map(({ cancel_pin_hash, logo_data, ...t }) => ({
    ...t,
    has_logo: Boolean(logo_data),
    plan_effective: effectivePlan(t),
    sales_30d: act.get(t.id)?._count || 0,
    revenue_30d: Number(act.get(t.id)?._sum.total_amount || 0),
  })));
}));

router.get('/tenants/:tenantId', asyncHandler(async (req, res) => {
  const { cancel_pin_hash, logo_data, ...rest } = await findTenant(req.params.tenantId);
  const t = { ...rest, has_logo: Boolean(logo_data), plan_effective: effectivePlan(rest) };
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
  // Pedido antigo sem email: ja nao se inventa <loja>@genesis.co.mz (dominio
  // que nao e nosso; o codigo de recuperacao nunca lhe chegava).
  if (!tenant.email || !tenant.email.trim()) {
    throw httpError(409, 'Este pedido não tem email. Rejeite-o e peça ao dono um novo pedido com email.', 'EMAIL_REQUIRED');
  }
  const ownerEmail = tenant.email.trim().toLowerCase();
  // Email do pedido ja com conta: antes era inventado um <nome>.<hora>@... que
  // o dono nao conhecia (e o login Google com o email dele nunca acertava).
  // Agora o pedido fica pendente e o admin resolve com a pessoa.
  const existing = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (existing) {
    // 31/10: o mesmo dono a pedir mais um estabelecimento. O admin escolhe juntar este
    // pedido a conta dele (sem senha nova: entra com a que ja tem). Nunca para contas
    // que nao sao de dono (caixistas, admin).
    const join = Boolean(req.body && req.body.join_existing);
    if (!join || existing.role !== 'owner' || !existing.is_active) {
      throw httpError(409, existing.role === 'owner'
        ? `O email ${ownerEmail} já é de um dono do Genesis (${existing.name}). Pode juntar este estabelecimento à conta dele.`
        : `O email ${ownerEmail} já tem uma conta no Genesis. Peça outro email ao dono ou rejeite o pedido.`,
        existing.role === 'owner' && existing.is_active ? 'EMAIL_IS_OWNER' : 'EMAIL_IN_USE');
    }
    await prisma.$transaction([
      prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'trial', trial_ends_at: trialEnds } }),
      prisma.membership.create({ data: { user_id: existing.id, tenant_id: tenant.id, role: 'owner' } }),
    ]);
    invalidateActing(existing.id);
    await audit(req, 'APPROVE_TENANT_JOINED', tenant.id, { status: tenant.status }, { status: 'trial', trial_ends_at: trialEnds, owner_email: ownerEmail, joined_owner: existing.id });
    afterStatusChange();
    return res.json({ email: ownerEmail, joined: true, owner_name: existing.name, trial_ends_at: trialEnds });
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
// 31/10: eliminar o estabelecimento PRINCIPAL de um dono que tem outros desactivava
// o dono e cortava-lhe todos. Agora recusa (o dono encerra os extra no painel dele).
router.post('/tenants/:tenantId/delete', asyncHandler(async (req, res) => {
  const owners = await prisma.user.findMany({ where: { tenant_id: req.params.tenantId, role: 'owner' }, select: { id: true } });
  const others = owners.length ? await prisma.membership.count({ where: { user_id: { in: owners.map((o) => o.id) }, NOT: { tenant_id: req.params.tenantId } } }) : 0;
  if (others > 0) throw httpError(409, 'Este é o estabelecimento principal de um dono com outros estabelecimentos. Suspenda-o em vez de o eliminar.', 'HOME_WITH_OTHERS');
  return setTenantStatus(req, res, { action: 'DELETE_TENANT', to: 'deleted', ownersActive: false, allUsers: true });
}));
// Recuperar uma loja eliminada reactiva TODAS as contas (antes so os donos:
// os caixistas ficavam desactivados para sempre).
router.post('/tenants/:tenantId/restore', asyncHandler((req, res) => setTenantStatus(req, res, { action: 'RESTORE_TENANT', to: 'previous', ownersActive: true, allUsers: true })));

router.post('/tenants/:tenantId/extend-trial', asyncHandler(async (req, res) => {
  const { days } = z.object({ days: z.number().int().min(1).max(90) }).parse(req.body);
  const tenant = await findTenant(req.params.tenantId);
  if (tenant.status !== 'trial') throw httpError(409, 'O estabelecimento não está em período de teste');
  const base = tenant.trial_ends_at && tenant.trial_ends_at > new Date() ? new Date(tenant.trial_ends_at) : new Date();
  base.setDate(base.getDate() + days);
  await prisma.tenant.update({ where: { id: tenant.id }, data: { trial_ends_at: base } });
  await audit(req, 'EXTEND_TRIAL', tenant.id, { trial_ends_at: tenant.trial_ends_at }, { trial_ends_at: base });
  afterStatusChange();
  res.json({ ok: true, trial_ends_at: base });
}));

// Fase 16: plano Basico ou Premium; mensal ou anual. Precos do fundador de
// 30/10/2026: Basico 8 000 MT/mes, Premium 14 000 MT/mes (antes 3 000 / 8 000).
// So vale para quem muda de plano a partir de agora; quem ja paga fica com o seu preco.
const PLAN_PRICE = { basic: 800000, premium: 1400000 };
router.post('/tenants/:tenantId/plan', asyncHandler(async (req, res) => {
  const data = z.object({ plan: z.enum(PLANS), period: z.enum(PERIODS) }).parse(req.body);
  const tenant = await findTenant(req.params.tenantId);
  const next = { plan: data.plan, plan_period: data.period, subscription_price: PLAN_PRICE[data.plan] };
  await prisma.tenant.update({ where: { id: tenant.id }, data: next });
  await audit(req, 'CHANGE_PLAN', tenant.id, { plan: tenant.plan, plan_period: tenant.plan_period, subscription_price: tenant.subscription_price }, next);
  res.json({ ok: true, ...next });
}));

// Etapa A: activar = pago ate uma data (+1 mes no plano mensal, +12 no anual, ou o
// que o admin escolher). Renovar antes do fim soma a partir da data que ja havia.
router.post('/tenants/:tenantId/activate', asyncHandler(async (req, res) => {
  const { months } = z.object({ months: z.number().int().min(1).max(24).optional() }).parse(req.body || {});
  const tenant = await findTenant(req.params.tenantId);
  if (['deleted', 'rejected', 'pending'].includes(tenant.status)) throw httpError(409, 'Este estabelecimento não pode ser activado (estado: ' + tenant.status + ')', 'NOT_ACTIVATABLE');
  const n = months || (tenant.plan_period === 'annual' ? 12 : 1);
  const now = new Date();
  const until = tenant.subscription_until && tenant.subscription_until > now ? new Date(tenant.subscription_until) : now;
  until.setMonth(until.getMonth() + n);
  await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'active', subscription_until: until } });
  await audit(req, 'ACTIVATE_SUBSCRIPTION', tenant.id, { status: tenant.status, subscription_until: tenant.subscription_until }, { status: 'active', subscription_until: until, months: n });
  publish({ type: 'subscription', tenant_id: tenant.id, total: (tenant.subscription_price || 0) * n, months: n });
  afterStatusChange();
  res.json({ ok: true, status: 'active', subscription_until: until });
}));

// Modo suporte (so leitura): codigo de uso unico valido 60 s.
router.post('/tenants/:tenantId/support', asyncHandler(async (req, res) => {
  const tenant = await findTenant(req.params.tenantId);
  let owner = await prisma.user.findFirst({ where: { tenant_id: tenant.id, role: 'owner' }, orderBy: { created_at: 'asc' } });
  // 31/10: estabelecimento extra — o dono tem a conta no de casa (Membership).
  if (!owner) {
    const m = await prisma.membership.findFirst({ where: { tenant_id: tenant.id, role: 'owner' }, orderBy: { created_at: 'asc' } });
    if (m) owner = await prisma.user.findUnique({ where: { id: m.user_id } });
  }
  if (!owner) throw httpError(404, 'Este estabelecimento ainda não tem dono');
  const code = createSupportCode({ ownerUserId: owner.id, tenantId: tenant.id, adminUserId: req.user.userId });
  await audit(req, 'SUPPORT_CODE_ISSUED', tenant.id, null, { owner: owner.id });
  res.json({ url: `${APP_URL()}/suporte#${code}` });
}));

// ---------------------------------------------------------------- avise-me
// Etapa A: quem pediu para ser avisado quando o modo do seu negocio existir.
router.get('/waitlist', asyncHandler(async (req, res) => {
  const rows = await prisma.modeWaitlist.findMany({ orderBy: { created_at: 'desc' }, take: 1000 });
  const by_type = {};
  for (const r of rows) if (!r.notified_at) by_type[r.business_type] = (by_type[r.business_type] || 0) + 1;
  res.json({ rows, by_type, pending: rows.filter((r) => !r.notified_at).length });
}));

router.post('/waitlist/:id/notified', asyncHandler(async (req, res) => {
  const r = await prisma.modeWaitlist.updateMany({ where: { id: req.params.id, notified_at: null }, data: { notified_at: new Date() } });
  if (r.count !== 1) throw httpError(404, 'Pedido não encontrado ou já avisado', 'WAITLIST_NOT_FOUND');
  await writeAudit({ req, tenantId: null, action: 'WAITLIST_NOTIFIED', entityType: 'waitlist', entityId: req.params.id });
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- sugestoes
// Produtos que as lojas criaram fora do catalogo-mestre (Fase 8.2). Agrupados
// por tipo de negocio + nome; sem nomes de lojas (so quantas e os precos).
const groupKeySchema = z.object({
  business_type: z.enum(BUSINESS_TYPES),
  name_key: z.string().min(1).max(200),
});

router.get('/catalog-suggestions', asyncHandler(async (req, res) => {
  const rows = await prisma.catalogSuggestion.findMany({ where: { status: 'pending' }, orderBy: { created_at: 'asc' } });
  res.json({ pending: rows.length, groups: groupSuggestions(rows) });
}));

router.post('/catalog-suggestions/accept', asyncHandler(async (req, res) => {
  const parsed = groupKeySchema.extend({
    product_name: z.string().trim().min(1, 'nome em falta').max(120),
    product_name_en: z.string().trim().max(120).nullish(),
    category: z.string().trim().min(1).max(60),
    suggested_cost: z.number().int().nonnegative(),
    suggested_sell: z.number().int().positive('preço de venda tem de ser maior que zero'),
    barcode: z.string().trim().regex(/^[0-9A-Za-z-]{4,32}$/, 'código de barras inválido').nullish(),
    icon: iconSchema,
    // Etapa A: tambem noutros tipos de negocio (ex.: Coca-Cola na mercearia e no supermercado).
    also_types: z.array(z.enum(BUSINESS_TYPES)).max(40).default([]),
  }).safeParse(req.body);
  if (!parsed.success) throw httpError(400, parsed.error.errors[0].message, 'INVALID_SUGGESTION');
  const d = parsed.data;
  const created = await prisma.$transaction(async (tx) => {
    const pending = await tx.catalogSuggestion.findMany({ where: { business_type: d.business_type, name_key: d.name_key, status: 'pending' }, select: { id: true } });
    if (!pending.length) throw httpError(404, 'Sugestão já tratada ou inexistente', 'SUGGESTION_NOT_FOUND');
    const types = [d.business_type, ...d.also_types.filter((x) => x !== d.business_type)];
    const existing = await tx.masterCatalog.findMany({ where: { business_type: { in: types } }, select: { business_type: true, product_name: true } });
    const has = (type) => existing.some((m) => m.business_type === type && nameKey(m.product_name) === nameKey(d.product_name));
    if (has(d.business_type)) throw httpError(409, 'Esse produto já está no catálogo-mestre deste tipo de negócio', 'ALREADY_IN_CATALOG');
    const added = [];
    let row = null;
    for (const type of types) {
      if (has(type)) continue; // noutro tipo ja existia: fica como estava
      const r = await tx.masterCatalog.create({ data: {
        business_type: type, product_name: d.product_name, product_name_en: d.product_name_en || null, category: d.category,
        suggested_cost: d.suggested_cost, suggested_sell: d.suggested_sell, barcode: d.barcode || null, icon: d.icon || null,
      } });
      if (!row) row = r;
      added.push(type);
    }
    await tx.catalogSuggestion.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { status: 'added', resolved_at: new Date(), resolved_by: req.user.userId } });
    return { row, added, stores: pending.length };
  });
  await writeAudit({ req, tenantId: null, action: 'CATALOG_SUGGESTION_ADDED', entityType: 'master_catalog', entityId: created.row.id, oldValue: null, newValue: { business_type: d.business_type, also_types: created.added.slice(1), product_name: d.product_name, suggested_cost: d.suggested_cost, suggested_sell: d.suggested_sell } });
  res.status(201).json({ id: created.row.id, added_types: created.added, message: 'Acrescentado ao catálogo-mestre.' });
}));

router.post('/catalog-suggestions/dismiss', asyncHandler(async (req, res) => {
  const parsed = groupKeySchema.safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Sugestão inválida', 'INVALID_SUGGESTION');
  const r = await prisma.catalogSuggestion.updateMany({ where: { ...parsed.data, status: 'pending' }, data: { status: 'dismissed', resolved_at: new Date(), resolved_by: req.user.userId } });
  if (!r.count) throw httpError(404, 'Sugestão já tratada ou inexistente', 'SUGGESTION_NOT_FOUND');
  await writeAudit({ req, tenantId: null, action: 'CATALOG_SUGGESTION_DISMISSED', entityType: 'catalog_suggestion', entityId: null, oldValue: null, newValue: parsed.data });
  res.json({ dismissed: r.count });
}));

// ------------------------------------------------- pedidos de clientes (8.4)
// O que os clientes pediram e nao havia, escrito pelos caixistas FORA do
// catalogo da loja. Todas as lojas juntas, por tipo de negocio + nome. Decisao
// do fundador (10/10): sem nomes das lojas — so quantas pediram.
router.get('/lost-requests', asyncHandler(async (req, res) => {
  const days = [30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const since = new Date(Date.now() - days * 86400000);
  const rows = await prisma.demandCapture.findMany({
    where: { product_id: null, requested_at: { gte: since } },
    select: { tenant_id: true, product_name: true, name_key: true, quantity: true, unit_price: true, requested_at: true },
    orderBy: { requested_at: 'asc' },
  });
  const ids = [...new Set(rows.map((r) => r.tenant_id))];
  const types = new Map((ids.length ? await prisma.tenant.findMany({ where: { id: { in: ids } }, select: { id: true, business_type: true } }) : []).map((t) => [t.id, t.business_type]));
  const groups = groupLostRequests(rows.map((r) => ({ ...r, business_type: types.get(r.tenant_id) })));
  res.json({ days, total_requests: rows.length, groups });
}));

// ---------------------------------------------------- catalogo-mestre (8.6)
// O super admin ve, acrescenta e EDITA os produtos sugeridos as lojas novas no
// onboarding (pedido do fundador 10/10: nome, custo, preco). Valores sempre em
// centavos. Substitui o antigo /api/master_catalogs (fora de /api/admin, sem
// verificacao de origem, recebia MZN em virgula flutuante). Apagar nao foi
// pedido. As lojas que ja existem nao mudam: so as novas recebem a alteracao.
const masterSchema = z.object({
  business_type: z.enum(BUSINESS_TYPES),
  product_name: z.string().trim().min(1, 'nome em falta').max(120),
  // 9.7: nome em ingles (opcional) — so os produtos do catalogo-mestre o tem.
  product_name_en: z.string().trim().max(120).nullish(),
  category: z.string().trim().min(1, 'categoria em falta').max(60),
  suggested_cost: z.number().int('custo em centavos').nonnegative('custo não pode ser negativo'),
  suggested_sell: z.number().int('preço em centavos').positive('preço de venda tem de ser maior que zero'),
  barcode: z.string().trim().regex(/^[0-9A-Za-z-]{4,32}$/, 'código de barras inválido').nullish(),
  icon: iconSchema,
});
const masterOut = (m) => ({
  id: m.id, business_type: m.business_type, product_name: m.product_name, product_name_en: m.product_name_en || null, category: m.category,
  suggested_cost: m.suggested_cost, suggested_sell: m.suggested_sell, barcode: m.barcode, icon: m.icon, image_url: m.image_url,
});
async function assertUniqueName(businessType, name, exceptId) {
  const same = await prisma.masterCatalog.findMany({ where: { business_type: businessType }, select: { id: true, product_name: true } });
  if (same.some((m) => m.id !== exceptId && nameKey(m.product_name) === nameKey(name))) {
    throw httpError(409, 'Esse produto já está no catálogo-mestre deste tipo de negócio', 'ALREADY_IN_CATALOG');
  }
}

router.get('/master-catalog', asyncHandler(async (req, res) => {
  const type = z.enum(BUSINESS_TYPES).default('bottle_store').parse(req.query.type || undefined);
  const rows = await prisma.masterCatalog.findMany({ where: { business_type: type }, orderBy: [{ category: 'asc' }, { product_name: 'asc' }] });
  const counts = await prisma.masterCatalog.groupBy({ by: ['business_type'], _count: { _all: true } });
  res.json({ business_type: type, products: rows.map(masterOut), counts: Object.fromEntries(counts.map((c) => [c.business_type, c._count._all])) });
}));

router.post('/master-catalog', asyncHandler(async (req, res) => {
  const d = masterSchema.parse(req.body);
  await assertUniqueName(d.business_type, d.product_name);
  const row = await prisma.masterCatalog.create({ data: { ...d, product_name_en: d.product_name_en || null, barcode: d.barcode || null, icon: d.icon || null } });
  await writeAudit({ req, tenantId: null, action: 'MASTER_CATALOG_CREATED', entityType: 'master_catalog', entityId: row.id, oldValue: null, newValue: masterOut(row) });
  res.status(201).json(masterOut(row));
}));

router.put('/master-catalog/:id', asyncHandler(async (req, res) => {
  const before = await prisma.masterCatalog.findUnique({ where: { id: req.params.id } });
  if (!before) throw httpError(404, 'Produto do catálogo-mestre não encontrado', 'MASTER_NOT_FOUND');
  const d = masterSchema.omit({ business_type: true }).parse(req.body);
  await assertUniqueName(before.business_type, d.product_name, before.id);
  const row = await prisma.masterCatalog.update({ where: { id: before.id }, data: { ...d, product_name_en: d.product_name_en || null, barcode: d.barcode || null, icon: d.icon || null } });
  await writeAudit({ req, tenantId: null, action: 'MASTER_CATALOG_UPDATED', entityType: 'master_catalog', entityId: row.id, oldValue: masterOut(before), newValue: masterOut(row) });
  res.json(masterOut(row));
}));

module.exports = router;
