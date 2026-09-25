require('dotenv').config();
const prisma = require('../src/utils/prisma');
(async () => {
  try {
    const tenantId = '0cfa6eac-7373-4049-bd0b-6dffba21aba3';
    const p = await prisma.product.create({
      data: {
        tenant_id: tenantId,
        name: 'Produto Teste',
        category: 'Geral',
        barcode: 'PT-001',
        cost_price: 1000,
        sell_price: 1500,
        stock_qty: 100,
        is_active: true
      }
    });
    console.log('created', p.id);
  } catch (e) {
    console.error('err', e);
  } finally {
    await prisma.$disconnect();
  }
})();
