const prisma = require('../src/utils/prisma');
const fetch = require('node-fetch');

(async () => {
  try {
    // find an owner user and a product for their tenant
    const owner = await prisma.user.findFirst({ where: { role: 'owner' } });
    if (!owner) return console.error('no owner user');
    const product = await prisma.product.findFirst({ where: { tenant_id: owner.tenant_id } });
    if (!product) return console.error('no product for tenant', owner.tenant_id);

    const secret = process.argv[2] || '41fe1cda-dc95-436c-be45-aad3589e0f8a.HWkqGrva32Geij2culyOXv7-4S6eefyA';

    const payload = {
      items: [
        { product_id: product.id, product_name: product.name, quantity: 1, unit_sell_price: product.sell_price || 1000, unit_cost_price: product.cost_price || 800 }
      ],
      total_amount: product.sell_price || 1000,
      total_cost: product.cost_price || 800,
      payment_method: 'cash'
    };

    console.log('Using product', product.id, product.name);

    const res = await fetch('http://localhost:4000/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Device ' + secret },
      body: JSON.stringify(payload)
    });

    console.log('STATUS', res.status, await res.text());
    process.exit(0);
  } catch (e) { console.error(e); process.exit(2); }
})();
