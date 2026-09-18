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
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Server did not become ready in time');
}

async function run() {
  console.log('Starting smoke tests...');
  await waitForServer(60000);

  const tenantName = `SMOKE Tenant ${Date.now()}`;
  const ownerEmail = `smoke+${Date.now()}@example.test`;
  const ownerPassword = '<password-demo-removida-do-historico>';

  const passwordHash = await bcrypt.hash(ownerPassword, 12);
  const tenant = await prisma.tenant.create({ data: { name: tenantName, owner_name: 'Smoke Owner', business_type: 'mercearia', location: 'Test', phone: '+000000001', status: 'trial' } });
  const owner = await prisma.user.create({ data: { tenant_id: tenant.id, role: 'owner', name: 'Smoke Owner', email: ownerEmail, password_hash: passwordHash, is_active: true } });
  console.log('Tenant/owner created:', tenant.id, ownerEmail);

  // Login
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password: ownerPassword }) });
  const loginJson = await loginRes.json();
  if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginJson));
  const token = loginJson.token;
  console.log('Owner logged in');
  const authHeader = { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` };

  // Create product
  const prodRes = await fetch(`${API_BASE}/api/products`, { method: 'POST', headers: authHeader, body: JSON.stringify({ name: 'Smoke Product', sell_price: 5000, cost_price: 3000, stock_qty: 5 }) });
  const prodJson = await prodRes.json();
  if (!prodRes.ok) throw new Error('Create product failed: '+JSON.stringify(prodJson));
  const productId = prodJson.id;
  console.log('Product created', productId);

  // Create sale
  const salePayload = { items: [{ product_id: productId, product_name: 'Smoke Product', quantity: 1, unit_sell_price: 5000, unit_cost_price: 3000 }], total_amount:5000, total_cost:3000, payment_method: 'cash' };
  const saleRes = await fetch(`${API_BASE}/api/sales`, { method: 'POST', headers: authHeader, body: JSON.stringify(salePayload) });
  const saleJson = await saleRes.json();
  if (!saleRes.ok) throw new Error('Create sale failed: '+JSON.stringify(saleJson));
  const saleId = saleJson.id;
  console.log('Sale created', saleId);

  // Set cancel PIN
  const pinRes = await fetch(`${API_BASE}/api/sales/cancel-pin`, { method: 'POST', headers: authHeader, body: JSON.stringify({ pin: '4321' }) });
  if (!pinRes.ok) { console.warn('Setting PIN returned', await pinRes.text()); } else { console.log('PIN set'); }

  // Reports: monthly
  const now = new Date();
  const rRes = await fetch(`${API_BASE}/api/owner/reports/monthly?year=${now.getFullYear()}&month=${now.getMonth()+1}`, { headers: authHeader });
  const rJson = await rRes.json();
  console.log('Monthly report status:', rRes.status, JSON.stringify(rJson).slice(0,400));

  // Payroll (should be empty)
  const payrollRes = await fetch(`${API_BASE}/api/owner/payroll`, { headers: authHeader });
  const payrollJson = await payrollRes.json();
  console.log('Payroll:', payrollJson.employeeCount, 'employees');

  // Create employee
  const empRes = await fetch(`${API_BASE}/api/owner/employees`, { method: 'POST', headers: authHeader, body: JSON.stringify({ name: 'Smoke Emp', role: 'seller', monthly_salary: 20000 }) });
  const empJson = await empRes.json();
  console.log('Employee created:', empJson.id || empJson);

  const payrollRes2 = await fetch(`${API_BASE}/api/owner/payroll`, { headers: authHeader });
  console.log('Payroll after add:', await payrollRes2.json());

  // Alerts
  const alertsRes = await fetch(`${API_BASE}/api/owner/alerts`, { headers: authHeader });
  const alertsJson = await alertsRes.json();
  console.log('Alerts snapshot:', alertsJson);

  if (alertsJson.totalAlerts && alertsJson.totalAlerts > 0) {
    const sendRes = await fetch(`${API_BASE}/api/owner/alerts/send`, { method: 'POST', headers: authHeader, body: JSON.stringify({ phone: tenant.phone }) });
    console.log('Alerts send response:', await sendRes.json());
  } else {
    console.log('No alerts to send');
  }

  // Final health checks
  const auditRes = await fetch(`${API_BASE}/api/owner/audit`, { headers: authHeader });
  console.log('Audit entries count:', (await auditRes.json()).length);

  console.log('Smoke tests completed successfully');
  await prisma.$disconnect();
}

run().catch(async (err) => { console.error('Smoke failed', err); await prisma.$disconnect(); process.exit(1); });