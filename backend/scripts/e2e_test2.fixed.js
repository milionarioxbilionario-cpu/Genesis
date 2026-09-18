require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fetch = global.fetch || require('node-fetch');

const prisma = new PrismaClient();

const API_BASE = process.env.API_BASE || 'http://localhost:4000';

async function waitForServer(timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${API_BASE}/`);
      if (res.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server did not become ready in time');
}

async function run() {
  console.log('Starting E2E test script (v2 fixed)');

  // 1) Create tenant and owner user directly using Prisma
  const tenantName = `E2E Test Tenant ${Date.now()}`;
  const ownerEmail = `owner+${Date.now()}@example.test`;
  const ownerPassword = '<password-demo-removida-do-historico>';

  console.log('Creating tenant and owner user via Prisma...');
  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      owner_name: 'E2E Owner',
      business_type: 'mercearia',
      location: 'Test Location',
      phone: '+000000000',
      status: 'trial'
    }
  });

  const owner = await prisma.user.create({
    data: {
      tenant_id: tenant.id,
      role: 'owner',
      name: 'E2E Owner',
      email: ownerEmail,
      password_hash: passwordHash,
      is_active: true
    }
  });

  console.log('Tenant and owner created:', tenant.id, ownerEmail);

  // Wait for server
  console.log('Waiting for backend to be ready...');
  await waitForServer(60000);
  console.log('Backend is ready');

  // 2) Login as owner
  console.log('Logging in as owner...');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, password: ownerPassword })
  });
  const loginJson = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
  }
  const ownerToken = loginJson.token; // API returns token and sets cookie
  if (!ownerToken) {
    console.warn('No token returned by login; script will rely on cookies set by the login response instead. If this fails, run the script with a bearer token strategy.');
  }
  console.log('Owner token received (or cookie set)');

  // Helper to create headers with token if present
  const authHeaders = (extra = {}) => {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (ownerToken) h['Authorization'] = `Bearer ${ownerToken}`;
    return h;
  };

  // 3) Configure cancel PIN
  const pin = '1234';
  console.log('Setting cancel PIN...');
  const pinRes = await fetch(`${API_BASE}/api/sales/cancel-pin`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ pin })
  });
  const pinJson = await pinRes.json();
  if (!pinRes.ok) throw new Error('Failed to set PIN: ' + JSON.stringify(pinJson));
  console.log('PIN configured');

  // 4) Create a product
  console.log('Creating product...');
  const prodRes = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name: 'E2E Test Product', sell_price: 500, cost_price: 300, stock_qty: 10 })
  });
  const prodJson = await prodRes.json();
  if (!prodRes.ok) throw new Error('Failed to create product: ' + JSON.stringify(prodJson));
  const productId = prodJson.id;
  console.log('Product created:', productId);

  // 5) Register a sale as owner (acting as cashier)
  console.log('Creating sale...');
  const salePayload = {
    items: [
      { product_id: productId, product_name: 'E2E Test Product', quantity: 2, unit_sell_price: 500, unit_cost_price: 300 }
    ],
    total_amount: 1000,
    total_cost: 600,
    payment_method: 'cash',
    amount_received: 1000,
    change_given: 0
  };

  const saleRes = await fetch(`${API_BASE}/api/sales`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(salePayload)
  });
  const saleJson = await saleRes.json();
  if (!saleRes.ok) throw new Error('Failed to create sale: ' + JSON.stringify(saleJson));
  const saleId = saleJson.id;
  console.log('Sale created:', saleId);

  // 6) Cancel the sale using PIN
  console.log('Cancelling sale with PIN...');
  const cancelRes = await fetch(`${API_BASE}/api/sales/${saleId}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ pin })
  });
  const cancelJson = await cancelRes.json();
  if (!cancelRes.ok) throw new Error('Failed to cancel sale: ' + JSON.stringify(cancelJson));
  console.log('Cancel response:', cancelJson);

  // 7) Verify product stock restored
  const prodAfter = await prisma.product.findUnique({ where: { id: productId } });
  console.log('Product stock after cancellation:', prodAfter.stock_qty);

  // 8) Check audit log for CANCEL_SALE
  const logs = await prisma.auditLog.findMany({ where: { action: 'CANCEL_SALE', tenant_id: tenant.id }, orderBy: { created_at: 'desc' }, take: 5 });
  console.log('Recent CANCEL_SALE audit logs:', logs.map(l => ({ id: l.id, entity_id: l.entity_id, created_at: l.created_at })));

  console.log('E2E test completed successfully');
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('E2E test failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});