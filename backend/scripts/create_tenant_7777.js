const prisma = require('../src/utils/prisma');
(async ()=>{
  try {
    await prisma.tenant.create({
      data: {
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Tenant B 7777',
        owner_name: 'Owner B',
        business_type: 'padaria',
        location: 'Zona B',
        phone: '+258777',
        status: 'active'
      }
    });
    console.log('Created tenant 7777');
  } catch(e) {
    console.error('Create tenant error:', e.message || e);
  } finally {
    await prisma.$disconnect();
  }
})();
