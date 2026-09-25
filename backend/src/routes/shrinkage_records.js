const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { applyTenantRls } = require('../utils/tenantRls');

const schema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.enum(['broken','expired','internal_consumption','other']).optional().default('other'),
  recorded_by: z.string().uuid().optional()
});

router.post('/', async (req, res) => {
  try {
    const data = schema.parse(req.body);
    const tenantId = (req.user && req.user.tenantId) ? req.user.tenantId : null;
    const userId = (req.user && req.user.userId) ? req.user.userId : null;

    if (!tenantId) return res.status(400).json({ error: 'Tenant não identificado' });

    // Transaction: create shrinkage record and decrement stock
    const result = await prisma.$transaction(async (tx) => {
      // Contexto de tenant para as politicas RLS do Postgres (no-op em SQLite).
      await applyTenantRls(tx, tenantId);

      const product = await tx.product.findUnique({ where: { id: data.product_id } });
      if (!product || product.tenant_id !== tenantId) throw new Error('Produto não encontrado para este tenant');
      if (product.stock_qty < data.quantity) throw new Error('Quantidade a registar excede stock actual');

      const newQty = product.stock_qty - data.quantity;
      await tx.product.update({ where: { id: data.product_id }, data: { stock_qty: newQty } });

      const rec = await tx.shrinkageRecord.create({
        data: {
          id: data.id || undefined,
          tenant_id: tenantId,
          product_id: data.product_id,
          quantity: data.quantity,
          reason: data.reason,
          recorded_by: userId || null,
          recorded_at: new Date()
        }
      });

      const newValue = { new_stock: newQty, quantity: data.quantity, reason: data.reason };
      if (req.deviceKey && req.deviceKey.id) newValue.device_key_id = req.deviceKey.id;

      await tx.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: userId || null,
          action: 'CREATE_SHRINKAGE',
          entity_type: 'shrinkage_record',
          entity_id: rec.id,
          old_value: JSON.stringify({ previous_stock: product.stock_qty }),
          new_value: JSON.stringify(newValue),
          ip_address: req.ip || '0.0.0.0'
        }
      });

      return { recId: rec.id, newStock: newQty };
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    console.error('Create shrinkage record error', err);
    return res.status(400).json({ error: err.message || 'Erro ao criar shrinkage record' });
  }
});

module.exports = router;
