const prisma = require('../utils/prisma');
const { lineAmount } = require('../utils/units');
const { daysUntilExpiry } = require('../utils/fefo');
const { tr } = require('../utils/lang');

// Alertas da loja: stock baixo e validades POR LOTE (Genesis 2.1).
// Um lote entra no alerta quando faltam <= Tenant.expiry_alert_days dias.
async function getTenantAlertSnapshot(tenantId, now = new Date()) {
  const [products, tenant, lots] = await Promise.all([
    prisma.product.findMany({ where: { tenant_id: tenantId, is_active: true }, orderBy: { stock_qty: 'asc' } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { expiry_alert_days: true } }),
    prisma.stockLot.findMany({
      where: { tenant_id: tenantId, quantity_remaining: { gt: 0 }, expiry_date: { not: null } },
      include: { product: { select: { name: true, barcode: true, stock_qty: true, is_active: true, unit: true } } },
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
      unit: l.product?.unit || 'un',
      value: lineAmount(l.quantity_remaining, l.unit_cost, l.product?.unit),
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

// 9.6: na lingua de quem pede o envio (lang).
function buildAlertSummary(tenant, snapshot, lang = 'pt') {
  const parts = [];
  if (snapshot.lowStockProducts.length) {
    parts.push(tr(lang, 'Stock baixo: {list}', { list: snapshot.lowStockProducts.map((item) => `${item.name} (${item.stock_qty}/${item.min_stock})`).join(', ') }));
  }
  if (snapshot.expiringLots.length) {
    const state = (l) => (l.days_left < 0 ? tr(lang, 'expiradas') : l.days_left === 0 ? tr(lang, 'expiram hoje') : tr(lang, 'expiram em {n} dia(s)', { n: l.days_left }));
    parts.push(tr(lang, 'Validades: {list}', { list: snapshot.expiringLots.map((l) => tr(lang, '{name} — {n} un. {state}', { name: l.name, n: l.quantity, state: state(l) })).join(', ') }));
  }
  const name = tenant?.name || tr(lang, 'gestor');
  if (!parts.length) {
    return tr(lang, 'Olá {name}, todos os produtos estão dentro do normal.', { name });
  }

  return tr(lang, 'Olá {name}, Genesis reportou alertas operacionais: {list}', { name, list: parts.join(' | ') });
}

module.exports = { getTenantAlertSnapshot, buildAlertSummary };
