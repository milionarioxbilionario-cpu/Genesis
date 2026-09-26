// Fechos de turno.
//
// ⚠️ BURACO FECHADO (26-09-2026): esta rota aceitava `expected_amount` DO CORPO
// DO PEDIDO. Como está montada com requireRole('owner','cashier'), um token de
// caixista podia gravar um fecho oficial com `difference: 0` e o valor que
// quisesse — contornando o fecho cego do POS (`/api/owner/cashiers/:id/
// close-shift-blind`) e deixando auditoria FALSA. Era a causa directa do
// "permite fechar o turno abaixo do que foi vendido hoje".
//
// Agora o SERVIDOR calcula o esperado. O cliente só pode declarar o que contou.

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { MAX_ATTEMPTS } = require('../utils/shiftLock');

// `expected_amount` NÃO existe aqui de propósito: o cliente não decide quanto
// o sistema esperava. Ver o comentário acima.
const shiftClosingSchema = z.object({
  counted_amount: z.number().int().nonnegative(),
  notes: z.string().optional().nullable(),
  cashier_user_id: z.string().optional().nullable()
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Valor que o sistema espera na gaveta: vendas em DINHEIRO desde o último fecho
// deste caixista (ou desde o início do dia, se ainda não fechou hoje).
//
// Porquê só dinheiro: a gaveta só tem o que foi pago em notas/moedas. Uma venda
// por cartão ou M-Pesa não passa pela gaveta, logo exigir o total vendido
// obrigaria o caixista a declarar dinheiro que nunca teve. O total vendido é
// devolvido em separado (`total_sold_today`) para o dono ver a diferença.
async function computeExpected(tenantId, cashierId) {
  const startOfDay = startOfToday();
  const lastClosing = await prisma.shiftClosing.findFirst({
    where: { tenant_id: tenantId, cashier_user_id: cashierId },
    orderBy: { closed_at: 'desc' },
  });
  const since = lastClosing ? lastClosing.closed_at : startOfDay;

  const [cashAgg, totalAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        tenant_id: tenantId, cashier_user_id: cashierId, status: 'completed',
        payment_method: 'cash', created_at: { gt: since },
      },
      _sum: { total_amount: true },
    }),
    prisma.sale.aggregate({
      where: {
        tenant_id: tenantId, cashier_user_id: cashierId, status: 'completed',
        created_at: { gt: since },
      },
      _sum: { total_amount: true },
    }),
  ]);

  return {
    expectedCash: Number(cashAgg._sum.total_amount || 0),
    totalSoldToday: Number(totalAgg._sum.total_amount || 0),
    since,
  };
}

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

    // Em modo Hub o PC está logado como OWNER; o fecho tem de ficar em nome
    // do CAIXISTA cujo perfil foi usado (senão o open-shift dele nunca fecha
    // e o perfil fica bloqueado). O caixista autenticado NÃO pode indicar
    // outro vendedor (anti-forja, igual ao POST /api/sales).
    const callerRole = req.user.role;
    let closingUserId = req.user.userId;
    if (callerRole === 'owner' && data.cashier_user_id) {
      const cashier = await prisma.user.findFirst({
        where: { id: data.cashier_user_id, tenant_id: req.user.tenantId, role: 'cashier', is_active: true },
        select: { id: true },
      });
      if (!cashier) return res.status(400).json({ error: 'Caixista indicado não pertence a este estabelecimento' });
      closingUserId = cashier.id;
    }

    // O esperado é calculado AQUI. Ignora-se por completo qualquer
    // `expected_amount` que o cliente tenha enviado.
    const { expectedCash, totalSoldToday } = await computeExpected(req.user.tenantId, closingUserId);

    // Contagem abaixo do esperado = tentativa falhada, com a MESMA regra de
    // bloqueio do fecho cego (3 falhas depois do ultimo desbloqueio).
    // Nunca se grava um fecho valido com a gaveta a menos.
    if (data.counted_amount < expectedCash) {
      const lastUnlock = await prisma.auditLog.findFirst({
        where: { tenant_id: req.user.tenantId, action: 'CASHIER_UNLOCKED', entity_id: closingUserId },
        orderBy: { created_at: 'desc' },
      });
      const failSince = lastUnlock ? lastUnlock.created_at : startOfToday();
      const attemptNo = (await prisma.auditLog.count({
        where: {
          tenant_id: req.user.tenantId, action: 'SHIFT_ATTEMPT_FAIL',
          entity_id: closingUserId, created_at: { gt: failSince },
        },
      })) + 1;

      const detail = JSON.stringify({
        via: 'POST /api/shift_closings',
        counted: data.counted_amount,
        expected_cash: expectedCash,
        total_sold_today: totalSoldToday,
        attempt: attemptNo,
      });

      await prisma.auditLog.create({
        data: {
          tenant_id: req.user.tenantId,
          user_id: req.user.userId,
          action: 'SHIFT_ATTEMPT_FAIL',
          entity_type: 'user',
          entity_id: closingUserId,
          ip_address: req.ip || '0.0.0.0',
          old_value: null,
          new_value: detail,
        }
      });

      const locked = attemptNo >= MAX_ATTEMPTS;
      await prisma.auditLog.create({
        data: {
          tenant_id: req.user.tenantId,
          user_id: req.user.userId,
          action: locked ? 'CASHIER_LOCKED' : 'CASHIER_ATTEMPT_ALERT',
          entity_type: 'user',
          entity_id: closingUserId,
          ip_address: req.ip || '0.0.0.0',
          old_value: null,
          new_value: detail,
        }
      });

      // O valor esperado NÃO vai na resposta: nesta rota quem conta não deve
      // saber quanto o sistema espera antes de contar sozinho.
      return res.status(400).json({
        ok: false,
        accepted: false,
        code: 'COUNTED_BELOW_EXPECTED',
        locked,
        attemptNo,
        maxAttempts: MAX_ATTEMPTS,
        remaining: Math.max(0, MAX_ATTEMPTS - attemptNo),
        error: locked
          ? 'Valor incorrecto ' + MAX_ATTEMPTS + ' vezes. Perfil bloqueado — o dono tem de desbloquear com a senha dele.'
          : 'Valor incorrecto: é MENOR do que o dinheiro que devia estar na gaveta. Restam '
            + (MAX_ATTEMPTS - attemptNo) + ' tentativa(s).',
      });
    }

    const difference = data.counted_amount - expectedCash;

    const record = await prisma.shiftClosing.create({
      data: {
        tenant_id: req.user.tenantId,
        cashier_user_id: closingUserId,
        counted_amount: data.counted_amount,
        expected_amount: expectedCash,
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
        new_value: JSON.stringify({
          counted_amount: data.counted_amount,
          expected_amount: expectedCash,
          difference,
          total_sold_today: totalSoldToday,
          closed_cashier_user_id: closingUserId,
          operated_by: req.user.userId
        })
      }
    });

    return res.status(201).json({
      id: record.id,
      counted_amount: record.counted_amount,
      expected_amount: record.expected_amount,
      difference: record.difference,
      // Total vendido (todas as formas de pagamento) para o dono comparar com a
      // gaveta e ver se houve vendas que nao passaram por dinheiro.
      total_sold_today: totalSoldToday,
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
