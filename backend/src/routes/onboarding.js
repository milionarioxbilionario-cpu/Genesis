// Onboarding numa so operacao (31/10/2026).
//
//   POST /api/onboarding/complete   tipo, catalogo, renda, custos, trabalhadores,
//                                   fornecedores e horario — tudo ou nada
//
// Antes o ecra mandava 6 ou mais pedidos seguidos. Se um falhava a meio (ex.: um
// codigo de barras curto), os anteriores ja estavam gravados e «Concluir» outra
// vez duplicava a renda (que saia 2 vezes no lucro do mes), os custos, os
// trabalhadores e os fornecedores. Agora tudo e validado antes de gravar e
// gravado numa transaccao; o onboarding_completed e reclamado nessa transaccao,
// por isso dois cliques (ou a resposta perdida e o repetir) nao gravam 2 vezes.
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { BUSINESS_TYPES } = require('../utils/businessTypes');
const { parseCatalog, insertCatalogTx } = require('./catalogs');
const H = require('../utils/hours');

const router = express.Router();
router.use(auth, requireRole('owner'));
router.use((req, res, next) => (req.user.scope ? next(httpError(403, 'Não disponível nesta sessão.', 'SCOPE_RESTRICTED')) : next()));

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const money = z.number().int().nonnegative().max(100_000_000_000); // centavos
const schema = z.object({
  business_type: z.enum(BUSINESS_TYPES),
  products: z.array(z.any()).max(1000),
  rent: money.optional().default(0),
  costs: z.array(z.object({ description: z.string().trim().min(2, 'Escreva para que é o custo').max(120), amount: money.refine((v) => v > 0, 'O custo tem de ser maior que zero') })).max(50).optional().default([]),
  employees: z.array(z.object({ name: z.string().trim().min(2, 'Nome do trabalhador curto').max(80), role: z.string().trim().min(2, 'Escreva a função do trabalhador').max(60), monthly_salary: money })).max(200).optional().default([]),
  suppliers: z.array(z.object({ name: z.string().trim().min(1).max(120), phone: z.string().trim().max(30).nullish(), delivery_cost_per_visit: money.optional().default(0) })).max(200).optional().default([]),
  // Horario antigo ({ opening_time, closing_time }) ou o novo ({ schedule }).
  hours: z.object({ opening_time: z.string().regex(HHMM, 'Hora no formato HH:MM').optional(), closing_time: z.string().regex(HHMM, 'Hora no formato HH:MM').optional(), schedule: z.any().optional() }),
});

router.post('/complete', asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  // Tipos «brevemente» continuam a poder configurar-se (vendem no modo comercio
  // ate o modo proprio chegar), como no ecra do onboarding.
  // Validar TUDO antes de gravar o que quer que seja.
  const products = parseCatalog(data.products);
  if (!products.length) throw httpError(400, 'Escolha pelo menos um produto (pode acrescentar mais depois).', 'EMPTY_CATALOG');
  const tenantId = req.user.tenantId;
  const userId = req.user.userId;
  const ip = req.ip || '0.0.0.0';
  let schedule;
  try {
    schedule = data.hours.schedule ? H.normalize(data.hours.schedule) : H.fromLegacy(data.hours.opening_time, data.hours.closing_time);
  } catch (err) { throw httpError(400, err.message, 'INVALID_HOURS'); }
  const hoursData = { ...H.summary(schedule), hours_json: JSON.stringify(schedule) };

  const result = await prisma.$transaction(async (tx) => {
    // Reclamar o onboarding primeiro: um 2.o pedido igual fica aqui (sem gravar nada).
    const claimed = await tx.tenant.updateMany({
      where: { id: tenantId, onboarding_completed: false },
      data: { onboarding_completed: true, business_type: data.business_type, ...hoursData },
    });
    if (claimed.count !== 1) throw httpError(409, 'Este estabelecimento já está configurado.', 'ONBOARDING_DONE');

    const fixed = [
      ...(data.rent > 0 ? [{ tenant_id: tenantId, description: 'Renda', amount: data.rent, type: 'rent' }] : []),
      ...data.costs.map((c) => ({ tenant_id: tenantId, description: c.description, amount: c.amount, type: 'other' })),
    ];
    if (fixed.length) await tx.fixedCost.createMany({ data: fixed });
    if (data.employees.length) {
      await tx.employee.createMany({ data: data.employees.map((e) => ({ tenant_id: tenantId, name: e.name, role: e.role, monthly_salary: e.monthly_salary, start_date: new Date(), is_active: true })) });
    }
    if (data.suppliers.length) {
      await tx.supplier.createMany({ data: data.suppliers.map((s) => ({ tenant_id: tenantId, name: s.name, phone: s.phone || '', delivery_cost_per_visit: s.delivery_cost_per_visit, is_active: true })) });
    }
    const imported = await insertCatalogTx(tx, { tenantId, userId, ip, businessType: data.business_type, products });
    await tx.auditLog.create({ data: {
      tenant_id: tenantId, user_id: userId, action: 'ONBOARDING_COMPLETED', entity_type: 'tenant', entity_id: tenantId, ip_address: ip,
      new_value: JSON.stringify({ business_type: data.business_type, products: imported, rent: data.rent, costs: data.costs.length, employees: data.employees.length, suppliers: data.suppliers.length, hours: { mode: schedule.mode, opening_time: hoursData.opening_time, closing_time: hoursData.closing_time } }),
    } });
    return { imported };
  });
  res.status(201).json({ ok: true, imported: result.imported, onboarding_completed: true });
}));

module.exports = router;
