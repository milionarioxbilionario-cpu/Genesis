const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');

const shiftClosingSchema = z.object({
  counted_amount: z.number().int().nonnegative(),
  expected_amount: z.number().int().nonnegative(),
  notes: z.string().optional().nullable()
});

router.get('/', async (req, res) => {
  try {
    const shiftClosings = await prisma.shiftClosing.findMany({
      where: { tenant_id: req.user.tenantId },
      orderBy: { closed_at: 'desc' },
      take: 20
    });
    return res.json(shiftClosings);
  } catch (err) {
    console.error('List shift closings error', err);
    return res.status(500).json({ error: 'Erro ao listar fechamentos de turno' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = shiftClosingSchema.parse(req.body);

    if (!req.user || !req.user.userId || !req.user.tenantId) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const difference = data.counted_amount - data.expected_amount;

    const record = await prisma.shiftClosing.create({
      data: {
        tenant_id: req.user.tenantId,
        cashier_user_id: req.user.userId,
        counted_amount: data.counted_amount,
        expected_amount: data.expected_amount,
        difference,
      }
    });

    await prisma.auditLog.create({
      data: {
        tenant_id: req.user.tenantId,
        user_id: req.user.userId,
        action: 'SHIFT_CLOSING',
        entity_type: 'shift_closing',
        entity_id: record.id,
        ip_address: req.ip || '0.0.0.0',
        old_value: null,
        new_value: {
          counted_amount: data.counted_amount,
          expected_amount: data.expected_amount,
          difference
        }
      }
    });

    return res.status(201).json({
      id: record.id,
      counted_amount: record.counted_amount,
      expected_amount: record.expected_amount,
      difference: record.difference,
      closed_at: record.closed_at
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    console.error('Create shift closing error', err);
    return res.status(500).json({ error: 'Erro ao registrar fecho de turno' });
  }
});

module.exports = router;
