ETAPA 0 — Resultado (scaffold automático)

Resumo do que foi encontrado/feito:

1) Estrutura de pastas: backend/ e frontend/ já existem no repositório.

2) Backend:
   - package.json presente em /home/kali/Genesis/backend/package.json
   - .env presente em /home/kali/Genesis/backend/.env (com placeholders / masked values)
   - Prisma schema existente em /home/kali/Genesis/backend/prisma/schema.prisma (contém todos os modelos descritos no plano)
   - Migração inicial encontrada em /home/kali/Genesis/backend/prisma/migrations/20260821111940_init/migration.sql

3) Frontend:
   - package.json presente em /home/kali/Genesis/frontend/package.json
   - Dexie local DB scaffold at /home/kali/Genesis/frontend/src/db/localDb.js
   - useOfflineSync hook at /home/kali/Genesis/frontend/src/hooks/useOfflineSync.js

4) RLS script created:
   - /home/kali/Genesis/backend/prisma/rls_policies.sql — contains ALTER TABLE ... ENABLE ROW LEVEL SECURITY and CREATE POLICY statements for tenant isolation. This must be run in Supabase SQL editor or via psql by a project owner.

What remains that requires external credentials or interactive approval:

A) Running prisma migrations against Supabase (npx prisma migrate deploy / npx prisma migrate dev). This requires a valid DATABASE_URL in backend/.env and network access to the Supabase Postgres instance. I did not run migrations because the environment has an existing migration file and the DATABASE_URL appears masked in .env. If you want me to run the migration now, confirm and provide a working DATABASE_URL (or allow the agent to use the one already in backend/.env).

B) Enabling RLS in Supabase. I created SQL statements in rls_policies.sql. A project admin must run those statements in Supabase SQL editor. Alternatively, provide credentials/permission and I can run them.

C) Installing node modules (npm install) in backend and frontend. Both package.json files exist with the requested dependencies. If you want, I can run the installs now (requires network). Otherwise run locally: from /home/kali/Genesis/backend run `npm install` and from /home/kali/Genesis/frontend run `npm install`.

Validation checklist for ETAPA 0 (next steps you can run locally or ask me to run):

1. Ensure backend/.env.DATABASE_URL points to your Supabase Postgres instance.
2. From backend/: `npx prisma migrate deploy` (or `npx prisma migrate dev --name init` when developing locally) — confirm no errors.
3. In Supabase SQL editor, run the SQL in backend/prisma/rls_policies.sql to enable RLS and policies.
4. Create two tenants in the tenants table and test:
   SET app.tenant_id = '<tenant-A-uuid>';
   SELECT * FROM "Product"; -- should only return Product rows for tenant A

5. Frontend: `npm install` then start dev server and test offline Dexie behavior; the hook useOfflineSync is already present and will attempt to POST /api/sales when online.

Files created/modified by this step:
- /home/kali/Genesis/backend/prisma/rls_policies.sql (new)
- /home/kali/Genesis/docs/ETAPA0_RESULT.md (new)

If you want me to run installs and perform migrations & RLS activation now, reply with "run now" and provide a valid DATABASE_URL (or permission to use backend/.env). Otherwise reply "ok" and I will stop here and wait for "continua" to proceed to ETAPA 1.
