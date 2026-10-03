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

router.get('/stock', auth, requireRole('owner'), async (req, res) => {
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

    const product = await prisma.product.findFirst({ where: { id: data.product_id, tenant_id: req.user.tenantId } });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (data.supplier_id) {
      const supplier = await prisma.supplier.findFirst({ where: { id: data.supplier_id, tenant_id: req.user.tenantId } });
      if (!supplier) return res.status(400).json({ error: 'Fornecedor não pertence a esta loja' });
    }
    if (data.quantity <= 0) return res.status(400).json({ error: 'Quantidade tem de ser maior que zero' });

    const result = await prisma.$transaction(async (tx) => {
      // Increment atomico (antes: valor absoluto lido fora da transaccao — uma
      // venda pelo meio era apagada e o stock ficava inflacionado).
      const updatedProduct = await tx.product.update({
        where: { id: data.product_id },
        data: {
          stock_qty: { increment: data.quantity },
          cost_price: data.unit_cost
        }
      });
      if (data.unit_cost !== product.cost_price) {
        await tx.productPriceHistory.create({ data: {
          tenant_id: req.user.tenantId, product_id: product.id, old_cost: product.cost_price,
          new_cost: data.unit_cost, changed_by: req.user.userId,
        } });
      }

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

// Editar / desactivar fornecedor.
router.put('/suppliers/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    const data = supplierSchema.partial().parse(req.body);
    const own = await prisma.supplier.findFirst({ where: { id: req.params.id, tenant_id: req.user.tenantId } });
    if (!own) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    const supplier = await prisma.supplier.update({ where: { id: own.id }, data: { ...data, phone: data.phone === null ? '' : data.phone } });
    return res.json(supplier);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    console.error('Update supplier error', err);
    return res.status(500).json({ error: 'Erro ao actualizar fornecedor' });
  }
});

// Compras (entradas de stock) de um fornecedor.
router.get('/suppliers/:id/entries', auth, requireRole('owner'), async (req, res) => {
  try {
    const own = await prisma.supplier.findFirst({ where: { id: req.params.id, tenant_id: req.user.tenantId } });
    if (!own) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    const entries = await prisma.stockEntry.findMany({
      where: { tenant_id: req.user.tenantId, supplier_id: own.id },
      include: { product: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
      take: 100
    });
    return res.json(entries);
  } catch (err) {
    console.error('Supplier entries error', err);
    return res.status(500).json({ error: 'Erro ao listar compras' });
  }
});

// Historico de precos de custo (especificacao 6.4).
router.get('/price-history', auth, requireRole('owner'), async (req, res) => {
  try {
    const where = { tenant_id: req.user.tenantId };
    if (typeof req.query.product_id === 'string' && req.query.product_id) where.product_id = req.query.product_id;
    const rows = await prisma.productPriceHistory.findMany({
      where,
      include: { product: { select: { name: true } }, changedBy: { select: { name: true } } },
      orderBy: { changed_at: 'desc' },
      take: 200
    });
    return res.json(rows.map((r) => ({
      id: r.id, product_id: r.product_id, product_name: r.product?.name, old_cost: r.old_cost,
      new_cost: r.new_cost, changed_at: r.changed_at, changed_by: r.changedBy?.name || null,
    })));
  } catch (err) {
    console.error('Price history error', err);
    return res.status(500).json({ error: 'Erro ao carregar histórico de preços' });
  }
});

module.exports = router;
