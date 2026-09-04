const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1).default('Geral'),
  barcode: z.string().optional().nullable(),
  sell_price: z.number().int().nonnegative().default(0),
  cost_price: z.number().int().nonnegative().default(0),
  stock_qty: z.number().int().nonnegative().default(0),
  min_stock: z.number().int().nonnegative().default(5),
  has_expiry: z.boolean().optional().default(false),
  expiry_date: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true)
});

const updateProductSchema = productSchema.partial();

router.get('/', auth, requireRole('owner', 'cashier'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const products = await prisma.product.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' }
    });
    return res.json(products);
  } catch (err) {
    console.error('List products error', err);
    return res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

router.post('/', auth, requireRole('owner'), async (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const tenantId = req.user.tenantId;

    const product = await prisma.product.create({
      data: {
        tenant: { connect: { id: tenantId } },
        name: data.name,
        category: data.category,
        barcode: data.barcode || null,
        cost_price: data.cost_price,
        sell_price: data.sell_price,
        stock_qty: data.stock_qty,
        min_stock: data.min_stock,
        has_expiry: data.has_expiry,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
        is_active: true
      }
    });

    return res.status(201).json(product);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    console.error('Create product error', err);
    return res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Update product (partial)
const productUpdateSchema = productSchema.partial();
const stockAdjustmentSchema = z.object({
  delta: z.number().int(),
  reason: z.string().optional().default('manual_adjustment')
});

router.patch('/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    const data = productUpdateSchema.parse(req.body);
    const tenantId = req.user.tenantId;
    const id = req.params.id;

    // Fetch existing product
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.tenant_id !== tenantId) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const updateData = {};
    if (typeof data.name !== 'undefined') updateData.name = data.name;
    if (typeof data.category !== 'undefined') updateData.category = data.category;
    if (typeof data.barcode !== 'undefined') updateData.barcode = data.barcode || null;
    if (typeof data.cost_price !== 'undefined') updateData.cost_price = data.cost_price;
    if (typeof data.sell_price !== 'undefined') updateData.sell_price = data.sell_price;
    if (typeof data.stock_qty !== 'undefined') updateData.stock_qty = data.stock_qty;
    if (typeof data.min_stock !== 'undefined') updateData.min_stock = data.min_stock;
    if (typeof data.has_expiry !== 'undefined') updateData.has_expiry = data.has_expiry;
    if (typeof data.expiry_date !== 'undefined') updateData.expiry_date = data.expiry_date ? new Date(data.expiry_date) : null;
    if (typeof data.is_active !== 'undefined') updateData.is_active = data.is_active;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({ where: { id }, data: updateData });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenant: { connect: { id: tenantId } },
          user: { connect: { id: req.user.userId || req.user.userId } },
          action: 'UPDATE_PRODUCT',
          entity_type: 'product',
          entity_id: id,
          old_value: existing,
          new_value: updateData,
          ip_address: req.ip || '0.0.0.0'
        }
      });

      return p;
    });

    return res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    console.error('Update product error', err);
    return res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Soft-delete product (set is_active = false)
router.delete('/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const id = req.params.id;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.tenant_id !== tenantId) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({ where: { id }, data: { is_active: false } });
      await tx.auditLog.create({
        data: {
          tenant: { connect: { id: tenantId } },
          user: { connect: { id: req.user.userId || req.user.userId } },
          action: 'DELETE_PRODUCT',
          entity_type: 'product',
          entity_id: id,
          old_value: existing,
          new_value: { is_active: false },
          ip_address: req.ip || '0.0.0.0'
        }
      });
      return p;
    });

    return res.json({ id: deleted.id, message: 'Produto removido' });
  } catch (err) {
    console.error('Delete product error', err);
    return res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

router.patch('/:id/stock', auth, requireRole('owner', 'cashier'), async (req, res) => {
  try {
    const productId = req.params.id;
    const tenantId = req.user.tenantId;
    const deltaSchema = z.object({
      delta: z.number().int(),
      unit_cost: z.number().int().nonnegative().optional(),
      reason: z.string().optional().default('stock_adjustment')
    });

    const data = deltaSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.tenant_id !== tenantId) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const nextQty = product.stock_qty + data.delta;
    if (nextQty < 0) {
      return res.status(400).json({ error: 'Estoque insuficiente para esta operação' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.product.update({
        where: { id: productId },
        data: { stock_qty: nextQty }
      });

      if (data.delta !== 0) {
        await tx.stockEntry.create({
          data: {
            tenant_id: tenantId,
            product_id: productId,
            quantity: data.delta,
            unit_cost: data.unit_cost ?? product.cost_price,
            recorded_by: req.user.userId,
            supplier_id: null,
            created_at: new Date()
          }
        });
      }

      return current;
    });

    return res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    console.error('Stock adjustment error', err);
    return res.status(500).json({ error: 'Erro ao ajustar stock' });
  }
});

module.exports = router;
