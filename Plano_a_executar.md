Plano a Executar — Auditoria e Plano de Ação
Projeto: Genesis (LucroCerto) — SaaS POS Multi-tenant
Data: 2026-09-09
Autor: AI assistant (Copilot CLI runtime in VS Code)

Índice
1. Resumo rápido do estado atual (ETAPA 0)
2. Evidências técnicas (arquivos chaves e localizações)
3. Gap analysis — o que falta e o que está fora de conformidade com o prompt
4. Riscos críticos e recomendações imediatas
5. Plano de ação priorizado (próximos passos, micro-tarefas)
6. Plano detalhado por fase para concluir o produto
7. Checklist de validação por etapa
8. Anexos: comandos úteis e notas de execução

---

1) Resumo rápido do estado atual (ETAPA 0)

Observação: Antes de qualquer modificação, o repositório foi auditado. O estado atual mostra que a maior parte da ETAPA 0 (fundação) já está implementada. Itens verificados e presentes:

- Estrutura de pastas: backend/, frontend/, prisma/, docs/ estão presentes.
- Backend: package.json, src/, prisma/schema.prisma (SQLite dev DB) e migrations presentes; node_modules existe.
- .env de desenvolvimento presente em backend/.env com placeholders e valores locais (usa SQLite dev.db).
- Prisma schema: definido em backend/prisma/schema.prisma com todas as tabelas listadas no plano (tenants, users, products, sales, sale_items, stock_entries, employees, suppliers, fixed_costs, debts, debt_payments, demand_captures, shrinkage_records, shift_closings, sale_goals, audit_logs, master_catalogs, product_price_history, device_keys etc.).
- Migrações: backend/prisma/migrations/ with initial migration and device_keys migration; dev.db (SQLite) exists → indica migração aplicada localmente.
- RLS: há scripts rls.sql e rls_policies.sql no backend/prisma/ explicando políticas a aplicar no Supabase. Políticas cobrem a maioria das tabelas e tratam casos especiais (child tables, audit_logs, master_catalogs).
- Frontend: Vite React scaffold presente em frontend/, package.json inclui dexie, vite-plugin-pwa, recharts, dompurify, tailwindcss. Existe frontend/src/db/localDb.js com schema Dexie e frontend/src/hooks/useOfflineSync.js implementado.
- Implementação básica de endpoints e lógica POS: backend/src/routes/sales.js implementa POST /api/sales com transacção, validações, decremento de stock e audit logs; cancelamento com PIN e protecções também implementado.

Conclusão rápida: ETAPA 0 já está implementada no repositório. A maioria dos artefactos existe e código está presente. Resta apenas a execução final no Supabase (aplicar RLS) e testes em ambiente real (Supabase/Postgres) para completar a validação ocupando o ambiente de produção/staging.

---

2) Evidências técnicas (arquivos chaves e localizações)

- Estrutura: /home/kali/Genesis
  - backend/
    - backend/.env (dev config) — contém DATABASE_URL pointing to file:./dev.db
    - backend/package.json — dependências listadas (express, prisma, @prisma/client, bcrypt, jsonwebtoken, zod, express-rate-limit, cors)
    - backend/prisma/schema.prisma — (arquivo com o schema completo)
    - backend/prisma/migrations/ — migrações geradas
    - backend/prisma/dev.db — SQLite dev DB file (migrations applied)
    - backend/prisma/rls.sql e rls_policies.sql — scripts RLS para Supabase/Postgres
    - backend/src/routes/sales.js — implementação de endpoints de vendas (POST /api/sales, cancel)
  - frontend/
    - frontend/package.json — dependências (dexie, dompurify, recharts, vite-plugin-pwa, tailwindcss)
    - frontend/src/db/localDb.js — Dexie schema implementado com tables sales, sale_items, products, demand_captures, shrinkage_records, device_keys, shift_closings
    - frontend/src/hooks/useOfflineSync.js — hook com polling 30s, lógica de envio e atualização de flags sync

Provas de migração local:
- backend/prisma/migrations/20260905141627_init/migration.sql — cria todas as tabelas
- backend/prisma/dev.db existe (tamanho ~200KB). Esse banco é SQLite local, usado para desenvolvimento e testes locais.

---

3) Gap analysis — divergências e pontos que exigem ação

A) RLS ainda não aplicado em Supabase (RISK: CRÍTICO)
- Observação: o repositório contém scripts rls.sql e rls_policies.sql, porém RLS só faz efeito no Postgres do Supabase. Não há evidência de que as políticas foram aplicadas no ambiente Supabase remoto. A execução manual ou via CI/CD é necessária.
- Consequência: até que RLS esteja ativo no Postgres, um bug ou falha de aplicação pode expor dados de tenants entre si. Embora a aplicação tente usar SET app.tenant_id, RLS é segunda linha de defesa e é obrigatório.

B) Super Admin separado por subdomínio / isolamento de UI
- Observação: a arquitetura pretendida requer painel do Super Admin separado (subdomínio). O repositório tem rotas e código para admin, mas não há separação de hospedagem ou configurações de domínio.
- Recomendação: criar deploy distinto para painel Super Admin (admin.genesis.example) usando service_role e credenciais seguras.

C) Cookies httpOnly e fluxo de autenticação
- Observação: frontend usa localStorage para token em alguns locais (useOfflineSync lê localStorage). O plano exige httpOnly cookie sempre que possível.
- Recomendação: migrar a autenticação para cookies httpOnly + CSRF protections; manter token em localStorage apenas quando httpOnly não for viável (documentar o risco). Ajustar useOfflineSync para obter token via endpoint /api/session/current se não usar device keys.

D) Testes de integração e automação inexistentes/insuficientes
- Observação: existem scripts e alguns e2e em backend/scripts, mas não há pipeline automatizado (GitHub Actions) que execute migrações, aplique RLS (opcional), execute testes e smoke tests.
- Recomendação: configurar CI que roda prisma migrate (em ambiente de teste), executa testes unitários e e2e e verifica contratos de API.

E) Segurança das rotas de super admin e gestão de service_role keys
- Observação: a política de permitir ações de super admin não detalhada na infra; é necessário usar service_role key com cuidado (armazenar só em servidor admin e não no frontend).

F) Sincronização offline: testes reais pendentes
- Observação: useOfflineSync está implementado para enviar vendas, demand captures e shrinkage_records. Falta validar comportamento com autenticação real e device key rotation, e validar concorrência e retries.

G) Indexes e performance
- Observação: migrations criam as tabelas, mas o schema atual apenas cria um unique index no User email. Plano exige índices adicionais (products(tenant_id,is_active), sales(tenant_id,created_at), sale_items(sale_id) etc.). Ainda falta criar esses índices no migration inicial.

H) SELECT FOR UPDATE e race conditions no stock
- Observação: o POST /api/sales usa tx.product.update with decrement, dentro da transação Prisma — isso é bom, mas para forte concorrência em Postgres é recomendável usar SELECT ... FOR UPDATE ou lock row; com Prisma pode ser implementado via FOR UPDATE raw SQL or using serializable transactions.

I) Gestão de secrets e .env no repositório
- Observação: backend/.env is present and includes a real SUPABASE_URL and a JWT_SECRET. Secrets should not be committed; move to .env.example and remove secrets from repo. Ensure repository does not leak production credentials.

J) Separação de painéis e roles na UI
- Observação: o front-end tem várias pages for Login variants (AdminLogin, CashierLogin) — need to ensure the UX adheres to plan: Owners should see owner dashboard, cashiers only see POS, super admin uses separate subdomain interface.

---

4) Riscos críticos e recomendações imediatas (ordem de prioridade)

1. RLS não aplicado no Supabase — ação imediata: aplicar rls_policies.sql no Supabase SQL editor para todas as tabelas. Validar com um teste de isolamento (create two tenants and attempt cross-tenant queries). (Risco: 10/10)

2. Secrets committed — action: rotate secrets if any are production. Move secrets to CI secrets store, create backend/.env.example (with placeholders) and .gitignore actual .env. (Risco: 9/10)

3. Auth cookie httpOnly — action: rework auth to return httpOnly cookie on login; use refresh tokens and short-lived access tokens in cookie. Adjust frontend accordingly. (Risco: 8/10)

4. Indexes and performance — action: add migration to create indexes on frequent query columns. (Risco: 7/10)

5. Concurrency on stock — action: implement SELECT FOR UPDATE or serializable transactions on stock decrement in Postgres, and add tests simulating concurrent sales. (Risco: 7/10)

6. Super admin separation — action: plan deploy separation and ensure service_role usage only on trusted admin server. (Risco: 6/10)

7. Offline sync real tests — action: execute end-to-end offline-flow tests with browser (simulate offline, create local sales, reconnect) to validate useOfflineSync. (Risco: 6/10)

---

5) Plano de ação priorizado (próximos passos, micro-tarefas)

Imediato (blockers) — abrir e resolver antes da Etapa 1
A1. Remove secrets from repo; create backend/.env.example and rotate any exposed secrets.
A2. Apply RLS in Supabase:
   - Use backend/prisma/rls_policies.sql (adapt schema names to Postgres case) and run in Supabase SQL editor.
   - Test: create two tenants and set app.tenant_id in session to verify isolation.
A3. Add DB indexes via a prisma migration (create new migration file that runs CREATE INDEX statements for target columns).
A4. Add migration for SELECT FOR UPDATE race handling guidance (or implement explicit locking inside Prisma via raw queries where necessary).

Short-term (ETAPA 1 readiness)
B1. Implement secure authentication flow with httpOnly cookies, refresh tokens endpoint, logout, and CSRF protection.
B2. Harden API middleware to always SET app.tenant_id on DB session for non-superadmin users.
B3. Create tests for POST /api/sales and concurrent sales to ensure stock decrements are atomic.
B4. Seed master_catalogs data for onboarding wizard.

Medium-term (ETAPAS 1-3)
C1. Split Super Admin UI to separate subdomain (or separate deploy). Implement admin-only server endpoints that use service_role keys.
C2. Implement MR/PR code review rules and CI: run unit tests, run prisma generate, run migrations against ephemeral DB, run lints and build.
C3. Implement monitoring and backup for Supabase and DB migrations

Longer term (polish, ETAPA 4+)
D1. Implement full reporting services (reportService.js) with attention to integer math for monetary calculations.
D2. Implement WhatsApp Twilio workflows on scheduled jobs and background workers (use job scheduler or cron in VPS).
D3. Add load testing harness to simulate many concurrent sales and ensure locking works.

---

6) Plano detalhado por fase (micro-steps) — Fase 0 (completada) & Fase 1 preparação

Fase 0 — Fundação (completada)
- Verificado: estrutura, dependências, prisma schema, migrations, Dexie, useOfflineSync hook.
- Pendências: aplicar RLS no Supabase, criar .env.example replacing secrets committed.

Fase 1 — Autenticação e painel Super Admin (planejar e executar)
1.1. Implementar login backend endpoint that sets an httpOnly cookie with secure flag. Add /api/auth/refresh for rotating tokens.
1.2. Update frontend login flow to rely on secure cookie; for PWA/worker, expose a /api/session/token-for-service endpoint that returns a short-lived device token for background sync (only if device key present).
1.3. Create middleware backend/src/middleware/auth.js that extracts user from cookie or device key; sets req.user and executes `SET app.tenant_id` for DB session when tenant present. (File exists? verify and harden.)
1.4. Build Super Admin UI deployment plan: separate build and route under admin subdomain.

Test list for Fase 1 (automated/manual)
- Login returns httpOnly cookie; subsequent GET /api/owner/products returns products for the tenant.
- Attempt cross-tenant fetch with different app.tenant_id fails (RLS test).
- After 5 failed login attempts from same IP, rate limiter blocks.

---

7) Checklist de validação por etapa

ETAPA 0:
- [x] Estrutura de pastas criada
- [x] Dependências listadas no package.json para backend e frontend
- [x] .env presente (dev) — mover para .env.example e remover segredos do repo
- [x] schema.prisma com todas as tabelas definidas
- [x] prisma migrate (migrations + dev.db) — presente localmente
- [ ] RLS aplicado no Supabase (manual step)
- [x] Dexie schema implementado
- [x] useOfflineSync implementado
- [ ] Testes de validação finais: (offline sync end-to-end) — pendente em ambiente real

ETAPA 1: (preparar)
- [ ] Auth via httpOnly cookie
- [ ] Middleware sets app.tenant_id for every DB connection
- [ ] Super Admin UI separated

---

8) Anexos — comandos úteis, notas de execução

Aplicar RLS no Supabase (pseudopassos):
1) Abrir Supabase project → SQL editor
2) Copiar conteúdo de backend/prisma/rls_policies.sql
3) Executar
4) Testar: na SQL editor, executar
   SET app.tenant_id = '<tenant-A-uuid>';
   SELECT * FROM products WHERE tenant_id = '<tenant-B-uuid>';
   Resultado esperado: 0 rows.

Criar índices via prisma: (exemplo raw SQL migration)
- Criar nova migration:
  npx prisma migrate dev --name add_indexes
  (editar migration .sql para incluir `CREATE INDEX idx_products_tenant_active ON "Product" (tenant_id, is_active);` etc.)

Remover segredos do repositório
- Mover backend/.env para .env.local (gitignored)
- Commit backend/.env.example with placeholders
- Rotate SUPABASE keys and TWILIO keys if they were production values committed accidentally.

Testes offline-sync (manual):
- Run frontend locally (vite) and backend (node src/index.js)
- In browser devtools: offline mode → create sales in POS UI → check IndexedDB (Application → IndexedDB → GenesisLocalDB)
- Re-enable network → observe network calls and verify /api/sales accepted

---

Resumo final e recomendação imediata

A ETAPA 0 está, na prática, implementada no repositório. Antes de prosseguir para ETAPA 1 (Autenticação e Painel Super Admin), as ações obrigatórias são:
1) Remover segredos do repositório e criar .env.example
2) Aplicar RLS no Supabase e validar com teste de isolamento
3) Adicionar índices de performance e criar uma migration 

Se concordas com a prioridade proposta, o próximo passo prático que executo é:
- Remover/rotacionar segredos comprometidos e criar backend/.env.example (eu posso criar o .env.example e substituir o .env real no repo por instruções; rotacionar secret exigirá ação externa tua ou do time infra). Ou,
- Aplicar as políticas RLS em Supabase (necessita credenciais Supabase; eu posso gerar o script e instruções para executar manualmente se preferires), ou,
- Prosseguir com ETAPA 1 implementando auth com httpOnly cookie.

Diz qual dessas três ações queres que eu execute em seguida (escolhe uma):
- "remover-secrets" (crio .env.example e guio rotação),
- "aplicar-rls" (crio script pronto e instruções; preciso das credenciais se queres que eu execute),
- "start-etapa-1" (inicio implementação de autenticação segura e middleware),
ou responde "outro" com instrução clara.

---

Notas finais
- Este documento é exaustivo mas objetivo — se quiseres que eu detalhe cada arquivo, linha por linha, ou gerar commits e PRs para cada micro-tarefa, diz "gera-commits" e eu procedo com alterações e commits pequenos e verificáveis.

