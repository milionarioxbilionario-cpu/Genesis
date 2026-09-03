const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

router.get('/summary', auth, requireRole('owner', 'cashier'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [products, recentSales, salesToday, salesMonth, revenueToday, revenueMonth] = await Promise.all([
      prisma.product.findMany({
        where: { tenant_id: tenantId, is_active: true },
        orderBy: { created_at: 'desc' }
      }),
      prisma.sale.findMany({
        where: { tenant_id: tenantId },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: { items: true }
      }),
      prisma.sale.count({
        where: {
          tenant_id: tenantId,
          created_at: { gte: todayStart }
        }
      }),
      prisma.sale.count({
        where: {
          tenant_id: tenantId,
          created_at: { gte: monthStart }
        }
      }),
      prisma.sale.aggregate({
        where: {
          tenant_id: tenantId,
          created_at: { gte: todayStart }
        },
        _sum: { total_amount: true }
      }),
      prisma.sale.aggregate({
        where: {
          tenant_id: tenantId,
          created_at: { gte: monthStart }
        },
        _sum: { total_amount: true }
      })
    ]);

    const stockTotal = products.reduce((sum, product) => sum + Number(product.stock_qty || 0), 0);
    const lowStockProducts = products.filter((product) => Number(product.stock_qty || 0) <= Number(product.min_stock || 0));
    const lowStockCount = lowStockProducts.length;

    return res.json({
      productsCount: products.length,
      stockTotal,
      lowStockCount,
      lowStockProducts: lowStockProducts.map((product) => ({
        id: product.id,
        name: product.name,
        stock_qty: product.stock_qty,
        min_stock: product.min_stock,
        category: product.category
      })),
      salesToday,
      salesMonth,
      revenueToday: revenueToday._sum.total_amount || 0,
      revenueMonth: revenueMonth._sum.total_amount || 0,
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        total_amount: sale.total_amount,
        payment_method: sale.payment_method,
        created_at: sale.created_at,
        itemCount: sale.items.length
      }))
    });
  } catch (err) {
    console.error('Dashboard summary error', err);
    return res.status(500).json({ error: 'Erro ao carregar resumo do negócio' });
  }
});

module.exports = router;
