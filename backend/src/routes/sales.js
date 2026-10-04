const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const { getShiftLock } = require('../utils/shiftLock');
const { applyTenantRls, isSqliteUrl } = require('../utils/tenantRls');
const { normalizePaymentMethod } = require('../utils/paymentMethods');
const { addLot, consumeLots } = require('../utils/stockLots');
const rateLimit = require('express-rate-limit');

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
 // Desconto acima do limite livre da loja exige o PIN de autorizacao do dono.
 authorization_pin: z.string().regex(/^\d{4,6}$/).optional(),
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
// Erro de regra de negocio com codigo HTTP (4xx). O POS offline usa a distincao
// 4xx (rejeitada: nao adianta reenviar) vs 5xx/rede (tentar de novo).
function httpError(statusCode, message, code) {
  const e = new Error(message);
  e.statusCode = statusCode;
  if (code) e.code = code;
  return e;
}

// Bloqueio de PINs de autorizacao errados (cancelamentos + descontos): por venda
// e por loja numa janela de 15 minutos.
const CANCEL_MAX_PER_SALE = 3;
const CANCEL_MAX_PER_TENANT = 5;
const CANCEL_TENANT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_PIN_FAIL_ACTIONS = ['CANCEL_ATTEMPT', 'DISCOUNT_PIN_FAIL'];

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

    // O caixista so ve as SUAS vendas e nunca custos (especificacao 4.3).
    // Antes via as ultimas 20 de toda a loja, de qualquer caixista, com o custo.
    const isOwner = req.user.role === 'owner';
    const cashierId = isOwner
      ? (typeof req.query.cashier_id === 'string' && req.query.cashier_id ? req.query.cashier_id : null)
      : req.user.userId;
    const where = cashierId ? { tenant_id: tenantId, cashier_user_id: cashierId } : { tenant_id: tenantId };
    const sales = await prisma.sale.findMany({
      where,
      include: { items: true, cashier: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    if (isOwner) return res.json(sales);
    return res.json(sales.map(({ total_cost, items, ...sale }) => ({
      ...sale,
      items: items.map(({ unit_cost_price, ...item }) => item),
    })));
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

// O PIN de autorizacao configura-se em PUT /api/settings/authorization-pin
// (exige a senha do dono). A rota antiga aqui trocava-o sem confirmacao.

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
       if (!product) throw httpError(400, `Produto não encontrado: ${item.product_id}`, 'PRODUCT_NOT_FOUND');
       if (!product.is_active) throw httpError(400, `Produto inativo: ${product.name}`, 'PRODUCT_INACTIVE');
       if (product.stock_qty < item.quantity) throw httpError(409, `Stock insuficiente para ${product.name}`, 'INSUFFICIENT_STOCK');

       // O preco unitario TEM de ser o do catalogo. Antes so se recusava acima do
       // catalogo: abaixo era aceite sem rasto, e um caixista registava a cerveja a
       // 1 centavo, cobrava o preco real e ficava com a diferenca. Qualquer reducao
       // legitima vai pelo campo discount_amount (gravado na venda e na auditoria).
       if (item.unit_sell_price !== product.sell_price) {
         throw httpError(409, `${product.name}: o preço mudou ou não corresponde ao catálogo (catálogo: ${product.sell_price} centavos). Actualize a lista de produtos.`, 'PRICE_MISMATCH');
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

     // POLITICA DE DESCONTOS: ate discount_free_pct% do subtotal e livre; acima
     // disso exige o PIN de autorizacao do dono (o mesmo dos cancelamentos).
     const tenantPolicy = await tx.tenant.findUnique({ where: { id: tenantId }, select: { discount_free_pct: true, cancel_pin_hash: true } });
     const freeLimit = Math.floor(subtotal * (tenantPolicy?.discount_free_pct ?? 10) / 100);
     let discountAuthorized = false;
     if (discountAmount > freeLimit) {
       if (!data.authorization_pin) {
         throw httpError(403, `Desconto acima de ${tenantPolicy?.discount_free_pct ?? 10}% exige o PIN de autorização do dono`, 'DISCOUNT_NEEDS_PIN');
       }
       if (!tenantPolicy?.cancel_pin_hash) throw httpError(400, 'PIN de autorização não configurado nesta loja', 'AUTH_PIN_NOT_SET');
       const recentFails = await tx.auditLog.count({ where: { tenant_id: tenantId, action: { in: AUTH_PIN_FAIL_ACTIONS }, created_at: { gt: new Date(Date.now() - CANCEL_TENANT_WINDOW_MS) } } });
       if (recentFails >= CANCEL_MAX_PER_TENANT) throw httpError(429, 'Demasiados PINs errados nesta loja. Espere 15 minutos.', 'TENANT_CANCEL_LOCKED');
       if (!(await bcrypt.compare(data.authorization_pin, tenantPolicy.cancel_pin_hash))) {
         const pinErr = httpError(403, 'PIN de autorização inválido', 'INVALID_AUTH_PIN');
         pinErr.recordDiscountPinFail = true; // gravado FORA da transaccao (catch)
         throw pinErr;
       }
       discountAuthorized = true;
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
        if (!seller) throw httpError(400, 'Vendedor indicado nao pertence a este estabelecimento', 'INVALID_SELLER');
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
     // Trinco por loja ate ao fim da transaccao: duas vendas em simultaneo ja
     // nao recebem o mesmo numero de recibo.
     if (!isSqliteUrl()) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${String(tenantId)}))`;
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
       // Lotes: sai primeiro o que expira primeiro (o leitor identifica o
       // produto, nao a unidade — por isso leitor e escolha manual sao iguais).
       await consumeLots(tx, { tenantId, productId: item.product_id, quantity: item.quantity });
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

     if (discountAuthorized) {
       await tx.auditLog.create({ data: {
         tenant_id: tenantId, user_id: callerUserId, action: 'DISCOUNT_AUTHORIZED', entity_type: 'sale', entity_id: sale.id,
         new_value: JSON.stringify({ subtotal, discount_amount: discountAmount, free_limit: freeLimit }), ip_address: req.ip || '0.0.0.0',
       } });
     }

     return { id: sale.id, daily_number: sale.daily_number };
   });

   return res.status(201).json({ id: result.id, daily_number: result.daily_number });
 } catch (err) {
   if (err instanceof z.ZodError) {
     return res.status(400).json({ error: err.errors });
   }
   if (err.recordDiscountPinFail && req.user?.userId && req.user?.tenantId) {
     await prisma.auditLog.create({ data: {
       tenant_id: req.user.tenantId, user_id: req.user.userId, action: 'DISCOUNT_PIN_FAIL', entity_type: 'sale',
       ip_address: req.ip || '0.0.0.0',
     } }).catch((e) => console.error('audit DISCOUNT_PIN_FAIL', e.message));
   }
   if (err.statusCode) {
     return res.status(err.statusCode).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
   }
   console.error('Error in /api/sales', err);
   // Nunca devolver err.message num 500: expunha caminhos de ficheiros e
   // detalhes internos do Prisma ao browser.
   return res.status(500).json({ error: 'Erro ao registar venda' });
 }
});

// Cancelar uma venda (exige o PIN do dono). So vendas desta loja e de hoje.
//
// BUG CORRIGIDO (2026-10-03): a tentativa falhada era gravada DENTRO da
// transacao e logo a seguir fazia-se throw — o rollback apagava o registo. A
// contagem de falhas ficava sempre a 0: tentativas infinitas, e um PIN de 4
// digitos caia por forca bruta em minutos. Agora:
//   - a falha e gravada FORA da transacao (persiste);
//   - 3 falhas numa venda bloqueiam essa venda (423);
//   - 5 falhas na loja em 15 min bloqueiam todos os cancelamentos (429);
//   - limite de pedidos por loja+IP na propria rota.
const cancelLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.CANCEL_RATE_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.tenantId || 'sem-loja') + '|' + req.ip,
  message: { error: 'Demasiados pedidos de cancelamento. Espere 15 minutos.', code: 'TOO_MANY_ATTEMPTS' },
});

router.post('/:id/cancel', cancelLimiter, async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({
      pin: z.string().min(4).max(6).regex(/^\d+$/, 'PIN deve conter apenas números'),
      reason: z.string().max(500).optional(),
    });
    const { id } = paramsSchema.parse(req.params);
    const body = bodySchema.parse(req.body);

    const tenantId = req.user && req.user.tenantId ? req.user.tenantId : null;
    const userId = req.user && req.user.userId ? req.user.userId : null;
    if (!tenantId || !userId) return res.status(401).json({ error: 'Sessão inválida' });

    const sale = await prisma.sale.findFirst({ where: { id, tenant_id: tenantId } });
    if (!sale) return res.status(404).json({ error: 'Venda não encontrada' });
    if (new Date(sale.created_at).toDateString() !== new Date().toDateString()) {
      return res.status(400).json({ error: 'Só é possível cancelar vendas do dia actual' });
    }
    if (sale.status === 'cancelled') return res.status(409).json({ error: 'Venda já se encontra cancelada' });

    const [failsOnSale, recentTenantFails] = await Promise.all([
      prisma.auditLog.count({ where: { tenant_id: tenantId, action: 'CANCEL_ATTEMPT', entity_id: id } }),
      prisma.auditLog.count({
        where: { tenant_id: tenantId, action: { in: AUTH_PIN_FAIL_ACTIONS }, created_at: { gt: new Date(Date.now() - CANCEL_TENANT_WINDOW_MS) } },
      }),
    ]);
    if (failsOnSale >= CANCEL_MAX_PER_SALE) {
      return res.status(423).json({ error: 'Cancelamento desta venda bloqueado por múltiplas tentativas falhadas', code: 'SALE_CANCEL_LOCKED' });
    }
    if (recentTenantFails >= CANCEL_MAX_PER_TENANT) {
      return res.status(429).json({ error: 'Demasiados PINs errados nesta loja. Espere 15 minutos.', code: 'TENANT_CANCEL_LOCKED' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { cancel_pin_hash: true } });
    if (!tenant || !tenant.cancel_pin_hash) {
      return res.status(400).json({ error: 'PIN de cancelamento não configurado para este tenant' });
    }

    const pinOk = await bcrypt.compare(body.pin, tenant.cancel_pin_hash);
    if (!pinOk) {
      // FORA de qualquer transacao: esta linha tem de sobreviver ao erro.
      await prisma.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: userId,
          action: 'CANCEL_ATTEMPT',
          entity_type: 'sale',
          entity_id: id,
          new_value: JSON.stringify({ attempt: failsOnSale + 1 }),
          ip_address: req.ip || '0.0.0.0',
        },
      });
      const remaining = Math.max(0, CANCEL_MAX_PER_SALE - (failsOnSale + 1));
      return res.status(403).json({ error: 'PIN inválido', code: 'INVALID_PIN', remaining });
    }

    await prisma.$transaction(async (tx) => {
      await applyTenantRls(tx, tenantId);
      // Guarda atomica: so cancela se ainda estiver concluida (dois pedidos em
      // paralelo nao repoem o stock duas vezes).
      const flipped = await tx.sale.updateMany({
        where: { id, tenant_id: tenantId, status: 'completed' },
        data: { status: 'cancelled', cancelled_by: userId, cancel_reason: body.reason || null },
      });
      if (flipped.count !== 1) throw httpError(409, 'Venda já se encontra cancelada', 'ALREADY_CANCELLED');

      const items = await tx.saleItem.findMany({ where: { sale_id: id } });
      for (const it of items) {
        await tx.product.updateMany({
          where: { id: it.product_id, tenant_id: tenantId },
          data: { stock_qty: { increment: it.quantity } },
        });
        // A mercadoria volta como lote sem validade conhecida (a venda nao
        // guarda de que lote saiu cada unidade).
        await addLot(tx, { tenantId, productId: it.product_id, quantity: it.quantity, unitCost: it.unit_cost_price });
      }

      await tx.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: userId,
          action: 'CANCEL_SALE',
          entity_type: 'sale',
          entity_id: id,
          old_value: JSON.stringify({ status: 'completed', total_amount: sale.total_amount }),
          new_value: JSON.stringify({ status: 'cancelled', reason: body.reason || null }),
          ip_address: req.ip || '0.0.0.0',
        },
      });
    });

    return res.json({ ok: true, message: 'Venda cancelada com sucesso' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message || 'Dados inválidos' });
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
    console.error('Error cancelling sale', err);
    return res.status(500).json({ error: 'Erro ao cancelar venda' });
  }
});

module.exports = router;
