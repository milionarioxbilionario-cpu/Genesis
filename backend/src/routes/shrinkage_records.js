const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { applyTenantRls } = require('../utils/tenantRls');

function businessError(statusCode, message) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

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

      // Idempotencia: o POS reenvia o mesmo id se a resposta se perder. Antes o
      // segundo envio rebentava na chave primaria e a quebra ficava presa na fila.
      if (data.id) {
        const existing = await tx.shrinkageRecord.findFirst({ where: { id: data.id, tenant_id: tenantId } });
        if (existing) return { recId: existing.id, existed: true };
      }

      const product = await tx.product.findFirst({ where: { id: data.product_id, tenant_id: tenantId } });
      if (!product) throw businessError(400, 'Produto não encontrado para este tenant');

      // Decremento atomico com guarda (antes: ler, calcular e escrever um valor
      // absoluto — uma venda pelo meio perdia-se).
      const dec = await tx.product.updateMany({
        where: { id: data.product_id, tenant_id: tenantId, stock_qty: { gte: data.quantity } },
        data: { stock_qty: { decrement: data.quantity } }
      });
      if (dec.count !== 1) throw businessError(409, 'Quantidade a registar excede stock actual');
      const newQty = (await tx.product.findUnique({ where: { id: data.product_id }, select: { stock_qty: true } })).stock_qty;

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
      if (req.user.tid) newValue.terminal_id = req.user.tid;

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

    return res.status(result.existed ? 200 : 201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    // Antes: QUALQUER erro (incluindo falha da BD) saia como 400 — o POS tratava
    // uma falha passageira como recusa definitiva. So regras de negocio sao 4xx.
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('Create shrinkage record error', err);
    return res.status(500).json({ error: 'Erro ao registar quebra' });
  }
});

module.exports = router;
