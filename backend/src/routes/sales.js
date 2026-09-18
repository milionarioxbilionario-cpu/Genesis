const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');

const saleSchema = z.object({
  id: z.string().uuid().optional(),
 cashier_user_id: z.string().uuid().optional(),
 items: z.array(z.object({
   product_id: z.string().uuid(),
   product_name: z.string().optional(),
   quantity: z.number().int().positive(),
   unit_sell_price: z.number().int().nonnegative(),
   unit_cost_price: z.number().int().nonnegative()
 })).min(1),
 total_amount: z.number().int().nonnegative(),
 total_cost: z.number().int().nonnegative(),
 payment_method: z.string().min(1),
 amount_received: z.number().int().nonnegative().optional(),
 change_given: z.number().int().nonnegative().optional(),
 status: z.string().optional().default('completed'),
 created_at: z.string().optional()
});

router.get('/', async (req, res) => {
 try {
   const tenantId = req.user && req.user.tenantId ? req.user.tenantId : null;
   if (!tenantId) {
     return res.status(400).json({ error: 'Tenant não identificado' });
   }

   const sales = await prisma.sale.findMany({
     where: { tenant_id: tenantId },
     include: { items: true },
     orderBy: { created_at: 'desc' },
     take: 20
   });

   return res.json(sales);
 } catch (err) {
   console.error('List sales error', err);
   return res.status(500).json({ error: 'Erro ao listar vendas' });
 }
});

router.get('/cancel-pin-status', async (req, res) => {
 try {
   const tenantId = req.user && req.user.tenantId ? req.user.tenantId : null;
   if (!tenantId) {
     return res.status(400).json({ error: 'Tenant não identificado' });
   }

   const tenant = await prisma.tenant.findUnique({
     where: { id: tenantId },
     select: { cancel_pin_hash: true }
   });

   return res.json({ configured: Boolean(tenant && tenant.cancel_pin_hash) });
 } catch (err) {
   console.error('Get cancel pin status error', err);
   return res.status(500).json({ error: 'Erro ao consultar PIN de cancelamento' });
 }
});

router.post('/cancel-pin', async (req, res) => {
 try {
   const bodySchema = z.object({ pin: z.string().min(4).max(6).regex(/^\d+$/, 'PIN deve conter apenas números') });
   const { pin } = bodySchema.parse(req.body);

   const tenantId = req.user && req.user.tenantId ? req.user.tenantId : null;
   const role = req.user && req.user.role ? req.user.role : null;
   if (!tenantId) return res.status(400).json({ error: 'Tenant não identificado' });
   if (!role || (role !== 'owner' && role !== 'super_admin')) {
     return res.status(403).json({ error: 'Apenas o proprietário pode configurar o PIN de cancelamento' });
   }

   const hashedPin = await bcrypt.hash(pin, 10);
   await prisma.tenant.update({
     where: { id: tenantId },
     data: { cancel_pin_hash: hashedPin }
   });

   return res.json({ ok: true, configured: true });
 } catch (err) {
   if (err instanceof z.ZodError) {
     return res.status(400).json({ error: err.errors[0]?.message || 'PIN inválido' });
   }
   console.error('Set cancel pin error', err);
   return res.status(500).json({ error: 'Erro ao guardar PIN de cancelamento' });
 }
});

router.post('/', async (req, res) => {
 try {
   const data = saleSchema.parse(req.body);
   // Require authenticated user and tenant for production-safe behavior
   const tenantId = (req.user && req.user.tenantId) ? req.user.tenantId : null;
   const cashierUserId = (req.user && req.user.userId) ? req.user.userId : null;

   if (!tenantId) {
     return res.status(400).json({ error: 'Tenant não identificado na sessão' });
   }

   const result = await prisma.$transaction(async (tx) => {
     // Attempt to set tenant context for RLS unless running local sqlite dev DB
     try {
       const fs = require('fs');
       const path = require('path');
       const sqlitePath = path.join(__dirname, '../../prisma/dev.db');
       const isLocalSqlite = fs.existsSync(sqlitePath);
       if (!isLocalSqlite) {
         await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
       }
     } catch (e) {
       // ignore if not supported
     }
     const productIds = [...new Set(data.items.map((item) => item.product_id))];
     const products = await tx.product.findMany({
       where: { id: { in: productIds }, tenant_id: tenantId }
     });

     const productMap = new Map(products.map((product) => [product.id, product]));

     for (const item of data.items) {
       const product = productMap.get(item.product_id);
       if (!product) throw new Error(`Produto não encontrado: ${item.product_id}`);
       if (!product.is_active) throw new Error(`Produto inativo: ${item.product_id}`);
       if (product.stock_qty < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);
     }

     const saleId = data.id || require('crypto').randomUUID();
     const sale = await tx.sale.create({
       data: {
         id: saleId,
         tenant_id: tenantId,
         cashier_user_id: cashierUserId,
         total_amount: data.total_amount,
         total_cost: data.total_cost,
         payment_method: data.payment_method,
         amount_received: data.amount_received || 0,
         change_given: data.change_given || 0,
         status: data.status || 'completed',
         cancelled_by: null,
         cancel_reason: null,
        }
     });

     await tx.saleItem.createMany({
       data: data.items.map((item) => ({
         id: require('crypto').randomUUID(),
         sale_id: sale.id,
         product_id: item.product_id,
         product_name: item.product_name || productMap.get(item.product_id)?.name || 'Produto',
         quantity: item.quantity,
         unit_sell_price: item.unit_sell_price,
         unit_cost_price: item.unit_cost_price
       }))
     });

     for (const item of data.items) {
       await tx.product.update({
         where: { id: item.product_id },
         data: { stock_qty: { decrement: item.quantity } }
       });
     }

     await tx.auditLog.create({
       data: {
         tenant_id: tenantId,
         user_id: cashierUserId,
         action: 'CREATE_SALE',
         entity_type: 'sale',
         entity_id: sale.id,
         old_value: null,
         new_value: JSON.stringify({
           total_amount: data.total_amount,
           total_cost: data.total_cost,
           payment_method: data.payment_method,
           item_count: data.items.length,
         }),
         ip_address: req.ip || '0.0.0.0'
       }
     });

     return { id: sale.id };
   });

   return res.status(201).json({ id: result.id });
 } catch (err) {
   if (err instanceof z.ZodError) {
     return res.status(400).json({ error: err.errors });
   }
   console.error('Error in /api/sales', err);
   return res.status(500).json({ error: err.message || 'Erro ao registar venda' });
 }
});

// Cancel a sale (requires owner PIN). Only allow cancelling sales from same tenant and same day.
router.post('/:id/cancel', async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({ pin: z.string().min(4), reason: z.string().optional() });
    const { id } = paramsSchema.parse(req.params);
    const body = bodySchema.parse(req.body);

    const tenantId = req.user && req.user.tenantId ? req.user.tenantId : null;
    const userId = req.user && req.user.userId ? req.user.userId : null;
    if (!tenantId) return res.status(400).json({ error: 'Tenant não identificado' });

    // Use a transaction to validate and perform cancellation atomically
    await prisma.$transaction(async (tx) => {
      // Fetch sale
      const sale = await tx.sale.findUnique({ where: { id } });
      if (!sale) throw new Error('Venda não encontrada');
      if (sale.tenant_id !== tenantId) throw new Error('Venda não pertence ao tenant');

      // Only allow cancelling sales from the same day
      const createdAt = new Date(sale.created_at);
      const now = new Date();
      const sameDay = createdAt.toDateString() === now.toDateString();
      if (!sameDay) throw new Error('Só é possível cancelar vendas do dia actual');

      if (sale.status === 'cancelled') throw new Error('Venda já se encontra cancelada');

      // Check number of recent failed attempts for this sale using ORM
      const attempts = await tx.auditLog.count({ where: { action: 'CANCEL_ATTEMPT', entity_id: id } });
      if (attempts >= 3) throw new Error('Bloqueado devido a múltiplas tentativas falhadas');

      // Fetch tenant to read cancel_pin_hash
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new Error('Tenant não encontrado');
      if (!tenant.cancel_pin_hash) throw new Error('PIN de cancelamento não configurado para este tenant');

      // Verify PIN
      const pinOk = await bcrypt.compare(body.pin, tenant.cancel_pin_hash);
      if (!pinOk) {
        // record failed attempt via ORM
        await tx.auditLog.create({
          data: {
            id: require('crypto').randomUUID(),
            tenant_id: tenantId,
            user_id: userId || 'unknown',
            action: 'CANCEL_ATTEMPT',
            entity_type: 'sale',
            entity_id: id,
            ip_address: req.ip || '0.0.0.0'
          }
        });
        throw new Error('PIN inválido');
      }

      // Fetch sale items via ORM
      const items = await tx.saleItem.findMany({ where: { sale_id: id } });

      // Update sale status and restore stock via ORM
      await tx.sale.update({ where: { id }, data: { status: 'cancelled', cancelled_by: userId || 'system', cancel_reason: body.reason || null } });

      for (const it of items) {
        await tx.product.update({ where: { id: it.product_id }, data: { stock_qty: { increment: it.quantity } } });
      }

      // Record audit log for cancellation via ORM
      await tx.auditLog.create({
        data: {
          id: require('crypto').randomUUID(),
          tenant_id: tenantId,
          user_id: userId || 'system',
          action: 'CANCEL_SALE',
          entity_type: 'sale',
          entity_id: id,
          old_value: null,
          new_value: null,
          ip_address: req.ip || '0.0.0.0'
        }
      });

    }); // end transaction

    return res.json({ ok: true, message: 'Venda cancelada com sucesso' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Error cancelling sale', err);
    return res.status(400).json({ error: err.message || 'Erro ao cancelar venda' });
  }
});

module.exports = router;
