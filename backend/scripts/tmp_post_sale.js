require('dotenv').config();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const prisma = require('../src/utils/prisma');

(async () => {
  try {
    const userId = '92cfd812-2d84-43fa-a585-a12af43051e2';
    const tenantId = '0cfa6eac-7373-4049-bd0b-6dffba21aba3';
    const token = jwt.sign({ userId, tenantId, role: 'owner', name: 'Cliente Teste' }, process.env.JWT_SECRET || 'Genesis2026!SecureSecret', { expiresIn: '24h' });
    // verify token locally
    try { jwt.verify(token, process.env.JWT_SECRET || 'Genesis2026!SecureSecret'); console.log('token ok'); } catch(e){ console.error('local verify failed', e); }

    // get a product for tenant
    const prod = await prisma.product.findFirst({ where: { tenant_id: tenantId, is_active: true } });
    if (!prod) throw new Error('No product');

    const salePayload = {
      id: undefined,
      cashier_user_id: userId,
      items: [
        { product_id: prod.id, product_name: prod.name, quantity: 2, unit_sell_price: prod.sell_price, unit_cost_price: prod.cost_price }
      ],
      total_amount: prod.sell_price * 2,
      total_cost: prod.cost_price * 2,
      payment_method: 'cash',
      amount_received: prod.sell_price * 2,
      change_given: 0,
      status: 'completed'
    };

    const res = await fetch('http://127.0.0.1:4000/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, 'x-tenant-id': tenantId, 'x-user-id': userId },
      body: JSON.stringify(salePayload)
    });

    const body = await res.text();
    console.log('STATUS', res.status, body);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
