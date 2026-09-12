const prisma = require('../utils/prisma');

async function getTenantAlertSnapshot(tenantId) {
  const products = await prisma.product.findMany({
    where: { tenant_id: tenantId, is_active: true },
    orderBy: { stock_qty: 'asc' }
  });

  const lowStockProducts = products.filter((product) => Number(product.stock_qty || 0) <= Number(product.min_stock || 0));
  const expiredProducts = products.filter((product) => Boolean(product.has_expiry) && product.expiry_date && new Date(product.expiry_date) < new Date());

  return {
    totalAlerts: lowStockProducts.length + expiredProducts.length,
    lowStockProducts: lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      stock_qty: Number(product.stock_qty || 0),
      min_stock: Number(product.min_stock || 0),
    })),
    expiredProducts: expiredProducts.map((product) => ({
      id: product.id,
      name: product.name,
      expiry_date: product.expiry_date,
      stock_qty: Number(product.stock_qty || 0),
    })),
  };
}

function buildAlertSummary(tenant, snapshot) {
  const parts = [];
  if (snapshot.lowStockProducts.length) {
    parts.push(`Stock baixo: ${snapshot.lowStockProducts.map((item) => `${item.name} (${item.stock_qty}/${item.min_stock})`).join(', ')}`);
  }
  if (snapshot.expiredProducts.length) {
    parts.push(`Validade vencida: ${snapshot.expiredProducts.map((item) => `${item.name} (${new Date(item.expiry_date).toLocaleDateString('pt-MZ')})`).join(', ')}`);
  }
  if (!parts.length) {
    return `Olá ${tenant?.name || 'gestor'}, todos os produtos estão dentro do normal.`;
  }

  return `Olá ${tenant?.name || 'gestor'}, Genesis reportou alertas operacionais: ${parts.join(' | ')}`;
}

module.exports = { getTenantAlertSnapshot, buildAlertSummary };
