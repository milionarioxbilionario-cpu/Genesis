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
const { findSelf } = require('../utils/ownerSelf');
const H = require('../utils/hours');
const { forgetSchedule } = require('../utils/tenantHours');
const { publish } = require('../utils/liveBus');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { VAT_MODES, RATE_MIN, RATE_MAX } = require('../services/tax');
const { monthlyAmount } = require('../services/monthlyDeductions');
const { parseLocation, validCoords, mapsLinkKind } = require('../utils/geo');

const router = express.Router();
router.use(auth, requireRole('owner'));

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
// Fase 15.3: 'municipal' = taxas do municipio (licenca, publicidade…), muitas vezes anuais.
const FIXED_COST_TYPES = ['rent', 'utilities', 'transport', 'municipal', 'other'];

const storeSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  email: z.string().trim().email().optional().nullable(),
  // Fase 15.1: aparecem no recibo. NUIT de Mocambique = 9 digitos.
  nuit: z.string().trim().regex(/^\d{9}$/, 'O NUIT tem 9 dígitos').optional().nullable().or(z.literal('').transform(() => null)),
  receipt_footer: z.string().trim().max(160, 'No máximo 160 caracteres').optional().nullable(),
});

// Logotipo do estabelecimento (Fase 15.1): data URL de imagem, no maximo 300 KB.
// O ecra reduz a imagem antes de enviar; aqui so se aceita imagem e o tamanho.
const LOGO_MAX = 300 * 1024;
const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const hoursSchema = z.object({
  opening_time: z.string().regex(HHMM, 'Hora no formato HH:MM'),
  closing_time: z.string().regex(HHMM, 'Hora no formato HH:MM'),
});
const discountSchema = z.object({ discount_free_pct: z.number().int().min(0).max(100) });
const monthCloseSchema = z.object({ month_close_day: z.number().int().min(1, 'entre 1 e 28').max(28, 'entre 1 e 28') });
const { RETENTION_OPTIONS } = require('../utils/auditGroups');
const { reportsWhatsappEnabled } = require('../services/reportJob');
const auditRetentionSchema = z.object({ months: z.number().int().refine((m) => RETENTION_OPTIONS.includes(m), 'Escolha 2, 3, 6, 12 ou 24 meses (mínimo 2).') });
const reportScheduleSchema = z.object({
  daily_report_time: z.string().regex(HHMM, 'Hora do relatório diário inválida (HH:MM).'),
  weekly_report_day: z.number().int().min(0, 'Dia da semana entre domingo (0) e sábado (6).').max(6, 'Dia da semana entre domingo (0) e sábado (6).'),
  weekly_report_time: z.string().regex(HHMM, 'Hora do relatório semanal inválida (HH:MM).'),
  monthly_report_time: z.string().regex(HHMM, 'Hora do relatório mensal inválida (HH:MM).'),
});
const expiryAlertSchema = z.object({ expiry_alert_days: z.number().int().min(1, 'mínimo 1 dia').max(90, 'máximo 90 dias') });
const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'O PIN tem 4 a 6 dígitos'),
  owner_password: z.string().min(1, 'Confirme com a sua senha'),
});
const fixedCostSchema = z.object({
  description: z.string().trim().min(2).max(120),
  amount: z.number().int().positive(), // centavos
  type: z.enum(FIXED_COST_TYPES),
  // Fase 15.3: anual = repartido por 12 meses no lucro.
  period: z.enum(['monthly', 'annual']).optional().default('monthly'),
});

const tenantId = (req) => req.user.tenantId;

router.get('/', asyncHandler(async (req, res) => {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId(req) } });
  if (!t) throw httpError(404, 'Estabelecimento não encontrado');
  const fixed = await prisma.fixedCost.findMany({ where: { tenant_id: t.id }, orderBy: { description: 'asc' } });
  res.json({
    store: { name: t.name, location: t.location, phone: t.phone, email: t.email, business_type: t.business_type, nuit: t.nuit || null, receipt_footer: t.receipt_footer || null, has_logo: Boolean(t.logo_data) },
    // Etapa C: ponto no mapa (null = ainda por configurar).
    geo: t.lat != null && t.lng != null ? { lat: t.lat, lng: t.lng, address: t.address || null } : null,
    hours: { opening_time: t.opening_time || '08:00', closing_time: t.closing_time || '20:00', schedule: H.parse(t) },
    discount_free_pct: t.discount_free_pct,
    custom_items_enabled: t.custom_items_enabled !== false,
    expiry_alert_days: t.expiry_alert_days,
    month_close_day: t.month_close_day,
    audit_retention_months: t.audit_retention_months,
    report_schedule: { daily_report_time: t.daily_report_time, weekly_report_day: t.weekly_report_day, weekly_report_time: t.weekly_report_time, monthly_report_time: t.monthly_report_time },
    // Envio automatico desligado ate haver numero WhatsApp Business aprovado (decisao 11/10).
    reports_whatsapp_enabled: reportsWhatsappEnabled(),
    authorization_pin_configured: Boolean(t.cancel_pin_hash),
    // Fase 15.2/15.3: regime de impostos das vendas e INSS do patrao.
    taxes: { vat_mode: t.vat_mode || 'none', vat_rate_std: t.vat_rate_std ?? 16, inss_employer_pct: t.inss_employer_pct || 0 },
    status: t.status,
    trial_ends_at: t.trial_ends_at,
    fixed_costs: fixed,
    fixed_costs_monthly_total: fixed.reduce((s, c) => s + monthlyAmount(c), 0),
  });
}));

router.put('/store', asyncHandler(async (req, res) => {
  const data = storeSchema.parse(req.body);
  // E2: o gerente muda so a mensagem do recibo (nome, contacto e NUIT sao do dono).
  if (req.user.role === 'manager' && Object.keys(data).some((k) => k !== 'receipt_footer' && data[k] !== undefined)) {
    throw httpError(403, 'O gerente só pode mudar a mensagem do recibo.', 'MANAGER_FORBIDDEN');
  }
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { name: true, location: true, phone: true, email: true, nuit: true, receipt_footer: true } });
  const t = await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_STORE', entityType: 'tenant', entityId: t.id, oldValue: before, newValue: data });
  res.json({ ok: true });
}));

// Fase 15.2/15.3: regime de impostos (sem / IVA / ISPC) e INSS do patrao (0 ou 4%).
const taxesSchema = z.object({
  vat_mode: z.enum(VAT_MODES).optional(),
  // Etapa A: taxas escritas pelo dono (ex.: IVA 15%, INSS 2%), inteiros de 0 a 30.
  vat_rate_std: z.number().int().min(RATE_MIN, 'A taxa do IVA vai de 0 a 30%').max(RATE_MAX, 'A taxa do IVA vai de 0 a 30%').optional(),
  inss_employer_pct: z.number().int().min(RATE_MIN, 'O INSS vai de 0 a 30%').max(RATE_MAX, 'O INSS vai de 0 a 30%').optional(),
});
router.put('/taxes', asyncHandler(async (req, res) => {
  const data = taxesSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { vat_mode: true, vat_rate_std: true, inss_employer_pct: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_TAXES', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: data });
  res.json({ ok: true });
}));

// Dados do recibo para reimprimir no painel (logotipo incluido; nao vai no GET / para nao pesar).
router.get('/receipt', asyncHandler(async (req, res) => {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { name: true, location: true, phone: true, nuit: true, receipt_footer: true, logo_data: true } });
  if (!t) throw httpError(404, 'Estabelecimento não encontrado');
  res.json({ name: t.name, location: t.location, phone: t.phone, nuit: t.nuit, receipt_footer: t.receipt_footer, logo: t.logo_data });
}));

router.put('/logo', asyncHandler(async (req, res) => {
  const { logo } = z.object({ logo: z.string().nullable() }).parse(req.body || {});
  if (logo !== null) {
    if (!LOGO_RE.test(logo)) throw httpError(400, 'O logótipo tem de ser uma imagem PNG, JPEG ou WebP.', 'INVALID_LOGO');
    if (logo.length > LOGO_MAX * 1.37) throw httpError(413, 'O logótipo é demasiado grande (máximo 300 KB).', 'LOGO_TOO_LARGE');
  }
  await prisma.tenant.update({ where: { id: tenantId(req) }, data: { logo_data: logo } });
  await writeAudit({ req, action: logo ? 'UPDATE_LOGO' : 'REMOVE_LOGO', entityType: 'tenant', entityId: tenantId(req) });
  res.json({ ok: true, has_logo: Boolean(logo) });
}));

// 31/10: horario por dia, 24 h, depois da meia-noite, pausas e feriados ({ schedule }).
// O pedido antigo ({ opening_time, closing_time }) continua a funcionar (igual todos os dias).
router.put('/hours', asyncHandler(async (req, res) => {
  const schedule = hoursFromBody(req.body);
  const data = { ...H.summary(schedule), hours_json: JSON.stringify(schedule) };
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  forgetSchedule(tenantId(req));
  await writeAudit({ req, action: 'UPDATE_HOURS', entityType: 'tenant', entityId: tenantId(req), newValue: { mode: schedule.mode, day_end: schedule.day_end, opening_time: data.opening_time, closing_time: data.closing_time } });
  res.json({ ok: true, opening_time: data.opening_time, closing_time: data.closing_time, schedule });
}));

function hoursFromBody(body) {
  if (body && body.schedule) {
    try { return H.normalize(body.schedule); } catch (err) { throw httpError(400, err.message, 'INVALID_HOURS'); }
  }
  const legacy = hoursSchema.parse(body);
  return H.fromLegacy(legacy.opening_time, legacy.closing_time);
}

router.put('/discount', asyncHandler(async (req, res) => {
  const data = discountSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { discount_free_pct: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_DISCOUNT_POLICY', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: data });
  res.json({ ok: true, ...data });
}));

// Etapa A: venda personalizada (artigo fora do catalogo) no terminal, ligada ou nao.
// Etapa C: ponto do estabelecimento no mapa (GPS, link do Google Maps ou coordenadas).
router.put('/location', asyncHandler(async (req, res) => {
  const data = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), address: z.string().trim().max(200).optional().nullable() }).parse(req.body);
  if (!validCoords(data.lat, data.lng)) throw httpError(400, 'Localização inválida.', 'BAD_LOCATION');
  const lat = Math.round(data.lat * 1e6) / 1e6;
  const lng = Math.round(data.lng * 1e6) / 1e6;
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { lat: true, lng: true, address: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data: { lat, lng, address: data.address || null } });
  await writeAudit({ req, action: 'UPDATE_LOCATION', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: { lat, lng, address: data.address || null } });
  res.json({ ok: true, location: { lat, lng, address: data.address || null } });
}));

// Link do Google Maps -> coordenadas. Os links curtos (maps.app.goo.gl) so se
// abrem para ler o destino; so enderecos do Google (utils/geo.js mapsLinkKind).
router.post('/location/resolve', asyncHandler(async (req, res) => {
  const { text } = z.object({ text: z.string().trim().min(3).max(2000) }).parse(req.body);
  let found = parseLocation(text);
  if (!found && mapsLinkKind(text) === 'short') {
    try {
      let url = text.trim();
      for (let i = 0; i < 4 && !found; i++) {
        const r = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(8000) });
        const next = r.headers.get('location');
        if (!next) break;
        found = parseLocation(decodeURIComponent(next));
        if (!mapsLinkKind(next)) break; // so segue para o Google
        url = next;
      }
    } catch { /* sem rede ou link invalido: responde abaixo */ }
  }
  if (!found) throw httpError(400, 'Não encontrei a localização nesse link. Abra o local no Google Maps, toque em «Partilhar» e copie o link.', 'LOCATION_NOT_FOUND');
  res.json(found);
}));

router.put('/custom-items', asyncHandler(async (req, res) => {
  const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
  await prisma.tenant.update({ where: { id: tenantId(req) }, data: { custom_items_enabled: enabled } });
  await writeAudit({ req, action: 'UPDATE_CUSTOM_ITEMS', entityType: 'tenant', entityId: tenantId(req), newValue: { custom_items_enabled: enabled } });
  res.json({ ok: true, custom_items_enabled: enabled });
}));

// Quantos dias antes da validade um lote aparece nos alertas.
router.put('/expiry-alert', asyncHandler(async (req, res) => {
  const data = expiryAlertSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { expiry_alert_days: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_EXPIRY_ALERT', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: data });
  res.json({ ok: true, ...data });
}));

// Horarios dos relatorios por WhatsApp (Fase 8.7, pedido do fundador 10/10).
router.put('/report-schedule', asyncHandler(async (req, res) => {
  const data = reportScheduleSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { daily_report_time: true, weekly_report_day: true, weekly_report_time: true, monthly_report_time: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data });
  await writeAudit({ req, action: 'UPDATE_REPORT_SCHEDULE', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: data });
  res.json({ ok: true, report_schedule: data });
}));

// Quantos meses a auditoria guarda (Fase 8.5; decisao do fundador: o dono
// escolhe, minimo 2). O mais antigo apaga-se sozinho (services/auditRetention.js).
router.put('/audit-retention', asyncHandler(async (req, res) => {
  const { months } = auditRetentionSchema.parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { audit_retention_months: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data: { audit_retention_months: months } });
  await writeAudit({ req, action: 'UPDATE_AUDIT_RETENTION', entityType: 'tenant', entityId: tenantId(req), oldValue: { months: before?.audit_retention_months }, newValue: { months } });
  res.json({ ok: true, audit_retention_months: months });
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
  // A senha e da pessoa (estabelecimento de casa); o PIN fica neste estabelecimento.
  const me = await findSelf(req, { password_hash: true });
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
// Fase 15.3: multa = despesa de tipo proprio, com a entidade que multou (categoria «Multa»).
const expenseSchema = z.object({
  date: z.string().regex(DAY, 'Data no formato AAAA-MM-DD'),
  kind: z.enum(['expense', 'fine']).optional().default('expense'),
  category: z.string().trim().max(40).optional().default(''),
  entity: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(160).optional().default(''),
  amount: z.number().int().positive(), // centavos
}).superRefine((d, ctx) => {
  if (d.kind === 'expense' && d.category.length < 2) ctx.addIssue({ code: 'custom', path: ['category'], message: 'Escolha ou escreva a categoria' });
  if (d.kind === 'fine' && (d.entity || '').length < 2) ctx.addIssue({ code: 'custom', path: ['entity'], message: 'Indique quem passou a multa (ex.: Conselho Municipal, INAE)' });
}).transform((d) => (d.kind === 'fine' ? { ...d, category: 'Multa' } : { ...d, entity: null }));
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
    fines_total: rows.reduce((s, e) => s + (e.kind === 'fine' ? e.amount : 0), 0),
    by_category: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    categories: EXPENSE_CATEGORIES,
  });
}));

router.post('/expenses', asyncHandler(async (req, res) => {
  const data = expenseSchema.parse(req.body);
  const expense = await prisma.expense.create({
    data: { tenant_id: tenantId(req), date: expenseDate(data.date), kind: data.kind, entity: data.entity, category: data.category, description: data.description, amount: data.amount, created_by: req.user.userId },
  });
  await writeAudit({ req, action: 'CREATE_EXPENSE', entityType: 'expense', entityId: expense.id, newValue: data });
  publish({ type: 'expense', tenant_id: tenantId(req), total: data.amount, label: data.description || data.category || null });
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
    data: { date: expenseDate(data.date), kind: data.kind, entity: data.entity, category: data.category, description: data.description, amount: data.amount },
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
