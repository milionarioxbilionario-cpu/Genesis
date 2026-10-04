// Perda automatica por validade (Genesis 2.1, Fase 3).
//
// De hora a hora (e no arranque): cada lote com stock cuja validade ja passou
// vira uma QUEBRA com motivo "expired" — produto, lote, quantidade e custo —
// e sai do stock. Ninguem tem de se lembrar de registar.
//
// Seguranca:
//  - a procura de lotes vencidos corre no cliente de sistema (todas as lojas);
//  - cada loja e processada dentro de runWithTenant (cliente com RLS);
//  - idempotente: o lote so e zerado se ainda tiver exactamente a quantidade
//    lida; um segundo processo (ou uma venda pelo meio) nao gera perda dupla.
const prisma = require('../utils/prisma');
const { isExpired } = require('../utils/fefo');

const HOUR_MS = 3600 * 1000;

// Parte pura (testada): que lotes passaram a validade.
function expiredLots(lots, now = new Date()) {
  return lots.filter((l) => l.quantity_remaining > 0 && isExpired(l.expiry_date, now));
}

async function processTenant(tenantId, lots) {
  return prisma.runWithTenant(tenantId, async () => {
    const owner = await prisma.user.findFirst({ where: { tenant_id: tenantId, role: 'owner' }, orderBy: { created_at: 'asc' }, select: { id: true } });
    if (!owner) return 0; // sem dono nao ha a quem atribuir o registo (user_id e obrigatorio)
    let done = 0;
    for (const lot of lots) {
      const created = await prisma.$transaction(async (tx) => {
        const closed = await tx.stockLot.updateMany({
          where: { id: lot.id, tenant_id: tenantId, quantity_remaining: lot.quantity_remaining },
          data: { quantity_remaining: 0 },
        });
        if (closed.count !== 1) return false; // ja tratado ou mexido entretanto
        const product = await tx.product.findFirst({ where: { id: lot.product_id, tenant_id: tenantId }, select: { stock_qty: true } });
        // Stock nunca negativo, mesmo que lotes e stock tenham divergido no passado.
        const qty = Math.min(lot.quantity_remaining, product ? product.stock_qty : 0);
        if (qty > 0) {
          await tx.product.updateMany({ where: { id: lot.product_id, tenant_id: tenantId, stock_qty: { gte: qty } }, data: { stock_qty: { decrement: qty } } });
        }
        const rec = await tx.shrinkageRecord.create({ data: {
          tenant_id: tenantId, product_id: lot.product_id, quantity: lot.quantity_remaining, reason: 'expired',
          lot_id: lot.id, unit_cost: lot.unit_cost, recorded_by: owner.id, recorded_at: new Date(),
        } });
        await tx.auditLog.create({ data: {
          tenant_id: tenantId, user_id: owner.id, action: 'AUTO_EXPIRY_LOSS', entity_type: 'shrinkage_record', entity_id: rec.id,
          new_value: JSON.stringify({ lot_id: lot.id, product_id: lot.product_id, quantity: lot.quantity_remaining, expiry_date: lot.expiry_date, unit_cost: lot.unit_cost, stock_removed: qty }),
          ip_address: 'sistema',
        } });
        return true;
      });
      if (created) done += 1;
    }
    return done;
  });
}

// `tenantId` opcional: limita a uma loja (testes; o servidor corre para todas).
async function runExpiryJob({ now = new Date(), tenantId = null } = {}) {
  // Lotes vencidos ate ontem (a filtragem fina por dia de Maputo e feita em isExpired).
  const candidates = await prisma.stockLot.findMany({
    where: { quantity_remaining: { gt: 0 }, expiry_date: { not: null, lt: now }, ...(tenantId ? { tenant_id: tenantId } : {}) },
    select: { id: true, tenant_id: true, product_id: true, quantity_remaining: true, expiry_date: true, unit_cost: true },
  });
  const byTenant = new Map();
  for (const lot of expiredLots(candidates, now)) {
    if (!byTenant.has(lot.tenant_id)) byTenant.set(lot.tenant_id, []);
    byTenant.get(lot.tenant_id).push(lot);
  }
  let total = 0;
  for (const [tenantId, lots] of byTenant) {
    try { total += await processTenant(tenantId, lots); } catch (err) { console.error('[validades] loja ' + tenantId + ':', err.message); }
  }
  if (total) console.log(`[validades] ${total} lote(s) vencido(s) registados como perda`);
  return total;
}

function startExpiryJob() {
  if (String(process.env.EXPIRY_JOB || 'true').toLowerCase() === 'false') return null;
  const run = () => runExpiryJob().catch((err) => console.error('[validades] falhou:', err.message));
  const first = setTimeout(run, 15 * 1000);
  const every = setInterval(run, HOUR_MS);
  first.unref(); every.unref();
  return { first, every };
}

module.exports = { expiredLots, runExpiryJob, startExpiryJob };
