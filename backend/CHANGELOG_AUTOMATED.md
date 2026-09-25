2026-09-05 - Automated changes applied by assistant

- Security: Enforced JWT-only authentication for protected routes and normalized req.user in auth middleware. Removed global DB session variable setting from middleware to avoid tenant leakage.
- RLS: Added per-transaction `SET LOCAL app.tenant_id` within critical transactions (sales, demand_captures, shrinkage_records). Safe-guarded to skip on local SQLite dev.db.
- Routes: Demand captures and shrinkage endpoints updated to require auth and run inside transactions with audit logs. Registered these routes under authMiddleware + requireRole.
- Frontend: useOfflineSync now attaches Authorization header (Bearer token from localStorage) when present. POS finalize triggers a receipt print attempt (printReceipt helper). Dexie schema updated to include shrinkage_records.
- Tests: Ran tmp_post_demand_capture.js, tmp_post_shrinkage.js and tmp_post_sale.js; all returned 201 and updated DB (verified new IDs and stock changes).

Notes:
- The per-transaction SET LOCAL is a Postgres-only mechanism. For local SQLite (dev.db) the code skips the SET to avoid syntax errors.
- For production, ensure the DATABASE_URL points to Postgres and RLS SQL from backend/prisma/rls_policies.sql is applied.

If anything unexpected appears, revert via git. Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
