// Etapa D (plano kind-sleeping-squid): um dono com varios estabelecimentos.
// Cada estabelecimento continua a ser uma loja separada (tenant, RLS intacta);
// o dono troca de estabelecimento (token `act`, validado em cada pedido em
// middleware/auth.js) e tem um «painel geral» com as somas de todos.
//   GET  /api/establishments            os seus estabelecimentos (o de casa primeiro)
//   POST /api/establishments            acrescentar um (comeca no onboarding)
//   POST /api/establishments/switch     passar a trabalhar noutro
//   GET  /api/establishments/summary    painel geral (hoje, 7 dias, mes; stock a acabar)
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { setSessionCookies } = require('../utils/tokens');
const { ownerTenantIds, invalidateActing } = require('../utils/actingTenant');
const { BUSINESS_TYPES, MODE_PENDING } = require('../utils/businessTypes');

const router = express.Router();
router.use(auth, requireRole('owner'));
// Nem terminal nem suporte: so o dono na sua sessao normal.
router.use((req, res, next) => (req.user.scope ? next(httpError(403, 'Não disponível nesta sessão.', 'SCOPE_RESTRICTED')) : next()));

const MAX_ESTABLISHMENTS = 20;
const DAY_MS = 24 * 3600 * 1000;
// Inicio do dia de Maputo (UTC+2) como instante.
const maputoDay = (d = new Date()) => new Date(new Date(d.getTime() + 2 * 3600000).toISOString().slice(0, 10) + 'T00:00:00+02:00');

async function ownerUser(req) {
  return prisma.system.user.findUnique({ where: { id: req.user.userId }, select: { id: true, tenant_id: true, role: true, name: true, password_hash: true } });
}

router.get('/', asyncHandler(async (req, res) => {
  const user = await ownerUser(req);
  const ids = await ownerTenantIds(user);
  const rows = await prisma.system.tenant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, business_type: true, location: true, status: true, onboarding_completed: true } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  res.json(ids.map((id) => byId.get(id)).filter(Boolean).map((t) => ({ ...t, is_home: t.id === user.tenant_id, is_current: t.id === req.user.tenantId })));
}));

const createSchema = z.object({
  name: z.string().trim().min(3).max(80),
  business_type: z.enum(BUSINESS_TYPES),
  location: z.string().trim().min(3).max(120),
});

router.post('/', asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  if (MODE_PENDING.includes(data.business_type)) throw httpError(400, 'Este tipo de negócio chega brevemente.', 'MODE_COMING_SOON');
  const user = await ownerUser(req);
  const ids = await ownerTenantIds(user);
  if (ids.length >= MAX_ESTABLISHMENTS) throw httpError(400, `No máximo ${MAX_ESTABLISHMENTS} estabelecimentos por conta. Fale connosco para mais.`, 'TOO_MANY_ESTABLISHMENTS');
  const home = await prisma.system.tenant.findUnique({ where: { id: user.tenant_id } });
  if (!home) throw httpError(404, 'Loja não encontrada');
  // O estabelecimento novo segue a situacao da conta (teste, activa, plano e
  // validade); o preco de cada estabelecimento acerta-se no painel de administracao.
  const tenant = await prisma.system.tenant.create({ data: {
    name: data.name, business_type: data.business_type, location: data.location,
    owner_name: home.owner_name, phone: home.phone, email: null,
    status: home.status, trial_ends_at: home.trial_ends_at, subscription_until: home.subscription_until,
    plan: home.plan, plan_period: home.plan_period, subscription_price: home.subscription_price,
    terms_accepted_at: home.terms_accepted_at, terms_version: home.terms_version,
  } });
  await prisma.system.membership.create({ data: { user_id: user.id, tenant_id: tenant.id, role: 'owner' } });
  invalidateActing(user.id);
  // Registado no estabelecimento activo (o contexto RLS deste pedido).
  await writeAudit({ req, tenantId: req.user.tenantId, action: 'CREATE_ESTABLISHMENT', entityType: 'tenant', entityId: tenant.id, newValue: { name: tenant.name, business_type: tenant.business_type, location: tenant.location } });
  res.status(201).json({ id: tenant.id, name: tenant.name });
}));

router.post('/switch', asyncHandler(async (req, res) => {
  const { tenant_id } = z.object({ tenant_id: z.string().uuid() }).parse(req.body);
  const user = await ownerUser(req);
  const ids = await ownerTenantIds(user);
  if (!ids.includes(tenant_id)) throw httpError(403, 'Este estabelecimento não é seu.', 'ESTABLISHMENT_FORBIDDEN');
  const t = await prisma.system.tenant.findUnique({ where: { id: tenant_id }, select: { status: true, name: true, onboarding_completed: true } });
  if (!t || t.status === 'blocked' || t.status === 'rejected') throw httpError(403, 'Este estabelecimento está bloqueado.', 'TENANT_BLOCKED');
  setSessionCookies(res, user, { act: tenant_id });
  res.json({ ok: true, tenant: { id: tenant_id, name: t.name, onboarding_completed: t.onboarding_completed } });
}));

// Painel geral: cada soma corre DENTRO da loja respectiva (runWithTenant: filtro + RLS).
router.get('/summary', asyncHandler(async (req, res) => {
  const user = await ownerUser(req);
  const ids = await ownerTenantIds(user);
  const now = new Date();
  const today = maputoDay(now);
  const week = new Date(today.getTime() - 6 * DAY_MS);
  const month = new Date(new Date(now.getTime() + 2 * 3600000).toISOString().slice(0, 8) + '01T00:00:00+02:00');
  const tenants = await prisma.system.tenant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, business_type: true, location: true, status: true } });
  const byId = new Map(tenants.map((t) => [t.id, t]));
  const rows = [];
  for (const id of ids) {
    const t = byId.get(id);
    if (!t) continue;
    const r = await prisma.runWithTenant(id, async () => {
      const sum = async (from) => {
        const a = await prisma.sale.aggregate({ where: { tenant_id: id, status: 'completed', created_at: { gte: from } }, _sum: { total_amount: true, total_cost: true }, _count: true });
        return { total: Number(a._sum.total_amount || 0), profit: Number(a._sum.total_amount || 0) - Number(a._sum.total_cost || 0), count: a._count };
      };
      const [d, w, m, low] = await Promise.all([
        sum(today), sum(week), sum(month),
        prisma.product.count({ where: { tenant_id: id, is_active: true, stock_qty: { lte: 0 } } }),
      ]);
      return { today: d, week: w, month: m, out_of_stock: low };
    });
    rows.push({ id, name: t.name, business_type: t.business_type, location: t.location, status: t.status, is_current: id === req.user.tenantId, ...r });
  }
  const add = (k) => rows.reduce((acc, r) => ({ total: acc.total + r[k].total, profit: acc.profit + r[k].profit, count: acc.count + r[k].count }), { total: 0, profit: 0, count: 0 });
  res.json({ establishments: rows, totals: { today: add('today'), week: add('week'), month: add('month') } });
}));

module.exports = router;
