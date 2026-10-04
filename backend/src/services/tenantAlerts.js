const prisma = require('../utils/prisma');
const { daysUntilExpiry } = require('../utils/fefo');

// Alertas da loja: stock baixo e validades POR LOTE (Genesis 2.1).
// Um lote entra no alerta quando faltam <= Tenant.expiry_alert_days dias.
async function getTenantAlertSnapshot(tenantId, now = new Date()) {
  const [products, tenant, lots] = await Promise.all([
    prisma.product.findMany({ where: { tenant_id: tenantId, is_active: true }, orderBy: { stock_qty: 'asc' } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { expiry_alert_days: true } }),
    prisma.stockLot.findMany({
      where: { tenant_id: tenantId, quantity_remaining: { gt: 0 }, expiry_date: { not: null } },
      include: { product: { select: { name: true, barcode: true, stock_qty: true, is_active: true } } },
      orderBy: { expiry_date: 'asc' },
    }),
  ]);
  const alertDays = tenant?.expiry_alert_days ?? 7;

  const lowStockProducts = products.filter((product) => Number(product.stock_qty || 0) <= Number(product.min_stock || 0));
  const expiringLots = lots
    .filter((l) => l.product?.is_active !== false)
    .map((l) => ({
      lot_id: l.id,
      product_id: l.product_id,
      name: l.product?.name || '—',
      barcode: l.product?.barcode || null,
      quantity: l.quantity_remaining,
      product_stock: l.product?.stock_qty ?? null,
      expiry_date: l.expiry_date,
      days_left: daysUntilExpiry(l.expiry_date, now),
      value: l.quantity_remaining * l.unit_cost,
    }))
    .filter((l) => l.days_left <= alertDays);
  const expiredProducts = expiringLots.filter((l) => l.days_left < 0);

  return {
    alert_days: alertDays,
    totalAlerts: lowStockProducts.length + expiringLots.length,
    lowStockProducts: lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      stock_qty: Number(product.stock_qty || 0),
      min_stock: Number(product.min_stock || 0),
    })),
    expiringLots,
    expiredProducts,
  };
}

function buildAlertSummary(tenant, snapshot) {
  const parts = [];
  if (snapshot.lowStockProducts.length) {
    parts.push(`Stock baixo: ${snapshot.lowStockProducts.map((item) => `${item.name} (${item.stock_qty}/${item.min_stock})`).join(', ')}`);
  }
  if (snapshot.expiringLots.length) {
    parts.push(`Validades: ${snapshot.expiringLots.map((l) => `${l.name} — ${l.quantity} un. ${l.days_left < 0 ? 'expiradas' : l.days_left === 0 ? 'expiram hoje' : `expiram em ${l.days_left} dia(s)`}`).join(', ')}`);
  }
  if (!parts.length) {
    return `Olá ${tenant?.name || 'gestor'}, todos os produtos estão dentro do normal.`;
  }

  return `Olá ${tenant?.name || 'gestor'}, Genesis reportou alertas operacionais: ${parts.join(' | ')}`;
}

module.exports = { getTenantAlertSnapshot, buildAlertSummary };
