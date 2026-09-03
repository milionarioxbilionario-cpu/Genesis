require('dotenv').config();
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE || 'http://localhost:4000';

async function waitForServer(timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${API_BASE}/`);
      if (res.ok) return true;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server did not become ready in time');
}

async function run() {
  console.log('Starting shift-closing E2E script');

  const tenantName = `Shift E2E Tenant ${Date.now()}`;
  const ownerEmail = `owner+${Date.now()}@example.test`;
  const cashierEmail = `cashier+${Date.now()}@example.test`;
  const password = 'Pass123!';

  // Create tenant and users
  const tenant = await prisma.tenant.create({ data: { name: tenantName, owner_name: 'Owner S', business_type: 'mercearia', location: 'Loc', phone: '+000', status: 'trial' } });
  const ownerHash = await bcrypt.hash(password, 12);
  const owner = await prisma.user.create({ data: { tenant_id: tenant.id, role: 'owner', name: 'Owner S', email: ownerEmail, password_hash: ownerHash, is_active: true } });

  const cashierHash = await bcrypt.hash(password, 12);
  const cashier = await prisma.user.create({ data: { tenant_id: tenant.id, role: 'cashier', name: 'Cashier S', email: cashierEmail, password_hash: cashierHash, is_active: true } });

  console.log('Created tenant and users:', tenant.id, ownerEmail, cashierEmail);

  await waitForServer(60000);

  // Login cashier
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: cashierEmail, password }) });
  const loginJson = await loginRes.json();
  if (!loginRes.ok) throw new Error('Cashier login failed: ' + JSON.stringify(loginJson));
  const cashierToken = loginJson.token;
  console.log('Cashier logged in');

  // Owner login to set PIN (optional) - not required for shift closing but we'll set
  const loginOwnerRes = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password }) });
  const loginOwnerJson = await loginOwnerRes.json();
  if (!loginOwnerRes.ok) throw new Error('Owner login failed: ' + JSON.stringify(loginOwnerJson));
  const ownerToken = loginOwnerJson.token;

  // Create a product as owner
  const prodRes = await fetch(`${API_BASE}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }, body: JSON.stringify({ name: 'Shift Product', sell_price: 200, cost_price: 100, stock_qty: 5 }) });
  const prodJson = await prodRes.json();
  if (!prodRes.ok) throw new Error('Create product failed: ' + JSON.stringify(prodJson));
  const productId = prodJson.id;
  console.log('Product created:', productId);

  // Create a sale as cashier
  const salePayload = { items: [{ product_id: productId, product_name: 'Shift Product', quantity: 1, unit_sell_price: 200, unit_cost_price: 100 }], total_amount: 200, total_cost: 100, payment_method: 'cash', amount_received: 200 };
  const saleRes = await fetch(`${API_BASE}/api/sales`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cashierToken}` }, body: JSON.stringify(salePayload) });
  const saleJson = await saleRes.json();
  if (!saleRes.ok) throw new Error('Create sale failed: ' + JSON.stringify(saleJson));
  const saleId = saleJson.id;
  console.log('Sale created by cashier:', saleId);

  // Perform shift closing as cashier
  const counted = 200;
  const expected = 200;
  const closeRes = await fetch(`${API_BASE}/api/shift_closings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cashierToken}` }, body: JSON.stringify({ counted_amount: counted, expected_amount: expected }) });
  const closeJson = await closeRes.json();
  if (!closeRes.ok) throw new Error('Shift closing failed: ' + JSON.stringify(closeJson));
  console.log('Shift closing response:', closeJson);

  // Verify in DB
  const record = await prisma.shiftClosing.findUnique({ where: { id: closeJson.id } });
  console.log('ShiftClosing recorded in DB:', { id: record.id, difference: record.difference });

  // Audit log check
  const logs = await prisma.auditLog.findMany({ where: { action: 'SHIFT_CLOSING', tenant_id: tenant.id }, orderBy: { created_at: 'desc' }, take: 5 });
  console.log('Recent SHIFT_CLOSING logs:', logs.map(l => ({ id: l.id, entity_id: l.entity_id })) );

  console.log('Shift-closing E2E completed successfully');
  await prisma.$disconnect();
}

run().catch(async (err) => { console.error('Shift E2E failed:', err); await prisma.$disconnect(); process.exit(1); });
