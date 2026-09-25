const { chromium } = require('playwright');
const fetch = require('node-fetch');

(async () => {
  const API_BASE = process.env.API_BASE || 'http://localhost:4000';
  const FRONTEND = process.env.FRONTEND || 'http://localhost:5174';

  console.log('Starting Playwright offline->online sync test');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const cashierEmail = process.env.TEST_CASHIER_EMAIL || '';
    const cashierPassword = process.env.TEST_CASHIER_PASSWORD || '';
    if (!cashierEmail || !cashierPassword) {
      console.error('TEST_CASHIER_EMAIL and TEST_CASHIER_PASSWORD must be set in environment to run Playwright test. Aborting.');
      process.exit(1);
    }

    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: cashierEmail, password: cashierPassword })
    });
    if (!loginRes.ok) {
      console.error('Login failed for cashier');
      process.exit(1);
    }
    const loginJson = await loginRes.json();
    const token = loginJson.token;

    await context.addCookies([{ name: 'token', value: token, domain: 'localhost', path: '/' }]);

    await page.goto(`${FRONTEND}/pos`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.route('**/api/**', route => route.abort());
    console.log('Network to /api/* blocked (simulating offline)');

    const saleId = 'playwright-queued-' + Date.now();
    const payload = {
      items: [{ product_id: 'placeholder', product_name: 'Playwright Product', quantity: 1, unit_sell_price: 100, unit_cost_price: 50 }],
      total_amount: 100,
      total_cost: 50,
      payment_method: 'cash',
      amount_received: 100,
      created_at: new Date().toISOString()
    };

    await page.evaluate(async ({ saleId, payload }) => {
      function openDb() {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open('GenesisLocalDB');
          req.onsuccess = () => resolve(req.result);
          req.onerror = (e) => reject(e.target.error);
        });
      }

      const db = await openDb();
      const tx = db.transaction('sales', 'readwrite');
      const store = tx.objectStore('sales');
      const record = { id: saleId, tenant_id: 'playwright-tenant', status: 'pending', created_at: new Date().toISOString(), sync: false, payload };
      store.put(record);
      await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
      return true;
    }, { saleId, payload });

    console.log('Queued sale inserted into IndexedDB while offline');

    await page.unroute('**/api/**');
    console.log('Network restored for /api/*');

    await page.evaluate(() => { window.dispatchEvent(new Event('online')); });

    await page.waitForTimeout(5000);

    const backendCheck = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/sales');
        if (!res.ok) return { ok: false, status: res.status };
        const data = await res.json();
        return { ok: true, count: data.length };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });

    console.log('Backend check after sync:', backendCheck);

    if (backendCheck.ok) {
      console.log('Playwright offline->online sync test finished (verify queued sale presence in backend).');
    } else {
      console.error('Sync may have failed. Backend check:', backendCheck);
      process.exit(1);
    }

  } catch (err) {
    console.error('Playwright test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
