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
        take: 6,
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
    // Valor imobilizado em stock (ao preco de custo) — usado no KPI da Visao Geral.
    const stockValue = products.reduce((sum, product) => sum + (Number(product.cost_price || 0) * Number(product.stock_qty || 0)), 0);

    return res.json({
      productsCount: products.length,
      stockTotal,
      stockValue,
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

router.get('/reports', auth, requireRole('owner', 'cashier'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const days = 7;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const sales = await prisma.sale.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: start }
      },
      orderBy: { created_at: 'asc' },
      include: { items: true }
    });

    const dailyMap = new Map();
    for (const sale of sales) {
      const key = new Date(sale.created_at).toISOString().slice(0, 10);
      const existing = dailyMap.get(key) || { date: key, revenue: 0, orders: 0 };
      existing.revenue += Number(sale.total_amount || 0);
      existing.orders += 1;
      dailyMap.set(key, existing);
    }

    const salesByDay = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const entry = dailyMap.get(key) || { revenue: 0, orders: 0 };
      return {
        label: date.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' }),
        revenue: Number(entry.revenue || 0),
        orders: Number(entry.orders || 0)
      };
    });

    const productBuckets = new Map();
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.product_name || 'Produto';
        const existing = productBuckets.get(key) || { name: key, qty: 0, revenue: 0 };
        existing.qty += Number(item.quantity || 0);
        existing.revenue += Number(item.unit_sell_price || 0) * Number(item.quantity || 0);
        productBuckets.set(key, existing);
      }
    }

    const topProducts = Array.from(productBuckets.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);

    return res.json({
      salesByDay,
      topProducts,
      totalRevenue,
      totalOrders: sales.length,
      averageTicket: sales.length ? (totalRevenue / sales.length) : 0
    });
  } catch (err) {
    console.error('Dashboard reports error', err);
    return res.status(500).json({ error: 'Erro ao carregar relatórios' });
  }
});

module.exports = router;
