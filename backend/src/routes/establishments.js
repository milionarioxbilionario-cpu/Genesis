// Etapa D (plano kind-sleeping-squid): um dono com varios estabelecimentos.
// Cada estabelecimento continua a ser uma loja separada (tenant, RLS intacta);
// o dono troca de estabelecimento (token `act`, validado em cada pedido em
// middleware/auth.js) e tem um «painel geral» com as somas de todos.
//   GET  /api/establishments            os seus estabelecimentos (o de casa primeiro)
//   POST /api/establishments            acrescentar um (comeca no onboarding)
//   POST /api/establishments/switch     passar a trabalhar noutro
//   POST /api/establishments/home       voltar ao de casa (acesso retirado, activo suspenso)
//   GET  /api/establishments/:id/catalog os produtos de outro estabelecimento (para o onboarding)
//   POST /api/establishments/:id/close   encerrar (tem historico: so consulta) ou apagar (nunca vendeu)
//   POST /api/establishments/:id/reopen  reabrir um encerrado (30 dias)
//   POST /api/establishments/copy-catalog copiar produtos de outro estabelecimento para este
//   GET  /api/establishments/summary    painel geral (hoje, 7 dias, mes; stock a acabar)
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { setSessionCookies } = require('../utils/tokens');
const { ownerTenantIds, invalidateActing, CLOSED_STATUSES } = require('../utils/actingTenant');
const bcrypt = require('bcrypt');
const { findSelf, auditSelf } = require('../utils/ownerSelf');
const { clearTenantStatusCache } = require('../utils/tenantStatus');
const { invalidateSessionUser } = require('../utils/sessionUser');
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
  const rows = await prisma.system.tenant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, business_type: true, location: true, status: true, onboarding_completed: true, closed_at: true } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  res.json(ids.map((id) => byId.get(id)).filter(Boolean).map((t) => ({ ...t, is_home: t.id === user.tenant_id, is_current: t.id === req.user.tenantId, available: !CLOSED_STATUSES.has(t.status) })));
}));

const TRIAL_DAYS = 30; // o mesmo teste de uma conta nova (routes/admin.js, aprovar)
const createSchema = z.object({
  // Gerado no aparelho: repetir o pedido (rede que cai entre criar e trocar) devolve o mesmo.
  client_id: z.string().uuid().optional(),
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
  // Pedido repetido (o mesmo client_id): devolve o que ja foi criado.
  if (data.client_id && ids.includes(data.client_id)) {
    const again = await prisma.system.tenant.findUnique({ where: { id: data.client_id }, select: { id: true, name: true } });
    return res.status(200).json({ id: again.id, name: again.name, repeated: true });
  }
  const home = await prisma.system.tenant.findUnique({ where: { id: user.tenant_id } });
  if (!home) throw httpError(404, 'Estabelecimento não encontrado');
  // 31/10: o novo NAO herda «activa ate» (era usar sem pagar ate a data da conta).
  // Conta em teste: acaba com o teste da conta. Conta paga: 30 dias de teste
  // proprios, e o fundador activa-o no painel de administracao quando receber.
  const inTrial = home.status === 'trial' && home.trial_ends_at && new Date(home.trial_ends_at) > new Date();
  const trialEnds = inTrial ? home.trial_ends_at : new Date(Date.now() + TRIAL_DAYS * DAY_MS);
  let tenant;
  try {
    tenant = await prisma.system.tenant.create({ data: {
      ...(data.client_id ? { id: data.client_id } : {}),
      name: data.name, business_type: data.business_type, location: data.location,
      owner_name: home.owner_name, phone: home.phone, email: null,
      status: 'trial', trial_ends_at: trialEnds, subscription_until: null,
      plan: home.plan, plan_period: home.plan_period, subscription_price: home.subscription_price,
      terms_accepted_at: home.terms_accepted_at, terms_version: home.terms_version,
    } });
  } catch (err) {
    // O mesmo id ja existe e nao e deste dono: recusado sem dizer de quem e.
    if (err && err.code === 'P2002') throw httpError(409, 'Tente de novo.', 'ESTABLISHMENT_ID_TAKEN');
    throw err;
  }
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
  // Suspenso, bloqueado ou fechado: recusado com um codigo proprio (o TENANT_BLOCKED
  // terminava a sessao no painel e expulsava o dono).
  if (!t || CLOSED_STATUSES.has(t.status)) throw httpError(403, 'Este estabelecimento está suspenso ou fechado. Fale com a Genesis.', 'ESTABLISHMENT_UNAVAILABLE');
  setSessionCookies(res, user, { act: tenant_id });
  res.json({ ok: true, tenant: { id: tenant_id, name: t.name, onboarding_completed: t.onboarding_completed } });
}));

// 31/10 (R1): «nao tinha a opcao de importar o catalogo da loja que ja tenho».
// A origem tem de ser do mesmo dono; le-se DENTRO do contexto da origem (RLS da
// origem) e grava-se no contexto do estabelecimento activo (RLS do destino).
// Copia nome, categoria, precos, codigo de barras, IVA, unidade, stock minimo,
// validade, icone e imagem. O stock NAO (e fisico: fica a zero).
const COPY_SELECT = { name: true, category: true, sell_price: true, cost_price: true, barcode: true, image_url: true, icon: true, unit: true, vat_rate: true, min_stock: true, has_expiry: true };
async function sourceProducts(req, from, categories) {
  const user = await ownerUser(req);
  const ids = await ownerTenantIds(user);
  if (!ids.includes(from)) throw httpError(403, 'Este estabelecimento não é seu.', 'ESTABLISHMENT_FORBIDDEN');
  return prisma.runWithTenant(from, () => prisma.product.findMany({
    where: { tenant_id: from, is_active: true, ...(categories && categories.length ? { category: { in: categories } } : {}) },
    select: COPY_SELECT, orderBy: [{ category: 'asc' }, { name: 'asc' }], take: 5000,
  }));
}

// Para o onboarding: a lista da origem, para o dono rever antes de concluir.
router.get('/:id/catalog', asyncHandler(async (req, res) => {
  const from = z.string().uuid().parse(req.params.id);
  const rows = await sourceProducts(req, from, null);
  res.json(rows.map((p) => ({ name: p.name, category: p.category, price_mzn: p.sell_price / 100, cost_mzn: p.cost_price / 100, stock: 0, barcode: p.barcode, image_url: p.image_url, icon: p.icon, unit: p.unit, vat_rate: p.vat_rate, min_stock: p.min_stock, has_expiry: p.has_expiry })));
}));

const copySchema = z.object({
  from: z.string().uuid(),
  categories: z.array(z.string().trim().min(1).max(60)).max(200).optional(),
  op_id: z.string().uuid(), // gerado no aparelho: repetir nao copia duas vezes
});
router.post('/copy-catalog', asyncHandler(async (req, res) => {
  const data = copySchema.parse(req.body);
  const to = req.user.tenantId;
  if (data.from === to) throw httpError(400, 'Escolha outro estabelecimento.', 'SAME_ESTABLISHMENT');
  const before = await prisma.auditLog.findFirst({ where: { tenant_id: to, action: 'COPY_CATALOG', entity_id: data.op_id } });
  if (before) return res.json({ ...JSON.parse(before.new_value || '{}'), repeated: true });
  const source = await sourceProducts(req, data.from, data.categories);
  const result = await prisma.$transaction(async (tx) => {
    // Ja existe aqui (o mesmo codigo de barras ou o mesmo nome): salta.
    const here = await tx.product.findMany({ where: { tenant_id: to }, select: { name: true, barcode: true } });
    const codes = new Set(here.map((p) => p.barcode).filter(Boolean));
    const names = new Set(here.map((p) => p.name.trim().toLowerCase()));
    const skipped = [];
    const rows = [];
    for (const p of source) {
      const key = p.name.trim().toLowerCase();
      if ((p.barcode && codes.has(p.barcode)) || names.has(key)) { skipped.push(p.name); continue; }
      names.add(key); if (p.barcode) codes.add(p.barcode);
      rows.push({ ...p, tenant_id: to, stock_qty: 0 });
    }
    if (rows.length) await tx.product.createMany({ data: rows });
    const summary = { from: data.from, copied: rows.length, skipped: skipped.length, skipped_names: skipped.slice(0, 20) };
    await tx.auditLog.create({ data: { tenant_id: to, user_id: req.user.userId, action: 'COPY_CATALOG', entity_type: 'catalog_copy', entity_id: data.op_id, new_value: JSON.stringify(summary), ip_address: req.ip || '0.0.0.0' } });
    return summary;
  });
  res.status(201).json(result);
}));

// 31/10 (R10): «nem tem como apagar uma loja, ela fica ai para sempre».
// - Nunca vendeu (sem vendas, txenekas nem fechos de turno): APAGA-SE (sai da
//   lista do dono; o admin ainda o pode recuperar).
// - Ja tem historico: ENCERRA-SE: fica so para consulta, com os relatorios e o
//   rastreio guardados (registos fiscais nunca se apagam). Os terminais ainda
//   enviam a fila sem rede durante 7 dias. Pode reabrir durante 30 dias.
// O estabelecimento de casa nao (a conta do dono vive nele). Confirma-se com o
// nome escrito e a senha da conta.
const REOPEN_DAYS = 30;
router.post('/:id/close', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { password, confirm_name } = z.object({ password: z.string().min(1, 'Escreva a senha da conta').max(200), confirm_name: z.string().trim().min(1).max(80) }).parse(req.body || {});
  const user = await ownerUser(req);
  const ids = await ownerTenantIds(user);
  if (!ids.includes(id)) throw httpError(403, 'Este estabelecimento não é seu.', 'ESTABLISHMENT_FORBIDDEN');
  if (id === user.tenant_id) throw httpError(400, 'Este é o seu estabelecimento principal: a sua conta vive nele. Não se pode encerrar.', 'HOME_ESTABLISHMENT');
  const t = await prisma.system.tenant.findUnique({ where: { id }, select: { name: true, status: true } });
  if (!t || CLOSED_STATUSES.has(t.status) || t.status === 'closed') throw httpError(409, 'Este estabelecimento já está encerrado.', 'ALREADY_CLOSED');
  const me = await findSelf(req, { password_hash: true });
  if (!me?.password_hash || !(await bcrypt.compare(password, me.password_hash))) {
    await auditSelf(req, 'ESTABLISHMENT_CLOSE_FAIL', { newValue: { establishment: t.name } });
    throw httpError(403, 'A senha não está certa.', 'WRONG_PASSWORD');
  }
  if (confirm_name.toLowerCase() !== t.name.trim().toLowerCase()) throw httpError(400, 'O nome escrito não é igual ao do estabelecimento.', 'NAME_MISMATCH');
  // Tem historico? (lido dentro do proprio estabelecimento: RLS dele)
  const history = await prisma.runWithTenant(id, async () => (
    (await prisma.sale.count({ where: { tenant_id: id } })) + (await prisma.debt.count({ where: { tenant_id: id } })) + (await prisma.shiftClosing.count({ where: { tenant_id: id } }))
  ));
  const now = new Date();
  const status = history > 0 ? 'closed' : 'deleted';
  await prisma.system.tenant.update({ where: { id }, data: { status, closed_at: now } });
  const team = await prisma.system.user.findMany({ where: { tenant_id: id, role: { in: ['cashier', 'guard', 'manager'] } }, select: { id: true } });
  if (status === 'deleted') {
    // Apagado: sai da lista do dono, terminais revogados, equipa desactivada.
    await prisma.system.membership.deleteMany({ where: { user_id: user.id, tenant_id: id } });
    await prisma.system.posTerminal.updateMany({ where: { tenant_id: id, revoked_at: null }, data: { revoked_at: now } });
    await prisma.system.user.updateMany({ where: { id: { in: team.map((u) => u.id) } }, data: { is_active: false } });
  }
  for (const u of team) invalidateSessionUser(u.id);
  invalidateActing(user.id);
  clearTenantStatusCache();
  await prisma.system.auditLog.create({ data: { tenant_id: id, user_id: user.id, action: status === 'closed' ? 'ESTABLISHMENT_CLOSED' : 'ESTABLISHMENT_DELETED', entity_type: 'tenant', entity_id: id, old_value: JSON.stringify({ status: t.status }), new_value: JSON.stringify({ status, history }), ip_address: req.ip || '0.0.0.0' } });
  await auditSelf(req, status === 'closed' ? 'ESTABLISHMENT_CLOSED' : 'ESTABLISHMENT_DELETED', { newValue: { establishment: t.name, id } });
  // Quem estava nele volta ao de casa.
  if (req.user.tenantId === id) setSessionCookies(res, user);
  res.json({ ok: true, status, reopen_until: status === 'closed' ? new Date(now.getTime() + REOPEN_DAYS * DAY_MS) : null });
}));

router.post('/:id/reopen', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const user = await ownerUser(req);
  const ids = await ownerTenantIds(user);
  if (!ids.includes(id)) throw httpError(403, 'Este estabelecimento não é seu.', 'ESTABLISHMENT_FORBIDDEN');
  const t = await prisma.system.tenant.findUnique({ where: { id }, select: { status: true, closed_at: true } });
  if (!t || t.status !== 'closed') throw httpError(409, 'Este estabelecimento não está encerrado.', 'NOT_CLOSED');
  if (!t.closed_at || Date.now() - new Date(t.closed_at).getTime() > REOPEN_DAYS * DAY_MS) throw httpError(409, 'Passaram mais de 30 dias. Fale com a Genesis para o reabrir.', 'REOPEN_EXPIRED');
  const last = await prisma.system.auditLog.findFirst({ where: { tenant_id: id, action: 'ESTABLISHMENT_CLOSED' }, orderBy: { created_at: 'desc' }, select: { old_value: true } });
  let prev = 'active';
  try { prev = JSON.parse(last?.old_value || '{}').status || 'active'; } catch { prev = 'active'; }
  if (!['trial', 'active'].includes(prev)) prev = 'active';
  await prisma.system.tenant.update({ where: { id }, data: { status: prev, closed_at: null } });
  clearTenantStatusCache();
  invalidateActing(user.id);
  await prisma.system.auditLog.create({ data: { tenant_id: id, user_id: user.id, action: 'ESTABLISHMENT_REOPENED', entity_type: 'tenant', entity_id: id, new_value: JSON.stringify({ status: prev }), ip_address: req.ip || '0.0.0.0' } });
  res.json({ ok: true, status: prev });
}));

// Voltar ao estabelecimento de casa: sessao nova sem `act`. Passa mesmo com o
// activo suspenso ou com o acesso a ele retirado (middleware/auth.js).
router.post('/home', asyncHandler(async (req, res) => {
  const user = await ownerUser(req);
  setSessionCookies(res, user);
  res.json({ ok: true, tenant_id: user.tenant_id });
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
