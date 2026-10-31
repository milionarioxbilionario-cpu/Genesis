const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { lineAmount } = require('../utils/units');
const { publish } = require('../utils/liveBus');
const { attachPeople } = require('../utils/peopleNames');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { addLot } = require('../utils/stockLots');

// Validade em AAAA-MM-DD (o <input type="date"> do browser).
const expiryDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data de validade inválida').nullable().optional();

const supplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  delivery_cost_per_visit: z.number().int().nonnegative().default(0),
  is_active: z.boolean().optional().default(true)
});

// Compra de um produto que ja existe (Fase 8.3, "Ajuste manual" > Adicionar):
// uma quantidade com uma validade, ou varias linhas `lots` (ex.: 50 un. a 17/10
// e 50 a 20/10). Cada linha e uma entrada + um lote; com fornecedor, o custo de
// entrega conta uma visita por dia (services/monthlyDeductions.js).
const stockEntrySchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().nonnegative().optional(),
  unit_cost: z.number().int().nonnegative(),
  supplier_id: z.string().uuid().nullable().optional(),
  expiry_date: expiryDateSchema,
  lots: z.array(z.object({
    quantity: z.number().int().positive('quantidade do lote tem de ser maior que zero').max(1_000_000),
    expiry_date: expiryDateSchema,
  })).min(1).max(20, 'no máximo 20 validades').optional(),
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
    // E2: o custo de entrega entra nas deducoes do mes (do dono): o gerente nao o escreve.
    if (req.user.role === 'manager') data.delivery_cost_per_visit = 0;
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

// E2: o gerente regista a entrada sem custo — usa-se o custo actual do produto.
const managerStockEntrySchema = stockEntrySchema.extend({ unit_cost: z.number().int().nonnegative().optional() });

router.post('/stock', auth, requireRole('owner'), async (req, res) => {
  try {
    const byManager = req.user.role === 'manager';
    const data = (byManager ? managerStockEntrySchema : stockEntrySchema).parse(req.body);

    const product = await prisma.product.findFirst({ where: { id: data.product_id, tenant_id: req.user.tenantId } });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (byManager) data.unit_cost = product.cost_price;
    if (data.supplier_id) {
      const supplier = await prisma.supplier.findFirst({ where: { id: data.supplier_id, tenant_id: req.user.tenantId } });
      if (!supplier) return res.status(400).json({ error: 'Fornecedor não pertence a este estabelecimento' });
    }
    const lots = data.lots
      ? data.lots.map((l) => ({ quantity: l.quantity, expiry_date: l.expiry_date || null }))
      : [{ quantity: data.quantity || 0, expiry_date: data.expiry_date || null }];
    const total = lots.reduce((sum, l) => sum + l.quantity, 0);
    if (!(total > 0)) return res.status(400).json({ error: 'Quantidade tem de ser maior que zero', code: 'INVALID_QUANTITY' });

    const result = await prisma.$transaction(async (tx) => {
      // Increment atomico (antes: valor absoluto lido fora da transaccao — uma
      // venda pelo meio era apagada e o stock ficava inflacionado).
      const updatedProduct = await tx.product.update({
        where: { id: data.product_id },
        data: {
          stock_qty: { increment: total },
          cost_price: data.unit_cost,
          ...(lots.some((l) => l.expiry_date) ? { has_expiry: true } : {}),
        }
      });
      if (data.unit_cost !== product.cost_price) {
        await tx.productPriceHistory.create({ data: {
          tenant_id: req.user.tenantId, product_id: product.id, old_cost: product.cost_price,
          new_cost: data.unit_cost, changed_by: req.user.userId,
        } });
      }

      // Cada linha e um lote com a sua validade (FEFO nas saidas).
      const entries = [];
      const created = [];
      for (const l of lots) {
        const entry = await tx.stockEntry.create({
          data: {
            tenant_id: req.user.tenantId,
            product_id: data.product_id,
            quantity: l.quantity,
            unit_cost: data.unit_cost,
            supplier_id: data.supplier_id || null,
            recorded_by: req.user.userId,
            created_at: new Date()
          }
        });
        entries.push(entry);
        created.push(await addLot(tx, {
          tenantId: req.user.tenantId, productId: product.id, quantity: l.quantity,
          expiryDate: l.expiry_date, unitCost: data.unit_cost, stockEntryId: entry.id,
        }));
      }
      await tx.auditLog.create({ data: {
        tenant_id: req.user.tenantId, user_id: req.user.userId, action: 'STOCK_ENTRY', entity_type: 'product', entity_id: product.id,
        old_value: JSON.stringify({ stock_qty: product.stock_qty, cost_price: product.cost_price }),
        new_value: JSON.stringify({ name: product.name, stock_qty: updatedProduct.stock_qty, cost_price: updatedProduct.cost_price, added: total, lots, unit_cost: data.unit_cost, supplier_id: data.supplier_id || null }),
        ip_address: req.ip || '0.0.0.0',
      } });

      return { product: updatedProduct, entry: entries[0], lot: created[0], entries, lots: created };
    });

    publish({ type: 'stock_in', tenant_id: req.user.tenantId, total: lineAmount(total, data.unit_cost, product.unit), product_name: product.name });
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
    if (req.user.role === 'manager') delete data.delivery_cost_per_visit;
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
      include: { product: { select: { name: true } } },
      orderBy: { changed_at: 'desc' },
      take: 200
    });
    await attachPeople(req.user.tenantId, rows, [['changedBy', 'changed_by']]);
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
