// E2 (31/10/2026): gerentes criados pelo dono.
//   GET  /api/managers          os gerentes de todos os estabelecimentos do dono
//   POST /api/managers          criar (e-mail + senha; PIN de autorizacao opcional)
//   PUT  /api/managers/:id      nome, telefone, nova senha, PIN (null = sem PIN), activo
// Um gerente e um User com role 'manager' e tenant_id = o estabelecimento que gere.
// Entra em /entrar e trabalha so nesse estabelecimento (sem `act`, sem painel
// geral); o que pode fazer esta em utils/managerPolicy.js. O PIN dele autoriza
// cancelamentos e descontos (utils/authPin.js); sem PIN, nao autoriza.
// Lido e escrito com o cliente de sistema, sempre dentro dos estabelecimentos
// deste dono (ownerTenantIds).
const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { ownerTenantIds } = require('../utils/actingTenant');
const { invalidateSessionUser } = require('../utils/sessionUser');

const router = express.Router();
router.use(auth, requireRole('owner'));
router.use((req, res, next) => (req.user.scope ? next(httpError(403, 'Não disponível nesta sessão.', 'SCOPE_RESTRICTED')) : next()));

const PIN = z.string().regex(/^\d{4,6}$/, 'O PIN tem 4 a 6 dígitos');
const PASSWORD = z.string().min(8, 'A senha tem pelo menos 8 caracteres').max(128);
const NAME = z.string().trim().min(2, 'Escreva o nome').max(80);
const PHONE = z.string().trim().max(20).optional().nullable();

const ownerOf = (req) => prisma.system.user.findUnique({ where: { id: req.user.userId }, select: { id: true, tenant_id: true } });
const view = (u, names) => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone || null, is_active: u.is_active, has_pin: Boolean(u.pin_hash),
  tenant_id: u.tenant_id, establishment: names.get(u.tenant_id) || '—', created_at: u.created_at,
});

async function establishmentNames(ids) {
  const rows = await prisma.system.tenant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return new Map(rows.map((t) => [t.id, t.name]));
}

// O mesmo PIN para duas pessoas no mesmo estabelecimento tornava o rastreio
// ambiguo (quem autorizou?): recusa-se o PIN do dono e o dos outros gerentes.
async function assertPinFree(tenantId, pin, exceptId) {
  const [tenant, others] = await Promise.all([
    prisma.system.tenant.findUnique({ where: { id: tenantId }, select: { cancel_pin_hash: true } }),
    prisma.system.user.findMany({ where: { tenant_id: tenantId, role: 'manager', is_active: true, pin_hash: { not: null }, ...(exceptId ? { NOT: { id: exceptId } } : {}) }, select: { pin_hash: true } }),
  ]);
  for (const h of [tenant?.cancel_pin_hash, ...others.map((o) => o.pin_hash)].filter(Boolean)) {
    if (await bcrypt.compare(pin, h)) throw httpError(409, 'Este PIN já é usado neste estabelecimento. Escolha outro.', 'PIN_TAKEN');
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const ids = await ownerTenantIds(await ownerOf(req));
  const [rows, names] = await Promise.all([
    prisma.system.user.findMany({ where: { tenant_id: { in: ids }, role: 'manager' }, orderBy: [{ is_active: 'desc' }, { name: 'asc' }] }),
    establishmentNames(ids),
  ]);
  res.json(rows.map((u) => view(u, names)));
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = z.object({
    tenant_id: z.string().uuid().optional(),
    name: NAME,
    email: z.string().trim().toLowerCase().email('E-mail inválido').max(254),
    password: PASSWORD,
    pin: PIN.optional().nullable(),
    phone: PHONE,
  }).parse(req.body);
  const ids = await ownerTenantIds(await ownerOf(req));
  const tenantId = data.tenant_id || req.user.tenantId;
  if (!ids.includes(tenantId)) throw httpError(404, 'Estabelecimento não encontrado', 'ESTABLISHMENT_NOT_FOUND');
  if (await prisma.system.user.findUnique({ where: { email: data.email }, select: { id: true } })) {
    throw httpError(409, 'Este e-mail já tem uma conta no Genesis. Use outro e-mail para o gerente.', 'EMAIL_IN_USE');
  }
  if (data.pin) await assertPinFree(tenantId, data.pin);
  let user;
  try {
    user = await prisma.system.user.create({ data: {
      tenant_id: tenantId, role: 'manager', name: data.name, email: data.email, phone: data.phone || null,
      password_hash: await bcrypt.hash(data.password, 12),
      pin_hash: data.pin ? await bcrypt.hash(data.pin, 10) : null,
      is_active: true,
    } });
  } catch (err) {
    if (err && err.code === 'P2002') throw httpError(409, 'Este e-mail já tem uma conta no Genesis. Use outro e-mail para o gerente.', 'EMAIL_IN_USE');
    throw err;
  }
  await writeAudit({ db: prisma.system, req, tenantId, action: 'MANAGER_CREATED', entityType: 'user', entityId: user.id, newValue: { name: user.name, email: user.email, has_pin: Boolean(data.pin) } });
  res.status(201).json(view(user, await establishmentNames([tenantId])));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const data = z.object({
    name: NAME.optional(),
    phone: PHONE,
    password: PASSWORD.optional(),
    pin: PIN.nullable().optional(),
    is_active: z.boolean().optional(),
  }).parse(req.body);
  const ids = await ownerTenantIds(await ownerOf(req));
  const m = await prisma.system.user.findFirst({ where: { id: req.params.id, role: 'manager', tenant_id: { in: ids } } });
  if (!m) throw httpError(404, 'Gerente não encontrado', 'MANAGER_NOT_FOUND');
  if (data.pin) await assertPinFree(m.tenant_id, data.pin, m.id);
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.phone !== undefined) update.phone = data.phone || null;
  if (data.is_active !== undefined) update.is_active = data.is_active;
  // Senha nova: a versao (pv) muda e as sessoes abertas do gerente caem.
  if (data.password) update.password_hash = await bcrypt.hash(data.password, 12);
  if (data.pin !== undefined) update.pin_hash = data.pin ? await bcrypt.hash(data.pin, 10) : null;
  const saved = await prisma.system.user.update({ where: { id: m.id }, data: update });
  invalidateSessionUser(m.id);
  await writeAudit({
    db: prisma.system, req, tenantId: m.tenant_id, action: 'MANAGER_UPDATED', entityType: 'user', entityId: m.id,
    oldValue: { name: m.name, is_active: m.is_active, has_pin: Boolean(m.pin_hash) },
    newValue: { name: saved.name, is_active: saved.is_active, has_pin: Boolean(saved.pin_hash), ...(data.password ? { password_changed: true } : {}) },
  });
  res.json(view(saved, await establishmentNames([m.tenant_id])));
}));

module.exports = router;
