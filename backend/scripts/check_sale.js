const prisma = require('../src/utils/prisma');
(async ()=>{
  try {
    const sale = await prisma.sale.findUnique({ where: { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd' }, include: { items: true } });
    console.log('Sale:');
    console.dir(sale, { depth: null });
    const product = await prisma.product.findUnique({ where: { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' } });
    console.log('Product after sale:');
    console.dir(product, { depth: null });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
