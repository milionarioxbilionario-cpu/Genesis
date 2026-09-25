const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const { getShiftLock } = require('../utils/shiftLock');
const { applyTenantRls } = require('../utils/tenantRls');
const { normalizePaymentMethod } = require('../utils/paymentMethods');

const saleSchema = z.object({
  id: z.string().uuid().optional(),
 cashier_user_id: z.string().uuid().optional(),
  // Quando o dono opera o balcao via Hub, indica o vendedor activo.
  // So aceite se o chamador for owner do mesmo tenant; se for cashier, ignorado (anti-forja).
  seller_user_id: z.string().uuid().optional(),
 items: z.array(z.object({
   product_id: z.string().uuid(),
   product_name: z.string().optional(),
   quantity: z.number().int().positive(),
   unit_sell_price: z.number().int().nonnegative(),
   unit_cost_price: z.number().int().nonnegative()
 })).min(1),
 total_amount: z.number().int().nonnegative(),
 // Recalculado no servidor a partir do custo em BD; o valor do cliente e ignorado.
 total_cost: z.number().int().nonnegative().optional(),
 // Etapa 4: desconto manual em centavos MZN (validado: total = subtotal - desconto).
 discount_amount: z.number().int().nonnegative().optional().default(0),
 payment_method: z.string().min(1),
 amount_received: z.number().int().nonnegative().optional(),
 change_given: z.number().int().nonnegative().optional(),
 // Uma venda nova nasce sempre concluida: cancelar tem rota propria com PIN do dono.
 status: z.literal('completed').optional(),
 created_at: z.string().optional().refine(
   (value) => value === undefined || !Number.isNaN(Date.parse(value)),
   'created_at inválido'
 )
});
// Gerador de numero sequencial diario por tenant.
// daily_number e sequencial por dia (001, 002, ...). Recomeca amanha.
// Implementado dentro da transaction para seguranca concorrente.
async function getNextDailyNumber(tx, tenantId) {
  const today = new Date();
  const sod = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const eod = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const last = await tx.sale.findFirst({
    where: { tenant_id: tenantId, created_at: { gte: sod, lte: eod } },
    orderBy: { daily_number: "desc" },
    select: { daily_number: true }
  });
  if (last && typeof last.daily_number === "number") return last.daily_number + 1;
  return 1;
}


router.get('/', async (req, res) => {
 try {
   const tenantId = req.user && req.user.tenantId ? req.user.tenantId : null;
   if (!tenantId) {
     return res.status(400).json({ error: 'Tenant não identificado' });
   }

    const cashierId = typeof req.query.cashier_id === 'string' && req.query.cashier_id ? req.query.cashier_id : null;
    const where = cashierId ? { tenant_id: tenantId, cashier_user_id: cashierId } : { tenant_id: tenantId };
    const sales = await prisma.sale.findMany({
      where,
      include: { items: true, cashier: { select: { id: true, name: true } } },
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
   const callerUserId = (req.user && req.user.userId) ? req.user.userId : null;
   const callerRole = (req.user && req.user.role) ? req.user.role : null;
   // Vendedor efectivo: owner via Hub pode indicar seller_user_id; cashier vende em nome proprio (anti-forja).
   let sellerUserId = callerUserId;
   if (callerRole === 'owner' && data.seller_user_id) { sellerUserId = data.seller_user_id; }

   if (!tenantId) {
     return res.status(400).json({ error: 'Tenant não identificado na sessão' });
   }

   const result = await prisma.$transaction(async (tx) => {
     // Contexto de tenant para as politicas RLS (no-op em SQLite local, falha
     // ruidosa em Postgres em vez de continuar sem isolamento).
     await applyTenantRls(tx, tenantId);

     // Reenvio de uma venda ja sincronizada (POS offline): devolve a venda
     // existente em vez de rebentar com 500 - um 500 aqui aborta a fila de
     // sincronizacao inteira, porque o loop do POS para no primeiro erro.
     if (data.id) {
       const existing = await tx.sale.findFirst({
         where: { id: data.id, tenant_id: tenantId },
         select: { id: true, daily_number: true }
       });
       if (existing) {
         return { id: existing.id, daily_number: existing.daily_number };
       }
     }
     const productIds = [...new Set(data.items.map((item) => item.product_id))];
     const products = await tx.product.findMany({
       where: { id: { in: productIds }, tenant_id: tenantId }
     });

     const productMap = new Map(products.map((product) => [product.id, product]));

     // Precos, totais e estado da venda decidem-se aqui: o POS envia o carrinho,
     // nao decide quanto custou nem se a venda ficou concluida.
     const saleItems = data.items.map((item) => {
       const product = productMap.get(item.product_id);
       if (!product) throw new Error(`Produto não encontrado: ${item.product_id}`);
       if (!product.is_active) throw new Error(`Produto inativo: ${item.product_id}`);
       if (product.stock_qty < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);

       // Cobrar acima do preco de catalogo e sempre recusado. Vender abaixo e
       // aceite (promocao, ou venda offline sincronizada depois de o preco ter
       // subido) mas a diferenca tem de estar reflectida no desconto da venda.
       if (item.unit_sell_price > product.sell_price) {
         const priceError = new Error(`${product.name}: preço acima do catálogo (${product.sell_price})`);
         priceError.statusCode = 400;
         throw priceError;
       }

       return {
         id: require('crypto').randomUUID(),
         product_id: product.id,
         // Nome e custo vem da BD: o recibo e impresso em HTML (o nome escolhido
         // pelo cliente entrava no recibo) e o custo e informacao interna.
         product_name: product.name,
         quantity: item.quantity,
         unit_sell_price: item.unit_sell_price,
         unit_cost_price: product.cost_price
       };
     });

     const subtotal = saleItems.reduce((sum, item) => sum + item.quantity * item.unit_sell_price, 0);
     const totalCost = saleItems.reduce((sum, item) => sum + item.quantity * item.unit_cost_price, 0);

     const discountAmount = Number(data.discount_amount || 0);
     if (discountAmount > subtotal) {
       const discountError = new Error('Desconto superior ao subtotal da venda');
       discountError.statusCode = 400;
       throw discountError;
     }

     const totalAmount = subtotal - discountAmount;
     if (totalAmount !== Number(data.total_amount)) {
       const totalError = new Error(`Total da venda inconsistente (esperado ${totalAmount})`);
       totalError.statusCode = 400;
       throw totalError;
     }
     if (totalAmount <= 0) {
       const zeroError = new Error('Venda sem valor: o total tem de ser superior a zero');
       zeroError.statusCode = 400;
       throw zeroError;
     }

     // Dinheiro recebido e troco sao derivados, nao aceites do cliente. Sem
     // amount_received assume-se pagamento exato; um valor explicito abaixo do
     // total e recusado (era assim que a gaveta fechava a menos sem rasto).
     const paymentMethod = normalizePaymentMethod(data.payment_method);
     let amountReceived = data.amount_received === undefined ? totalAmount : Number(data.amount_received);
     if (paymentMethod === 'cash') {
       if (amountReceived < totalAmount) {
         const receivedError = new Error('Valor recebido inferior ao total da venda');
         receivedError.statusCode = 400;
         throw receivedError;
       }
     } else {
       amountReceived = totalAmount;
     }
     const changeGiven = Math.max(0, amountReceived - totalAmount);

      // Se o dono indicou um vendedor, ele tem de ser caixista activo do mesmo tenant.
      if (callerRole === 'owner' && data.seller_user_id) {
        const seller = await tx.user.findFirst({ where: { id: data.seller_user_id, tenant_id: tenantId, role: 'cashier', is_active: true }, select: { id: true } });
        if (!seller) throw new Error('Vendedor indicado nao pertence a este estabelecimento');
        sellerUserId = seller.id;
      }

      // FECHO CEGO: perfil bloqueado por 3 erros no fecho => nao pode vender.
      // Aplica-se ao VENDEDOR EFECTIVO (caixista), tanto em modo Hub
      // (owner a operar um perfil) como no login directo do caixista.
      const sellerUser = await tx.user.findFirst({
        where: { id: sellerUserId, tenant_id: tenantId, role: 'cashier' },
        select: { id: true, name: true },
      });
      if (sellerUser) {
        const lockState = await getShiftLock(tx, tenantId, sellerUser.id);
        if (lockState.locked) {
          const lockErr = new Error(
            'Perfil de ' + sellerUser.name + ' bloqueado por erros no fecho de turno. O dono tem de desbloquear com a senha dele.'
          );
          lockErr.statusCode = 403;
          throw lockErr;
        }
      }

     // Etapa 4: gerar numero sequencial diario e usar desconto.
     const dailyNumber = await getNextDailyNumber(tx, tenantId);
     const saleId = data.id || require('crypto').randomUUID();
     const sale = await tx.sale.create({
       data: {
         id: saleId,
         tenant_id: tenantId,
         cashier_user_id: sellerUserId,
         total_amount: totalAmount,
         total_cost: totalCost,
         discount_amount: discountAmount,
         daily_number: dailyNumber,
         payment_method: paymentMethod,
         amount_received: amountReceived,
         change_given: changeGiven,
         status: 'completed',
         cancelled_by: null,
         cancel_reason: null,
        }
     });

     await tx.saleItem.createMany({
       data: saleItems.map((item) => ({
         ...item,
         sale_id: sale.id
       }))
     });

     for (const item of saleItems) {
       // Guarda atomica: o UPDATE so passa se ainda houver stock. A verificacao
       // anterior pode ter sido invalidada por uma venda em paralelo e, sem isto,
       // o stock fica negativo.
       const stockUpdate = await tx.product.updateMany({
         where: { id: item.product_id, tenant_id: tenantId, stock_qty: { gte: item.quantity } },
         data: { stock_qty: { decrement: item.quantity } }
       });
       if (stockUpdate.count !== 1) {
         const stockError = new Error(`Stock insuficiente para ${item.product_name} (alterado por outra venda)`);
         stockError.statusCode = 409;
         throw stockError;
       }
     }

     await tx.auditLog.create({
       data: {
         tenant_id: tenantId,
         user_id: callerUserId,
         action: 'CREATE_SALE',
         entity_type: 'sale',
         entity_id: sale.id,
         old_value: null,
         new_value: JSON.stringify({
           total_amount: totalAmount,
           subtotal,
           total_cost: totalCost,
           discount_amount: discountAmount,
           payment_method: paymentMethod,
           item_count: saleItems.length,
           cashier_user_id: sellerUserId,
           operated_by: callerUserId,
           // Venda sincronizada mais tarde (offline): fica registado que a hora
           // do recibo e a do dispositivo e nao a do servidor.
           ...(data.created_at ? { client_created_at: data.created_at } : {}),
         }),
         ip_address: req.ip || '0.0.0.0'
       }
     });

     return { id: sale.id, daily_number: sale.daily_number };
   });

   return res.status(201).json({ id: result.id, daily_number: result.daily_number });
 } catch (err) {
   if (err instanceof z.ZodError) {
     return res.status(400).json({ error: err.errors });
   }
   if (err.statusCode) {
     return res.status(err.statusCode).json({ error: err.message });
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
