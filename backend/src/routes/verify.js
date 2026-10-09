// Verificacao publica de recibos (especificacao 6.9: QR de autenticidade).
//
//   GET /api/verify/:saleId   sem sessao — quem tem o recibo confirma que a
//                             venda existe nesta loja e se continua valida.
//
// So devolve o que ja esta impresso no recibo (loja, numero, data, artigos,
// total, pagamento) mais o estado (concluida/cancelada). Nunca custos, nunca o
// caixista, nunca outras vendas. O id e um UUID aleatorio gerado no terminal,
// por isso nao se adivinha; o limite por IP trava varrimentos.
const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prisma');
const { asyncHandler, httpError } = require('../utils/http');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas verificações a partir desta ligação. Tente daqui a 15 minutos.', code: 'TOO_MANY_ATTEMPTS' },
});

router.get('/:saleId', verifyLimiter, asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  const { saleId } = req.params;
  if (!UUID_RE.test(saleId)) throw httpError(400, 'Código de recibo inválido.', 'INVALID_RECEIPT_ID');

  // Sem loja em contexto: corre no cliente de sistema (a venda pode ser de
  // qualquer loja). Os campos sao escolhidos um a um — nada de custos.
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: {
      daily_number: true, created_at: true, total_amount: true, discount_amount: true,
      payment_method: true, status: true,
      tenant: { select: { name: true, location: true } },
      items: { select: { product_name: true, quantity: true, unit_sell_price: true } },
    },
  });
  if (!sale) throw httpError(404, 'Recibo não encontrado.', 'RECEIPT_NOT_FOUND');

  res.json({
    store: { name: sale.tenant.name, location: sale.tenant.location },
    sale: {
      daily_number: sale.daily_number,
      created_at: sale.created_at,
      total_amount: sale.total_amount,
      discount_amount: sale.discount_amount,
      payment_method: sale.payment_method,
      status: sale.status,
      items: sale.items,
    },
  });
}));

module.exports = router;
