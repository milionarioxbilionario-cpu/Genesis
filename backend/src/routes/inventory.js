const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

const supplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  delivery_cost_per_visit: z.number().int().nonnegative().default(0),
  is_active: z.boolean().optional().default(true)
});

const stockEntrySchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  unit_cost: z.number().int().nonnegative(),
  supplier_id: z.string().uuid().nullable().optional(),
  reason: z.string().optional().default('purchase')
});

router.get('/suppliers', auth, requireRole('owner'), async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { tenant_id: req.user.tenantId, is_active: true },
      orderBy: { name: 'asc' }
    });
    return res.json(suppliers);
  } catch (err) {
    console.error('List suppliers error', err);
    return res.status(500).json({ error: 'Erro ao listar fornecedores' });
  }
});

router.post('/suppliers', auth, requireRole('owner'), async (req, res) => {
  try {
    const data = supplierSchema.parse(req.body);
    const supplier = await prisma.supplier.create({
      data: {
        tenant_id: req.user.tenantId,
        name: data.name,
        phone: data.phone || '',
        delivery_cost_per_visit: data.delivery_cost_per_visit,
        is_active: data.is_active
      }
    });
    return res.status(201).json(supplier);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    console.error('Create supplier error', err);
    return res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

router.get('/stock', auth, requireRole('owner', 'cashier'), async (req, res) => {
  try {
    const entries = await prisma.stockEntry.findMany({
      where: { tenant_id: req.user.tenantId },
      include: { product: true },
      orderBy: { created_at: 'desc' },
      take: 20
    });
    return res.json(entries);
  } catch (err) {
    console.error('List stock entries error', err);
    return res.status(500).json({ error: 'Erro ao listar entradas de stock' });
  }
});

router.post('/stock', auth, requireRole('owner'), async (req, res) => {
  try {
    const data = stockEntrySchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: data.product_id } });
    if (!product || product.tenant_id !== req.user.tenantId) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: data.product_id },
        data: {
          stock_qty: product.stock_qty + data.quantity,
          cost_price: data.unit_cost
        }
      });

      const newEntry = await tx.stockEntry.create({
        data: {
          tenant_id: req.user.tenantId,
          product_id: data.product_id,
          quantity: data.quantity,
          unit_cost: data.unit_cost,
          supplier_id: data.supplier_id || null,
          recorded_by: req.user.userId,
          created_at: new Date()
        }
      });

      return { product: updatedProduct, entry: newEntry };
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    console.error('Create stock entry error', err);
    return res.status(500).json({ error: 'Erro ao registrar entrada de stock' });
  }
});

module.exports = router;
