# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Genesis is a multi-tenant POS / store-management system (target market: Mozambique, currency MZN). Code comments, commit messages, UI strings and API error messages are in **Portuguese (pt-PT/pt-MZ)** — keep new comments and messages in Portuguese to match.

Three independent npm projects (no workspace root; install each separately):

| Dir | What | Dev port |
|---|---|---|
| `backend/` | Express 4 + Prisma 5 API (CommonJS) | 4000 |
| `frontend/` | Owner CRM + cashier POS, React 18 + Vite PWA, offline-first (Dexie) | 5173 (proxies `/api` → 4000) |
| `admin-frontend/` | Super-admin panel, React 18 + Vite (ESM) | 5175 (strictPort) |

## Commands

```bash
# Backend (copy backend/.env.example -> backend/.env first)
cd backend && npm install          # postinstall runs `prisma generate`
npm run dev                        # node src/index.js (no hot reload)
npm run db:check                   # smoke boot: starts server, hits API, exits
npm run db:push:pg | db:push:sqlite
npx prisma validate                # what CI runs

# Unit tests (node:test, no runner configured; they hit the real DB via prisma)
node --test backend/tests/
node --test backend/tests/monthlyDeductions.test.js   # single file

# Frontends
cd frontend && npm run dev | npm run build
cd admin-frontend && npm run dev | npm run build
```

Whole stack: `run-local.ps1` / `run-local.bat` (Windows) or `run-local.sh`; stop with `stop.*`. Logs go to `logs/`. `test.sh` is a curl health check against a running stack (needs `DEMO_OWNER_PASSWORD`). `gerir-contas.bat|.sh` → `backend/scripts/gerir_contas.js` manages user accounts/passwords.

CI (`.github/workflows/ci.yml`, Node 20) only runs `npm ci` + `prisma generate` + `prisma validate` for backend and `npm run build` for frontend — there is no lint step.

`backend/scripts/` is a mix of seed/maintenance scripts and many throwaway `tmp_*` / `_*` / `e2e_*` scripts; don't treat them as a test suite.

## Backend architecture

**DB engine selection at boot** (`src/utils/prisma.js` + `src/utils/dbEngine2.js`; `dbEngine.js` is the superseded version): `prisma.js` exports a lazy Proxy, not a PrismaClient. On `prisma.ready()` (called in `index.js` before `listen`), `dbEngine2` probes Postgres and, if `FORCE_DB=sqlite`, `DATABASE_URL=file:...`, or `DB_ALLOW_SQLITE_FALLBACK=true` with Postgres unreachable, switches to SQLite (`backend/data/genesis.db`), running `prisma generate` against the matching schema *before* `@prisma/client` is required. Consequences:
- Two schemas must be kept in sync: `prisma/schema.prisma` (postgresql, canonical, used by CI) and `prisma/schema.sqlite.prisma`.
- Never `require('@prisma/client')` directly in app code; always use `require('./utils/prisma')`.
- Startup fails closed in production on a weak `JWT_SECRET` or `DB_ALLOW_SQLITE_FALLBACK=true`.

**Multi-tenant isolation**: every tenant-scoped row has `tenant_id`. Routes filter by `req.user.tenantId` explicitly, and Postgres also has RLS policies (`prisma/rls*.sql`) keyed on `app.tenant_id`. Set that inside an interactive transaction with `applyTenantRls(tx, tenantId)` (`src/utils/tenantRls.js`, uses parameterized `set_config(..., true)`); it no-ops on SQLite. Never set tenant context globally or interpolate tenant IDs into raw SQL — the DB pool is pgbouncer in session mode (port 5432); transaction mode (6543) breaks this.

**Auth chain** (wired in `src/index.js`):
- `auth.js` — JWT from `Authorization: Bearer` or `token` cookie → `req.user = { userId, tenantId, role, name }`; rejects suspended/blocked/deleted tenants (`utils/tenantStatus.js`, 30s cache).
- `deviceKeyAuth.js` — `Authorization: Device <secret>` for POS terminals/offline sync; sets `req.deviceKey` and `req.user.tenantId`.
- `authOrDevice.js` — picks one of the above and sets `req.authVia`.
- `rbac.js` `requireRole(...)` — roles `super_admin | owner | cashier`; device keys bypass the role check **only** when `req.authVia === 'device'`.
- `/api/admin` additionally goes through `adminOriginCheck` (exact match against `ADMIN_ORIGINS`, default `http://localhost:5175`).
- Some routers (`products`, `owner`, `dashboard`, `inventory`, `catalogs`) are mounted without global auth and apply middleware per-route inside the router file.

**Domain rules worth knowing**:
- Money is stored as **integer centavos** everywhere (backend and Dexie); UI converts with `frontend/src/utils/money.js`.
- Shift closing is "blind" (cashier declares cash without seeing expected totals). `/api/shift_closings` is owner-only; cashiers close via `/api/owner/cashiers/:id/close-shift-blind` with owner password. 3 failed attempts since last `CASHIER_UNLOCKED` audit entry lock the cashier (`utils/shiftLock.js`), which also blocks sales.
- `AuditLog` is append-only and drives lock state; don't delete from it.
- Demo seed in `index.js` runs only with `SEED_DEMO_DATA=true` and requires `DEMO_*_PASSWORD` env vars.

## Frontend architecture

- `frontend/src/App.jsx`: owner routes under `/owner/*` wrapped in `ProtectedRoute requiredRole="owner"` + `CRMLayout`; POS entry is via `/hub` and `PosGate`/`CashierDashboard`.
- Offline-first POS: sales, demand captures and shrinkage records are written to Dexie (`src/db/localDb.js`, DB `GenesisLocalDB`, versioned schema — add a new `db.version(n)` rather than editing old ones) with `sync=false`; `src/hooks/useOfflineSync.js` pushes them every 30s, preferring a stored device key over the JWT (session token key is `genesis_auth`, see `utils/auth.js`).
- HTTP via the axios instance in `src/utils/api.js` (baseURL `/`, `withCredentials`), relying on the Vite proxy in dev.
- Styling: Tailwind plus custom CSS design tokens in `src/ui/` (`tokens.css`, `theme-light.css`, …) with light/dark theme via `src/theme/ThemeProvider.jsx`.

## Mind map

`Mapa Mental/` holds a 3D repo map. `node scripts/gen_mindmap_data.js` regenerates `mapa_mental_data.js` by scanning imports; per-file status/descriptions are curated by hand in `Mapa Mental/mapa_mental_status.json`. Update the status JSON when adding or significantly changing files, then regenerate.
