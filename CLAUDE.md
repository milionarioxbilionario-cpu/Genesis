# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Genesis is a multi-tenant SaaS POS / store-management system for small Mozambican merchants (bottle stores first, then mercearias, padarias, talhos…), currency MZN. The product name is **Genesis** only — "LucroCerto" / "Gestão Inteligente MZ" are dead names; any occurrence is residue to fix. Code comments, commit messages, UI strings and API error messages are in **Portuguese (pt-PT/pt-MZ)** — keep new ones in Portuguese.

`Prompt_Mestre.txt` (root) is the founder's master handoff document. Its bulky sections live in project skills — load them only when relevant:
- `genesis-spec` — full functional spec (onboarding, POS, reports, chenecas, stock, goals, hardware).
- `genesis-guia-tecnico` — reference implementation snippets (report formula, WhatsApp, wizard, QR…).
- `genesis-historico-auditoria` — 13/09/2026 audit: past bugs and where they appeared.

## Session protocol (every session, non-negotiable)

1. **Before any work:** read `Mapa Mental/Mapa_Mental.md` in full. Part A = current verified state per file; Part B = append-only dated journal. It overrides anything in `Prompt_Mestre.txt` about current state.
2. **After any modification, before ending the reply:**
   - Update `Mapa_Mental.md` Part A (states: `✅ CONFIRMADO FUNCIONAL` | `⚠️ NÃO VERIFICADO` | `🔴 CONHECIDO COMO QUEBRADO` | `❌ NÃO EXISTE AINDA`, with when/how verified) and append a Part B entry (`### [AAAA-MM-DD] — título`: ficheiros alterados, porquê, prova real, resultado, segue-se). Never delete old journal entries.
   - Append (never overwrite) a dated plain-language entry to `Oque ja fiz para corrigir estes erros.txt` (root): what was done, why, what it fixed, whether it worked — written for a non-technical founder.
   - If file states changed, update `Mapa Mental/mapa_mental_status.json` and run `node scripts/gen_mindmap_data.js` (regenerates the 3D map data).

## Inviolable rules (Secção 8 do Prompt Mestre)

1. **One mini-goal at a time.** Implement only the current mini-goal, show proof, then checkpoint. If asked to "do everything in a loop without stopping", remind the founder this rule exists to protect them and use the agreed middle ground: 2–3 line checkpoint with proof per mini-goal (continue within a phase), real stop and explicit confirmation **between phases**.
2. **Never ship everything at once** — a badly founded system gets thrown away, not fixed by speed.
3. **Never call something "done" without concrete proof** (real command output, passing test log, `git diff`, observed behaviour). Otherwise it is "implementado, não verificado". Re-verify claims from previous sessions/agents yourself before repeating them.
4. **Security is foundation, not a final layer** (RLS, tenant isolation, JWT, input sanitisation from the start).
5. **Offline-first is skeleton, not feature** — sales go to IndexedDB (Dexie) first, synced in background.
6. **Money is integer centavos, never float.** 150.50 MZN = `15050`; divide by 100 only for display. Forms take MZN and must convert before sending (`mznToCents` in `frontend/src/utils/money.js`). Before declaring any currency bug fixed, **grep the whole repo for the same pattern** — this bug has already recurred independently at least twice.
7. **A tenant never sees another tenant's data** — app-level `tenant_id` filter AND Postgres RLS, two independent filters. The same applies to any cache or queue ever introduced (cache keys / queue payloads must be tenant-scoped).
8. **Never invent features.** If it isn't in the spec (`genesis-spec`) or the Mapa Mental, ask first.
9. **No unnecessary code or hype.** No "robusto", "pronto para produção", "totalmente funcional" without earned proof.

Anti-hallucination check before reporting anything as done: Did I actually run it now, here? Do I have the real output? Did I grep for the same bug elsewhere? Am I trusting a summary instead of verifying?

## User hierarchy (3 levels — each sees only what fits its role)

- **super_admin** (founder): only via `admin-frontend/` — a physically separate React build/origin (prod `admin.genesismz.com`, dev :5175; the app/terminal is `genesismz.com`). Admin code must never be compiled into `frontend/`. Approves/rejects account requests, suspends tenants (suspension must cut access immediately), global metrics, master catalogs, subscription pricing, read-only support view of a tenant (not a login as the owner). `/api/admin/*` is guarded by origin check + JWT + role.
- **owner**: single panel, no POS mode and no admin options inside it. Sidebar is exactly: Dashboard, Produtos, Stock, Caixistas, Trabalhadores, Fornecedores, Chenecas, Relatórios, Metas, Definições. Creates/manages cashiers (sees their data, never takes over their session), reports, stock, staff, suppliers, debts, goals, settings (cancel PIN, hours). With subscription overdue: keeps read access to history/reports but is blocked from actions that create new value/access. Cannot change plan, see other tenants, or reach the admin panel.
- **cashier**: created only by an owner and always bound to that tenant. POS only: sell, scan, change, print receipts, demand capture, shrinkage. Never sees reports, margins or other cashiers' data; cancelling a sale requires the owner's PIN.

Three independent npm projects (no workspace root; install each separately):

| Dir | What | Dev port |
|---|---|---|
| `backend/` | Express 4 + Prisma 5 API (CommonJS) | 4000 |
| `frontend/` | Owner CRM + cashier POS, React 18 + Vite PWA, offline-first (Dexie) | 5173 (proxies `/api` → 4000) |
| `admin-frontend/` | Super-admin panel, React 18 + Vite (ESM), shares the UI kit | 5175 (strictPort) |

## Commands

```bash
# Backend (copy backend/.env.example -> backend/.env first)
cd backend && npm install          # postinstall runs `prisma generate`
npm run dev                        # node src/index.js (no hot reload)
npx prisma validate                # what CI runs

# Unit tests (node:test). Node 24 rejects a directory arg — pass files.
node --test backend/tests/monthlyDeductions.test.js
(cd frontend && node --test tests/offline_queue.test.mjs)       # real Dexie on fake-indexeddb

# System verification: real HTTP against a running backend + the real DB (13 sections:
# terminal/PIN, cancel PIN, catalog price, stock, offline queue, sessions, discounts,
# fixed costs, cashier exposure, admin, trial, RLS). Creates and deletes a
# "TESTE-SEGURANCA-*" tenant + a test super admin.
(cd backend && TENANT_STATUS_CACHE_MS=1000 PORT=4100 node src/index.js)   # terminal 1
(cd backend && TENANT_STATUS_CACHE_MS=1000 node scripts/verify_system.js) # terminal 2; or: ... 2 8

# Real-browser E2E (Chromium via Playwright; `npx playwright install chromium` once)
(cd backend && node scripts/e2e_fixture.js create /tmp/e2e.json)
(cd frontend && GENESIS_API_URL=http://127.0.0.1:4100 npx vite --port 5180)
(cd frontend && BASE=http://localhost:5180 FIXTURE=/tmp/e2e.json SHOTS=/tmp/shots node tests/e2e/flows.mjs)
(cd backend && node scripts/e2e_fixture.js delete /tmp/e2e.json)

# Frontends (Vite proxies /api to GENESIS_API_URL, default http://127.0.0.1:4000)
cd frontend && npm run dev | npm run build
cd admin-frontend && npm run dev | npm run build
```

Whole stack: `run-local.ps1` / `run-local.bat` (Windows) or `run-local.sh`; stop with `stop.*`. Logs go to `logs/`. `gerir-contas.bat|.sh` → `backend/scripts/gerir_contas.js` manages account passwords.

CI (`.github/workflows/ci.yml`, Node 20) only runs `npm ci` + `prisma generate` + `prisma validate` for backend and `npm run build` for frontend. The verification suites above need the real DB and are run by hand.

**Schema changes**: the live DB has drift (tenant ids are `uuid`, no FKs to Tenant). Never run `prisma migrate dev`/`db push` blindly — generate with `prisma migrate diff --from-schema-datasource ... --script`, keep only additive SQL, save it under `prisma/migrations/<date>_<name>/migration.sql` and apply with `prisma db execute` (see `20261003_genesis2`). Keep the models in `schema.prisma` and `schema.sqlite.prisma` identical. From Maputo the migration engine needs `connect_timeout=60` appended to the URL.

## Backend architecture

**DB engine selection at boot** (`src/utils/prisma.js` + `src/utils/dbEngine2.js`): `prisma.js` exports a lazy Proxy, not a PrismaClient. On `prisma.ready()` (called in `index.js` before `listen`), `dbEngine2` probes Postgres and may fall back to SQLite (`FORCE_DB=sqlite`, `DATABASE_URL=file:...`, or `DB_ALLOW_SQLITE_FALLBACK=true`). Never `require('@prisma/client')` in app code.

**RLS (enforced since Genesis 2.0)** — two clients behind the same proxy:
- *System* client (`DATABASE_URL`, role `postgres`, BYPASSRLS): used when no tenant is in context — login, refresh/session lookups, admin, terminal pairing, scripts.
- *App* client (`APP_DATABASE_URL`, role `genesis_app`, NO bypass): used automatically when the request has a tenant in context (`prisma.runWithTenant`, set by `middleware/auth.js` and `middleware/terminalAuth.js` through AsyncLocalStorage). Each operation runs as `[set_config('app.tenant_id'), op]`; interactive `$transaction(async tx => …)` get set_config first. **Batch `$transaction([...])` throws in tenant context** — use interactive transactions. Policies live in `prisma/rls_v2.sql` (no tenant set → zero rows). In production the server refuses to start without the app client.
- Still filter by `tenant_id` in every query: RLS is the second line of defence, not a replacement.

**Auth & sessions**:
- Tokens only via `utils/tokens.js` (`setSessionCookies`; httpOnly `token` + `refreshToken`). Claims: `pv` (password version — changing a password or a cashier PIN kills old sessions), optional `scope` and `tid` (terminal id).
- `middleware/auth.js`: JWT → `utils/sessionUser.js` (account active + current `pv`; role read from the DB) → scope allow-list (`utils/sessionScopes.js`: `pos` = cashier on a terminal, `support` = super admin read-only) → tenant blocked (403) → trial expired = read-only (402 `TRIAL_EXPIRED`) → tenant context. Infra failures return 503, never 401. Call `invalidateSessionUser(id)` after changing `is_active`, a password or a PIN.
- **POS terminal model**: the owner generates a 6-digit pairing code (`/api/owner/terminals/pairing-code`, in memory, 10 min); the counter browser redeems it at `/api/pos/pair` and gets an httpOnly `genesis_terminal` cookie (secret stored as SHA-256 in `PosTerminal`). Cashiers log in on the terminal with a 4-digit PIN (`/api/pos/login`; 5 wrong in 15 min → 423) and get a `scope:'pos'` session. The owner account never sits at the counter. `middleware/posWriteAuth.js` also accepts the terminal cookie + `seller_user_id` for offline-queue writes after the cashier session expired. Cashiers cannot use `/api/auth/login` (`USE_TERMINAL`).
- `/api/admin`: `adminOriginCheck` + auth + `requireRole('super_admin')`; every handler goes through `asyncHandler`. "Impersonation" is a single-use support code → read-only `support` session opened at `/suporte#code`.
- Errors: use `httpError(status, msg, code)` / `asyncHandler` from `utils/http.js`. Business-rule failures must be 4xx with a `code`; unexpected errors are 500 with a generic message. The offline queue treats 4xx as permanent rejection and 5xx/no-response as retry.
- Audit via `utils/audit.js` `writeAudit` (requires a real user id). `AuditLog` is append-only and drives lock states (shift lock, PIN lockouts).

**Domain rules worth knowing**:
- Sale unit price must equal the catalog price (409 `PRICE_MISMATCH`); reductions go through `discount_amount`. Discounts above `Tenant.discount_free_pct` (default 10%) need the owner's authorization PIN (`cancel_pin_hash`, set via `PUT /api/settings/authorization-pin` with the owner password). Failed PINs (cancel + discount) are persisted outside the transaction: 3 per sale → 423, 5 per tenant in 15 min → 429.
- The blind shift close is done by the cashier on the terminal (`/api/pos/shift/close`, logic in `utils/shift.js`); 3 counts below expected lock the profile; the owner unlocks from the panel (`POST /api/owner/cashiers/:id/unlock`).
- Stock adjustments are owner-only, atomic and audited; cashier losses go through shrinkage records. Cost changes write `ProductPriceHistory`.
- Reports (`services/reports.js`): only `completed` sales count; monthly net profit = gross profit − salaries − rent − other fixed costs − supplier deliveries (`services/monthlyDeductions.js`). Fixed costs (rent) are managed at `/api/settings/fixed-costs`.
- The demo seed in `index.js` runs only with `SEED_DEMO_DATA=true`.

## Frontend architecture

- **Design system** (one light theme, no dark mode): tokens in `src/ui/tokens.css` (stone neutrals + emerald accent `#047857`; semantic colours only where they carry meaning). `tailwind.config.js` **replaces** the default palette with the tokens (no `bg-red-500`), and opacity modifiers like `bg-ink/40` do NOT work with CSS-variable colours — use explicit values. Inter is self-hosted (`@fontsource-variable/inter`). Components live in `src/components/ui` (Button, Input/MoneyInput/PinPad/Segmented, Card/Stat/Table/Badge/Tabs/PageHeader, Dialog/Drawer/ConfirmProvider/Toast). No decorative animation; money always via `utils/format.js` `money()` plus `.num` (tabular figures). `admin-frontend` imports the same kit through the `@ui`/`@tokens` Vite aliases (separate bundle, no owner code).
- **Routes** (`src/App.jsx`, lazy-loaded per area): `/entrar`, `/pedir-conta`, `/recuperar-senha`, `/suporte`, `/terminal` (pair → profiles → PIN → `PosScreen`), `/onboarding`, and the owner shell `/app` (Início, Vendas, Produtos, Fornecedores, Chenecas, Equipa, Relatórios, Definições). Old paths redirect.
- **Sessions**: `utils/api.js` retries a 401 once via `/api/refresh`, then emits `genesis:session-ended` with the reason code (handled in `App.jsx`; the terminal returns to the PIN screen). `utils/session.jsx` provides `useSession` / `RequireOwner`.
- **Offline-first POS**: the catalog is cached in Dexie (`utils/productCache.js`); sales, demand captures and shrinkage are queued with `sync_state: 'pending'` (`src/db/localDb.js` — add a new `db.version(n)`, never edit old ones; **never index a boolean**, IndexedDB rejects booleans as keys). Queue logic: `utils/offlineQueue.js` + `utils/syncPolicy.js` (pure, tested); `hooks/useOfflineSync.js` runs it every 30 s from `PosScreen`. Every sale gets its id client-side (`newUuid()`) so retries are idempotent. Only network/5xx failures are queued; a 4xx shows the reason and keeps the cart.

## Mind map

`Mapa Mental/mapa_mental_3d.html` is an offline 3D graph of the repo (node colour = verified state: green confirmed, orange in progress/unverified, red broken). `node scripts/gen_mindmap_data.js` regenerates `mapa_mental_data.js` by scanning imports; per-file status/descriptions are curated by hand in `Mapa Mental/mapa_mental_status.json` and must never contradict `Mapa_Mental.md` Part A.
