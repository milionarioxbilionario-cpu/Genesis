Offline -> Online sync test plan for Genesis (manual + automated guidance)

Goal
- Verify that the frontend queues sales when offline (IndexedDB/Dexie), and when network is restored the queued sales are POSTed to /api/sales and marked synced.

Prerequisites
- Backend running: http://localhost:4000 (see backend/.env)
- Frontend preview running: http://localhost:5174 (npm run preview -- --port 5174)
- A test tenant and an owner/cashier user (scripts provided in backend/scripts/e2e_test2.js and shift_closing_e2e.js)

Manual test (recommended for device testing)
1. Start backend and frontend preview.
2. Create tenant + owner + cashier (use backend/scripts/e2e_test2.js or create via Admin flows).
3. Login in the browser to the frontend as owner and create a product (or use API to create product and note the product_id).
4. On the cashier device (or a browser tab):
   a. Open the Cashier POS page and login as cashier.
   b. Turn off network (airplane mode or disable network) OR open DevTools > Network > Offline.
   c. Create a sale normally in the POS and attempt to complete it. Verify the frontend shows a queued/sync indicator (UX element) and that the sale appears in the local queue (IndexedDB). In DevTools Application > IndexedDB, inspect the Dexie DB and the queue table (usually `queuedSales` or similar).
   d. Re-enable network.
   e. Observe background sync: the queued sale should be POSTed to the backend, and the frontend should mark it as synced and remove it from the queue. Verify the sale exists in backend: GET /api/sales (authenticated) or check AuditLog.

Automated guidance (what can be scripted reliably)
- The project includes API-level E2E scripts that validate the core flows (create tenant, users, product, sale, cancel). See backend/scripts/e2e_test2.js and backend/scripts/shift_closing_e2e.js
- A fully automated browser-based offline simulation is brittle (depends on DOM structure, timing, and IndexedDB keys). If you want, we can implement a Playwright test that:
  * opens the frontend preview
  * logs in as cashier (via UI or by setting localStorage/token)
  * intercepts network to make the API appear offline while creating a sale
  * verifies the sale is present in IndexedDB (via page.evaluate accessing Dexie) and then restores network
  * waits for the sync to complete and verifies the sale exists on the backend

Files / scripts to help
- backend/scripts/e2e_test2.js — API-only E2E (already executed successfully here)
- backend/scripts/shift_closing_e2e.js — shift closing flow (executed)
- docs/curl_collection.sh — curl snippets for manual API validation
- docs/postman_genesis_collection.json — Postman collection for core flows

Next steps to automate offline UI sync (if you want me to implement):
- Implement a Playwright script that manipulates DevTools network offline/online and inspects IndexedDB to confirm queueing.
- Add the Playwright package to frontend devDependencies and a lightweight test command (e.g., npm run test:playwright).

If you'd like the Playwright test now, reply "implement Playwright test"; otherwise, use the manual checklist above.
