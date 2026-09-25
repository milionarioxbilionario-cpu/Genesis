require('dotenv').config();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const prisma = require('../src/utils/prisma');

(async () => {
  try {
    const userId = '92cfd812-2d84-43fa-a585-a12af43051e2';
    const tenantId = '0cfa6eac-7373-4049-bd0b-6dffba21aba3';
    const token = jwt.sign({ userId, tenantId, role: 'owner', name: 'Cliente Teste' }, process.env.JWT_SECRET || 'Genesis2026!SecureSecret', { expiresIn: '24h' });

    const prod = await prisma.product.findFirst({ where: { tenant_id: tenantId, is_active: true } });
    if (!prod) throw new Error('No product');

    const payload = {
      id: undefined,
      product_id: prod.id,
      quantity: 1,
      reason: 'broken',
      recorded_by: userId
    };

    const res = await fetch('http://127.0.0.1:4000/api/shrinkage_records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, 'x-tenant-id': tenantId, 'x-user-id': userId },
      body: JSON.stringify(payload)
    });

    const body = await res.text();
    console.log('STATUS', res.status, body);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
