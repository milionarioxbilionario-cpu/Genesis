const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { imageUrlSchema } = require('../utils/productImage');
const { addLot, consumeLots } = require('../utils/stockLots');
const { iconSchema } = require('../utils/productIcons');
const { recordCatalogSuggestions } = require('../utils/catalogSuggestions');

// "AAAA-MM-DD" que existe mesmo no calendario (31-02 nao passa).
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data de validade inválida')
  .refine((d) => !Number.isNaN(Date.parse(d + 'T00:00:00Z')) && new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) === d, 'data de validade inválida');

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1).default('Geral'),
  barcode: z.string().optional().nullable(),
  image_url: imageUrlSchema,
  icon: iconSchema,
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
      orderBy: { name: 'asc' }
    });
    // O caixista nunca ve custos nem margens (especificacao 4.3).
    if (req.user.role !== 'owner') {
      return res.json(products.map(({ cost_price, ...p }) => p));
    }
    return res.json(products);
  } catch (err) {
    console.error('List products error', err);
    return res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Criar produto (Fase 8.2): o stock inicial pode vir em varios lotes, cada um
// com a sua validade (ex.: 50 un. a 17/10 e 50 a 20/10), e com fornecedor
// opcional — com fornecedor fica uma entrada de stock (entra no custo de
// entrega do mes). Produto fora do catalogo-mestre vira sugestao para o admin.
const createProductSchema = productSchema.extend({
  lots: z.array(z.object({
    quantity: z.number().int().positive('quantidade do lote tem de ser maior que zero').max(1_000_000),
    expiry_date: isoDay.nullish(),
  })).max(20, 'no máximo 20 validades').optional(),
  supplier_id: z.string().min(1).nullish(),
});

router.post('/', auth, requireRole('owner'), async (req, res) => {
  try {
    const data = createProductSchema.parse(req.body);
    const tenantId = req.user.tenantId;
    const lots = data.lots
      ? data.lots.map((l) => ({ quantity: l.quantity, expiry_date: l.expiry_date || null }))
      : (data.stock_qty > 0 ? [{ quantity: data.stock_qty, expiry_date: data.has_expiry ? data.expiry_date || null : null }] : []);
    const stockQty = lots.reduce((sum, l) => sum + l.quantity, 0);
    const hasExpiry = Boolean(data.has_expiry || lots.some((l) => l.expiry_date));

    const product = await prisma.$transaction(async (tx) => {
      if (data.supplier_id) {
        const supplier = await tx.supplier.findFirst({ where: { id: data.supplier_id, tenant_id: tenantId } });
        if (!supplier) { const e = new Error('Fornecedor não pertence a esta loja'); e.statusCode = 400; throw e; }
      }
      const created = await tx.product.create({
        data: {
          tenant: { connect: { id: tenantId } },
          name: data.name.trim(),
          category: data.category,
          barcode: data.barcode || null,
          image_url: data.image_url || null,
          icon: data.icon || null,
          cost_price: data.cost_price,
          sell_price: data.sell_price,
          stock_qty: stockQty,
          min_stock: data.min_stock,
          has_expiry: hasExpiry,
          is_active: true
        }
      });
      for (const lot of lots) {
        const entry = data.supplier_id
          ? await tx.stockEntry.create({ data: { tenant_id: tenantId, product_id: created.id, quantity: lot.quantity, unit_cost: data.cost_price, supplier_id: data.supplier_id, recorded_by: req.user.userId } })
          : null;
        await addLot(tx, { tenantId, productId: created.id, quantity: lot.quantity, expiryDate: lot.expiry_date, unitCost: data.cost_price, stockEntryId: entry ? entry.id : null });
      }
      await recordCatalogSuggestions(tx, { tenantId, products: [created] });
      await tx.auditLog.create({ data: {
        tenant_id: tenantId, user_id: req.user.userId, action: 'CREATE_PRODUCT', entity_type: 'product', entity_id: created.id,
        new_value: JSON.stringify({ name: created.name, sell_price: created.sell_price, cost_price: created.cost_price, stock_qty: stockQty, lots, supplier_id: data.supplier_id || null }),
        ip_address: req.ip || '0.0.0.0',
      } });
      return created;
    });

    return res.status(201).json(product);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Dados inválidos', details: err.errors });
    }
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('Create product error', err);
    return res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Lotes do produto (stock por validade) — so o dono.
router.get('/:id/lots', auth, requireRole('owner'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const product = await prisma.product.findFirst({ where: { id: req.params.id, tenant_id: tenantId }, select: { id: true, stock_qty: true } });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    const lots = await prisma.stockLot.findMany({ where: { tenant_id: tenantId, product_id: product.id, quantity_remaining: { gt: 0 } }, orderBy: [{ expiry_date: 'asc' }, { created_at: 'asc' }] });
    return res.json({
      stock_qty: product.stock_qty,
      lots: lots.map((l) => ({ id: l.id, quantity: l.quantity_remaining, expiry_date: l.expiry_date ? l.expiry_date.toISOString().slice(0, 10) : null, unit_cost: l.unit_cost, created_at: l.created_at })),
    });
  } catch (err) {
    console.error('List lots error', err);
    return res.status(500).json({ error: 'Erro ao listar lotes' });
  }
});

// Validade de um lote, ali mesmo no produto (Fase 8.2). Com `quantity` menor
// que o lote, so essas unidades passam a ter a nova validade (o lote divide-se:
// ex.: das 100 sem data, 50 expiram a 17 e 50 a 20). A quantidade total nao muda.
router.patch('/:id/lots/:lotId', auth, requireRole('owner'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const data = z.object({ expiry_date: isoDay.nullable(), quantity: z.number().int().positive().optional() }).parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const lot = await tx.stockLot.findFirst({ where: { id: req.params.lotId, product_id: req.params.id, tenant_id: tenantId } });
      if (!lot || lot.quantity_remaining <= 0) { const e = new Error('Lote não encontrado'); e.statusCode = 404; throw e; }
      const qty = data.quantity ?? lot.quantity_remaining;
      if (qty > lot.quantity_remaining) { const e = new Error(`Este lote só tem ${lot.quantity_remaining} un.`); e.statusCode = 400; throw e; }
      const expiry = data.expiry_date ? new Date(data.expiry_date) : null;
      let changed;
      if (qty === lot.quantity_remaining) {
        changed = await tx.stockLot.update({ where: { id: lot.id }, data: { expiry_date: expiry } });
      } else {
        // Guarda atomica: uma venda pelo meio pode ter levado unidades do lote.
        const r = await tx.stockLot.updateMany({ where: { id: lot.id, tenant_id: tenantId, quantity_remaining: { gte: qty } }, data: { quantity_remaining: { decrement: qty } } });
        if (r.count !== 1) { const e = new Error('O lote mudou entretanto. Tente de novo.'); e.statusCode = 409; throw e; }
        changed = await tx.stockLot.create({ data: { tenant_id: tenantId, product_id: lot.product_id, quantity_remaining: qty, expiry_date: expiry, unit_cost: lot.unit_cost, stock_entry_id: lot.stock_entry_id } });
      }
      if (expiry) await tx.product.update({ where: { id: lot.product_id }, data: { has_expiry: true } });
      await tx.auditLog.create({ data: {
        tenant_id: tenantId, user_id: req.user.userId, action: 'LOT_EXPIRY_CHANGED', entity_type: 'product', entity_id: lot.product_id,
        old_value: JSON.stringify({ lot_id: lot.id, quantity: qty, expiry_date: lot.expiry_date }),
        new_value: JSON.stringify({ lot_id: changed.id, quantity: qty, expiry_date: data.expiry_date }),
        ip_address: req.ip || '0.0.0.0',
      } });
      return changed;
    });
    return res.json({ id: result.id, quantity: result.quantity_remaining, expiry_date: data.expiry_date });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message || 'Dados inválidos' });
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('Lot expiry error', err);
    return res.status(500).json({ error: 'Erro ao mudar a validade' });
  }
});

// Update product (partial). Sem stock_qty: mudar quantidades so por entrada de
// stock, ajuste auditado (/:id/stock), venda ou quebra — um PATCH directo
// saltava a auditoria e os lotes.
const productUpdateSchema = productSchema.omit({ stock_qty: true }).partial();
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
    if (typeof data.image_url !== 'undefined') updateData.image_url = data.image_url || null;
    if (typeof data.icon !== 'undefined') updateData.icon = data.icon || null;
    if (typeof data.cost_price !== 'undefined') updateData.cost_price = data.cost_price;
    if (typeof data.sell_price !== 'undefined') updateData.sell_price = data.sell_price;
    if (typeof data.min_stock !== 'undefined') updateData.min_stock = data.min_stock;
    if (typeof data.has_expiry !== 'undefined') updateData.has_expiry = data.has_expiry;
    if (typeof data.expiry_date !== 'undefined') updateData.expiry_date = data.expiry_date ? new Date(data.expiry_date) : null;
    if (typeof data.is_active !== 'undefined') updateData.is_active = data.is_active;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({ where: { id }, data: updateData });
      // Sugestao ainda por decidir no admin acompanha o produto (nome, precos).
      await tx.catalogSuggestion.updateMany({ where: { tenant_id: tenantId, product_id: id, status: 'pending' }, data: { product_name: p.name, category: p.category, icon: p.icon, barcode: p.barcode, cost_price: p.cost_price, sell_price: p.sell_price } });

      // Historico de custo (especificacao 6.4): rastrear quando o preco de
      // compra mudou. Antes a tabela existia mas nada a escrevia.
      if (typeof updateData.cost_price === 'number' && updateData.cost_price !== existing.cost_price) {
        await tx.productPriceHistory.create({ data: {
          tenant_id: tenantId, product_id: id, old_cost: existing.cost_price,
          new_cost: updateData.cost_price, changed_by: req.user.userId,
        } });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          tenant: { connect: { id: tenantId } },
          user: { connect: { id: req.user.userId || req.user.userId } },
          action: 'UPDATE_PRODUCT',
          entity_type: 'product',
          entity_id: id,
          // AuditLog.old_value/new_value sao String? — gravar OBJETOS fazia o
          // Prisma rejeitar a query (500 "Erro ao atualizar produto"). As outras
          // rotas ja usam JSON.stringify; aqui faltava.
          old_value: JSON.stringify(existing),
          new_value: JSON.stringify(updateData),
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
          // Ver nota no UPDATE: String? exige string, nao objeto.
          old_value: JSON.stringify(existing),
          new_value: JSON.stringify({ is_active: false }),
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

// Ajuste manual de stock — SO O DONO (2026-10-03).
//
// Antes aceitava o papel 'cashier' com qualquer delta (positivo ou negativo) e
// sem auditoria: um caixista "abatia" mercadoria roubada com um clique. Perdas
// do balcao fazem-se por /api/shrinkage_records (motivo + auditoria).
//
// Tambem era ler-calcular-escrever (stock_qty = lido + delta) FORA da
// transacao: uma venda pelo meio perdia-se e o stock ficava inflacionado.
// Agora e um increment atomico com guarda contra stock negativo.
router.patch('/:id/stock', auth, requireRole('owner'), async (req, res) => {
  try {
    const productId = req.params.id;
    const tenantId = req.user.tenantId;
    const deltaSchema = z.object({
      delta: z.number().int().refine((v) => v !== 0, 'delta nao pode ser 0'),
      unit_cost: z.number().int().nonnegative().optional(),
      expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data de validade inválida').nullable().optional(),
      reason: z.string().min(3).max(200).optional().default('manual_adjustment')
    });
    const data = deltaSchema.parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.product.findFirst({ where: { id: productId, tenant_id: tenantId } });
      if (!before) {
        const e = new Error('Produto não encontrado'); e.statusCode = 404; throw e;
      }
      const guard = data.delta < 0 ? { stock_qty: { gte: -data.delta } } : {};
      const result = await tx.product.updateMany({
        where: { id: productId, tenant_id: tenantId, ...guard },
        data: { stock_qty: { increment: data.delta } }
      });
      if (result.count !== 1) {
        const e = new Error('Estoque insuficiente para esta operação'); e.statusCode = 400; throw e;
      }
      const current = await tx.product.findUnique({ where: { id: productId } });

      const entry = await tx.stockEntry.create({
        data: {
          tenant_id: tenantId,
          product_id: productId,
          quantity: data.delta,
          unit_cost: data.unit_cost ?? before.cost_price,
          recorded_by: req.user.userId,
          supplier_id: null,
        }
      });
      // Lotes: ajuste positivo = lote novo; negativo = sai por FEFO.
      if (data.delta > 0) {
        await addLot(tx, { tenantId, productId, quantity: data.delta, expiryDate: data.expiry_date || null, unitCost: data.unit_cost ?? before.cost_price, stockEntryId: entry.id });
      } else {
        await consumeLots(tx, { tenantId, productId, quantity: -data.delta });
      }
      await tx.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: req.user.userId,
          action: 'STOCK_ADJUSTMENT',
          entity_type: 'product',
          entity_id: productId,
          old_value: JSON.stringify({ stock_qty: before.stock_qty }),
          new_value: JSON.stringify({ stock_qty: current.stock_qty, delta: data.delta, reason: data.reason }),
          ip_address: req.ip || '0.0.0.0'
        }
      });
      return current;
    });

    return res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('Stock adjustment error', err);
    return res.status(500).json({ error: 'Erro ao ajustar stock' });
  }
});

module.exports = router;
