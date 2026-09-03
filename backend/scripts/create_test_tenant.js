const prisma = require('../src/utils/prisma');
(async ()=>{
  try{
    await prisma.tenant.createMany({data:[{id:'44444444-4444-4444-4444-444444444444',name:'Test Tenant 4444',owner_name:'Owner T',business_type:'mercearia',location:'Zona T',phone:'+258444',status:'active'}],skipDuplicates:true});
    await prisma.product.createMany({data:[{id:'cccccccc-cccc-cccc-cccc-cccccccccccc',tenant_id:'44444444-4444-4444-4444-444444444444',name:'Test Product',category:'mercearia',sell_price:1000,cost_price:800,stock_qty:50}],skipDuplicates:true});
    console.log('Created test tenant and product');
  }catch(e){console.error(e);}finally{await prisma.$disconnect();}
})();
