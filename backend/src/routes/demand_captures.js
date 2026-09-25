const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { applyTenantRls } = require('../utils/tenantRls');

const schema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  recorded_by: z.string().uuid().optional(),
  requested_at: z.string().optional()
});

router.post('/', async (req, res) => {
  try {
    const data = schema.parse(req.body);
    const tenantId = (req.user && req.user.tenantId) ? req.user.tenantId : null;
    const userId = (req.user && req.user.userId) ? req.user.userId : null;

    if (!tenantId) return res.status(400).json({ error: 'Tenant não identificado' });

    const result = await prisma.$transaction(async (tx) => {
      // Contexto de tenant para as politicas RLS do Postgres (no-op em SQLite).
      await applyTenantRls(tx, tenantId);

      const product = await tx.product.findUnique({ where: { id: data.product_id } });
      if (!product || product.tenant_id !== tenantId) throw new Error('Produto não encontrado para este tenant');

      if (data.id) {
        const exists = await tx.demandCapture.findUnique({ where: { id: data.id } });
        if (exists) return { existed: true, id: exists.id };
      }

      const dc = await tx.demandCapture.create({
        data: {
          id: data.id || undefined,
          tenant_id: tenantId,
          product_id: data.product_id,
          recorded_by: userId || null,
          requested_at: data.requested_at ? new Date(data.requested_at) : new Date()
        }
      });

      const newValue = { product_id: data.product_id };
      if (req.deviceKey && req.deviceKey.id) newValue.device_key_id = req.deviceKey.id;

      await tx.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: userId || null,
          action: 'CREATE_DEMAND_CAPTURE',
          entity_type: 'demand_capture',
          entity_id: dc.id,
          old_value: null,
          new_value: JSON.stringify(newValue),
          ip_address: req.ip || '0.0.0.0'
        }
      });

      return { existed: false, id: dc.id };
    });

    if (result.existed) return res.status(200).json({ id: result.id, message: 'Já existe' });
    return res.status(201).json({ id: result.id });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    console.error('Create demand capture error', err);
    return res.status(500).json({ error: err.message || 'Erro ao criar demand capture' });
  }
});

module.exports = router;
