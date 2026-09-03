const prisma = require('../src/utils/prisma');
(async ()=>{
  try {
    await prisma.product.create({
      data: {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        tenant_id: '77777777-7777-7777-7777-777777777777',
        name: 'TenantB Product',
        category: 'padaria',
        sell_price: 2000,
        cost_price: 1200,
        stock_qty: 30
      }
    });
    console.log('Inserted product for tenant 7777');
  } catch (e) {
    console.error('Insert product error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
