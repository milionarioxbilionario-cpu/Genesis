// Etapa B — terminal do guarda (plano kind-sleeping-squid).
//
// O guarda entra no terminal com o PIN dele (papel 'guard', sessao de ambito
// 'guard': so estas rotas). Le o QR ou o codigo de barras do recibo:
//   GET  /api/guard/receipt?code=...      mostra a venda (so deste estabelecimento)
//   POST /api/guard/receipt/:id/check     marca «conferido» (uma vez por venda)
// Ler outra vez o mesmo recibo da 409 ALREADY_CHECKED com quem e quando: e o
// ecra vermelho que trava a fraude do recibo reimpresso. Tudo fica no rastreio
// do dono (RECEIPT_CHECKED, RECEIPT_RECHECK_ATTEMPT).
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { lineAmount } = require('../utils/units');

const router = express.Router();
router.use(auth, requireRole('guard'));

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
// Codigo de barras do recibo (Code 128): AAAAMMDD + numero do dia com 4 algarismos.
const BARCODE = /^(\d{4})(\d{2})(\d{2})(\d{4})$/;
// Inicio do dia em Maputo (UTC+2) como instante.
const maputoDay = (y, m, d) => new Date(`${y}-${m}-${d}T00:00:00+02:00`);

// QR (endereco /verify/<id>), id solto ou codigo de barras -> { id } ou { day, n }.
function parseCode(raw) {
  const text = String(raw || '').trim();
  const id = text.match(UUID);
  if (id) return { id: id[0].toLowerCase() };
  const bc = text.replace(/\D/g, '').match(BARCODE);
  if (bc) return { day: [bc[1], bc[2], bc[3]], n: Number(bc[4]) };
  return null;
}

const SALE_SELECT = {
  id: true, daily_number: true, created_at: true, total_amount: true, status: true, payment_method: true,
  cashier: { select: { name: true } },
  items: { select: { product_name: true, quantity: true, unit: true, unit_sell_price: true } },
};

async function findSale(tenantId, code) {
  if (code.id) return prisma.sale.findFirst({ where: { id: code.id, tenant_id: tenantId }, select: SALE_SELECT });
  const [y, m, d] = code.day;
  const from = maputoDay(y, m, d);
  if (Number.isNaN(from.getTime())) return null;
  const to = new Date(from.getTime() + 24 * 3600 * 1000);
  return prisma.sale.findFirst({ where: { tenant_id: tenantId, daily_number: code.n, created_at: { gte: from, lt: to } }, select: SALE_SELECT });
}

async function checkOf(tenantId, saleId) {
  const c = await prisma.receiptCheck.findFirst({ where: { tenant_id: tenantId, sale_id: saleId } });
  if (!c) return null;
  const g = await prisma.user.findFirst({ where: { id: c.guard_user_id, tenant_id: tenantId }, select: { name: true } });
  return { checked_at: c.checked_at, guard_name: g?.name || null };
}

const view = (s) => ({
  id: s.id, daily_number: s.daily_number, created_at: s.created_at, total_amount: s.total_amount, status: s.status,
  payment_method: s.payment_method, cashier_name: s.cashier?.name || null,
  items: s.items.map((i) => ({ name: i.product_name, quantity: i.quantity, unit: i.unit, line_total: lineAmount(i.quantity, i.unit_sell_price, i.unit) })),
});

router.get('/receipt', asyncHandler(async (req, res) => {
  const { code } = z.object({ code: z.string().trim().min(6).max(300) }).parse(req.query);
  const parsed = parseCode(code);
  if (!parsed) throw httpError(400, 'Este código não é de um recibo Genesis.', 'NOT_A_RECEIPT');
  const tenantId = req.user.tenantId;
  const sale = await findSale(tenantId, parsed);
  // Venda de outro estabelecimento: a mesma resposta que «nao existe» (nao se
  // revela nada de fora; a RLS tambem o garante).
  if (!sale) throw httpError(404, 'Recibo não encontrado neste estabelecimento.', 'RECEIPT_NOT_FOUND');
  const check = await checkOf(tenantId, sale.id);
  // Recibo ja conferido apresentado outra vez: o dono fica a saber logo na
  // leitura (o guarda ve o vermelho e nem chega a tentar marcar).
  if (check) await writeAudit({ req, tenantId, action: 'RECEIPT_RECHECK_ATTEMPT', entityType: 'sale', entityId: sale.id, newValue: { daily_number: sale.daily_number, total_amount: sale.total_amount, first_checked_at: check.checked_at, terminal_id: req.user.tid || null } });
  res.json({ sale: view(sale), check });
}));

router.post('/receipt/:id/check', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  if (!UUID.test(req.params.id)) throw httpError(400, 'Código de recibo inválido.', 'INVALID_RECEIPT_ID');
  const sale = await prisma.sale.findFirst({ where: { id: req.params.id, tenant_id: tenantId }, select: { id: true, status: true, daily_number: true, total_amount: true } });
  if (!sale) throw httpError(404, 'Recibo não encontrado neste estabelecimento.', 'RECEIPT_NOT_FOUND');
  if (sale.status === 'cancelled') throw httpError(409, 'Esta venda foi cancelada: a mercadoria não pode sair.', 'SALE_CANCELLED');
  const previous = await checkOf(tenantId, sale.id);
  if (previous) {
    await writeAudit({ req, tenantId, action: 'RECEIPT_RECHECK_ATTEMPT', entityType: 'sale', entityId: sale.id, newValue: { daily_number: sale.daily_number, total_amount: sale.total_amount, first_checked_at: previous.checked_at, terminal_id: req.user.tid || null } });
    return res.status(409).json({ error: 'Este recibo já foi conferido.', code: 'ALREADY_CHECKED', check: previous });
  }
  try {
    await prisma.receiptCheck.create({ data: { tenant_id: tenantId, sale_id: sale.id, guard_user_id: req.user.userId, terminal_id: req.user.tid || null } });
  } catch (err) {
    // Dois guardas ao mesmo tempo: o indice unico decide; o segundo ve o vermelho.
    if (err && err.code === 'P2002') return res.status(409).json({ error: 'Este recibo já foi conferido.', code: 'ALREADY_CHECKED', check: await checkOf(tenantId, sale.id) });
    throw err;
  }
  await writeAudit({ req, tenantId, action: 'RECEIPT_CHECKED', entityType: 'sale', entityId: sale.id, newValue: { daily_number: sale.daily_number, total_amount: sale.total_amount, terminal_id: req.user.tid || null } });
  res.status(201).json({ ok: true, check: await checkOf(tenantId, sale.id) });
}));

module.exports = router;
module.exports.parseCode = parseCode;
