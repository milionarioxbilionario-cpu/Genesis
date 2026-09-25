# Plano de implementação do Genesis

## Estado atual (completo e validado)
- O sistema Genesis está funcional em ambiente local e validado para a base do produto: autenticação, dashboard de proprietário, painel de super admin, POS e onboarding de catálogo.
- Backend e frontend estão integrados e os principais pontos críticos de segurança e negócio foram verificados em smoke tests reais.
- As políticas de multi-tenancy e RLS foram validadas no contexto local e a camada de segurança foi reforçada com tenant scoping em consultas protegidas.
- O fluxo de onboarding foi melhorado para funcionar em poucos cliques, com seleção do tipo de negócio, catálogo sugerido e importação rápida de produtos.
- O UX foi melhorado para reduzir atrito operacional: CTA de onboarding no dashboard, rota real do wizard e validações de importação mais claras.
- Foram concluídos os ajustes finais da fase de acabamento: cálculo de lucro líquido do relatório mensal, persistência de horário de funcionamento por tenant, gestão completa do lifecycle de tenants no painel admin e launcher `run-localhost.sh --admin` funcional.

## O que foi entregue
- Autenticação JWT com roles (`super_admin`, `owner`, `cashier`)
- Pedido público de conta e aprovação no painel administrativo
- Gestão de tenants e bloqueio de contas suspensas
- Dashboard do proprietário com métricas, stock, alertas e exportação CSV
- POS e operações de vendas
- Fecho de turno, PIN de cancelamento e auditoria
- Catalog import wizard para arranque da loja em poucos cliques
- Frontend PWA-ready e build validado

## Validações executadas
- Backend e frontend iniciados localmente com sucesso
- Smoke tests do sistema executados com sucesso
- Build de produção do frontend concluído com sucesso (`vite build`)
- Fluxo real de login do owner validado em ambiente local
- Fluxo de importação de catálogo validado em ambiente local
- Resposta da API confirmada com criação de produtos no tenant autenticado

## Como usar agora
- Backend: `cd /home/kali/Genesis/backend && npm start`
- Frontend: `cd /home/kali/Genesis/frontend && npm run dev`
- Acesso local:
  - Frontend: http://localhost:5173/login
  - Backend: http://localhost:4000/

## Credenciais de demonstração
- Owner de teste: `owner@genesis.local` (password definida localmente em `backend/.env` através de `DEMO_OWNER_PASSWORD`; nunca versionada)

## Observações finais
- O sistema está em estado pronto para uso e validação em produção de prova de conceito / primeira entrega.
- O foco agora é operar com clientes reais, ajustar fluxos de negócio específicos e ampliar integrações, mas sem perder a base funcional já validada.

## Atualizações recentes (resumo técnico)
- Endpoints adicionados: POST /api/demand_captures e POST /api/shrinkage_records (server-side, transactional, com AuditLog entries).
- Frontend: POS UI atualizado com botões "Pedido" (demand capture) e "Perda" (shrinkage) no catálogo de produtos.
- IndexedDB: Dexie schema bumped to include `shrinkage_records` store; demand captures already present. Local writes are created with `sync: false` and synchronized by `useOfflineSync` when online.
- Sync worker: `useOfflineSync` extended to sync pending shrinkage records to /api/shrinkage_records and mark them as synced on success.
- Test scripts added: `backend/scripts/tmp_post_demand_capture.js` and `backend/scripts/tmp_post_shrinkage.js` for quick server validation.

These changes were validated locally: the backend accepted demand capture and shrinkage requests and updated product stock and audit logs accordingly. Frontend changes write local records which the sync worker will POST when online.

## Recent fix and validation (2026-09-05)
- Corrigido problema no arranque local onde o frontend Vite falhava com EACCES sobre `node_modules/.vite` (cache). O script `run-local.sh` agora garante ownership adequado antes de arrancar o frontend.
- Validação completa do onboarding: request-account → admin approve → owner login → fetch template → import catalog → produtos visíveis em /api/products. `tenant.onboarding_completed` é marcado true na importação.
- Scripts de desenvolvimento: `run-local.sh` actualizado para prevenir regressões (corrige .vite ownership) e para abrir o browser apenas quando o frontend responde.

## Atualização operacional 2026-09-11
- Implementados alertas de stock mínimo e validade vencida para o dashboard do owner via `/api/owner/alerts`.
- Corrigida consistência do relatório mensal para expor `cost_of_goods` e `deductions` esperadas pelos componentes do frontend.
- Dashboard do owner agora apresenta alertas operacionais combinados, incluindo itens em risco e produtos expirados.
- Validação executada: `npm run build` no frontend e `node --check src/index.js` no backend concluídos com sucesso.

## Próximos passos recomendados
1. Limpeza opcional: `rm -rf frontend/node_modules/.vite` e reiniciar `./run-local.sh` para forçar re-optimização do Vite se notar algum comportamento estranho.
2. Mover validação para CI: adicionar um job que execute `npm run build` (frontend) e um smoke test (simular admin→owner→import) contra um ambiente SQLite temporário.
3. Avançar para Stage POS: integrar UI de caixa (POS) com a fila offline já preparada e testes de e2e de venda + fecho de turno.

Se nada mais for pedido nesta etapa, este checkpoint está pronto para ser marcado como concluído.

## Nova interface CRM (2026-09-06)
- Adicionados recursos de interface tipo CRM para demonstração rápida no frontend:
  - Arquivos CSS e animações importados em `frontend/src/ui/` (components.css, animations.css, main.css).
  - Mock data para demo em `frontend/src/ui/mockData.js` (window.GENESIS_DATA).
  - Componente de layout CRM: `frontend/src/layouts/CRMLayout.jsx` (sidebar, header, áreas principais).
  - Componentes demo adicionados: `frontend/src/components/StatsGrid.jsx`, `frontend/src/components/Pipeline.jsx`.
- As rotas principais (`/owner`, `/pos`, `/admin`, `/onboarding`) foram embrulhadas no `CRMLayout` para exibir o novo visual.
- O Owner Dashboard foi adaptado para apresentar visualização demo (Stats + Pipeline) quando a API de backend não retornar dados (útil para revisão visual antes de ligar ao backend real).
- Build do frontend validado: `npm run build` concluído sem erros.

Próximos passos para completar o redesign CRM (se aprovado):
1. Converter os widgets do `components.js.javascript` para React components reativos (botões, tenant switcher, badges, kanban cards) — isto trará interatividade real.
2. Implementar Command Palette (Ctrl+K) com pesquisa global usando uma pequena store e foco acessível.
3. Integrar TanStack Query e um adaptador demo↔API (VITE_API_BASE_URL) para alternar rapidamente entre dados locais de demonstração e o backend remoto.
4. Criar componentes de Sheet/Modal e Toasts (usar sonner/React Motion) e migrar formulários inline para painéis deslizantes.
5. Internacionalização (PT/EN) e tema claro/escuro com tokens em `src/ui/main.css`.

Status: trabalho de reconstrução do frontend iniciado e demo visual funcional. Se concordar, prosseguir automaticamente para converter os componentes JS fornecidos em React, integrar command palette e finalizar o conjunto de componentes CRM para entrega QA.

## Smoke tests (2026-09-15)
- Execução: scripts locais de smoke e E2E executados com sucesso em ambiente local.
- Testes realizados: onboarding (criação de tenant+owner via Prisma), owner login, criação de produto, venda, cancelamento com PIN, verificação de restauro de stock, geração de relatório mensal, criação de trabalhador e verificação da folha salarial, verificação de alertas e envio de resumo WhatsApp (modo "skipped" se Twilio não configurado).
- Artefactos/novos scripts adicionados:
  - backend/scripts/e2e_test2.fixed.js — versão corrigida do E2E com Authorization fix
  - backend/scripts/smoke_tests.js — bateria de smoke tests cobrindo reports/payroll/alerts
- Resultado: todos os passos da bateria de smoke tests passaram localmente. Alertas WhatsApp foram gerados em texto mas o envio foi ignorado porque as credenciais Twilio não estavam configuradas (comportamento esperado).


---

# PLANO ACTIVO — Correcção do "servidor offline" (2026-09-24)

> Ver secção completa no fim deste ficheiro: **"PLANO ACTIVO — Correcção do
> servidor offline"**. Resumo: o backend não arrancava por um conflito
> declarado entre `prisma/schema.prisma` (`provider = "sqlite"`) e
> `backend/.env` (`DATABASE_URL` Postgres do Supabase). O Prisma morria na
> validação do URL, antes de tentar ligar. Decisão do fundador: migrar para
> PostgreSQL (Supabase), com `prisma db push`.


---

# PLANO ACTIVO — Correcção do "servidor offline"

**Data:** 2026-09-24
**Estado:** Diagnosticado · Aprovado pelo fundador · Em execução
**Estratégia de migrações:** Opção A (`prisma db push` + migração inicial limpa)

---

## 1. Diagnóstico (concluído, com prova objectiva)

O servidor Genesis não arranca. O erro exacto, reproduzido nesta sessão:

```
PrismaClientInitializationError
Error validating datasource `db`: the URL must start with the protocol `file:`.
  --> schema.prisma:7 |  provider = "sqlite"  |  url = env("DATABASE_URL")
```

**Não é falha do Supabase.** O Prisma valida o URL *antes* de tentar ligar, e a
validação falha. O teu projecto Supabase nunca chega a ser contactado — por isso
o sintoma é "servidor offline".

### 1.1 Defeitos identificados

| # | Defeito | Ficheiro:linha | Gravidade |
|---|---------|----------------|-----------|
| 1 | `provider = "sqlite"` mas o URL é Postgres | `backend/prisma/schema.prisma:6` | 🔴 Crítico |
| 2 | `DIRECT_URL` duplicado; o último (`file:./dev.db`) **sobrescreve** o Postgres | `backend/.env:11-12` | 🔴 Crítico |
| 3 | Linhas sem `=` (notas coladas sem comentário) | `backend/.env:15-19` | 🟠 Ruído |
| 4 | Password com `$` crua — o dotenv expande `$VAR` | `backend/.env:9,11` | 🟠 Risco |
| 5 | Migrações SQLite-specific (`DATETIME`, `BOOLEAN`, `TRUE`) | `backend/prisma/migrations/` | 🟠 Bloqueante |
| 6 | Cópia de segredos em disco (duas) | `backend/.env.txt`, `.env.txt` | 🔴 Segurança |

### 1.2 O que já está BOM (verificado, não é preciso refazer)

- ✅ `backend/src/utils/tenantRls.js` **já suporta SQLite e Postgres**:
  `isSqliteUrl()` decide o caminho e, em Postgres, aplica
  `set_config('app.tenant_id', ...)` com `fail-closed` (aborta em vez de
  servir dados sem isolamento). O código de isolamento está pronto.
- ✅ `backend/prisma/rls_policies.sql` tem políticas para **16 tabelas**
  (Tenant, User, Product, Sale, SaleItem, StockEntry, Employee, Supplier,
  FixedCost, Debt, DebtPayment, DemandCapture, ShrinkageRecord, ShiftClosing,
  SaleGoal, AuditLog, ProductPriceHistory). Só falta aplicar no Supabase.
- ✅ Schema limpo e portátil: dinheiro em `Int` (centavos), IDs em `String`,
  datas em `DateTime`. Não há tipos exóticos (Json/Decimal/Array).
- ✅ **Não existe `dev.db`** — não há dados locais a perder.

---

## 2. Riscos assumidos (declaração honesta)

- **A password do Postgres pode não ser `Wendynha1313$`.** A linha 15 do `.env`
  mostra `Wendynha1313%24` (URL-encoded). Se a ligação falhar, o plano
  **para e pergunta** — não se adivinha passwords.
- **As migrações antigas não são portáveis** para Postgres. Não são aplicadas;
  ficam arquivadas como histórico do período SQLite.
- **As RLS são `fail-closed` por desenho.** Se as políticas não forem aplicadas,
  as transações abortam em vez de devolver dados sem isolamento. É o
  comportamento correcto de segurança, não um bug.
- **O `device_keys` é criado fora do Prisma** (`$executeRaw` no
  `deviceKeyService.js`). Precisa de existir como tabela antes de qualquer
  pedido de sync offline — está contemplado no passo 8.

---

## 3. Os 12 passos

| # | Passo | Acção | Prova de sucesso |
|---|-------|-------|------------------|
| 1 | Limpar `.env` | Apagar `DIRECT_URL="file:./dev.db"`; comentar notas sem `=` | leitura confirma providers |
| 2 | `schema.prisma` | `provider = "postgresql"` | `prisma validate` OK |
| 3 | `migration_lock.toml` | `provider = "postgresql"` | — |
| 4 | Gerar cliente | `npx prisma generate` | "Generated Prisma Client" |
| 5 | **Testar ligação** | `prisma.$connect()` | `LIGOU` (ou erro claro → parar) |
| 6 | Criar tabelas | `npx prisma db push` | "database is now in sync" |
| 7 | Migração inicial | `prisma migrate diff` → `_init_postgres` | `.sql` criado |
| 8 | Aplicar RLS | `rls_policies.sql` (via `prisma db execute`) | 16 políticas activas |
| 9 | Arrancar servidor | `node src/index.js` | "running on port 4000" |
| 10 | Prova funcional | login + venda + isolamento tenant A≠B | testes passam |
| 11 | Apagar segredos | `rm backend/.env.txt .env.txt` | ficheiros removidos |
| 12 | Documentar | Mapa Mental + ficheiro de registo | entradas acrescentadas |

**Nota sobre o passo 8:** as RLS exigem papel de dono na BD. Se a ligação
usar o papel `postgres`, aplica-se directamente por SQL. Se falhar por
permissões, o plano para e a instrução é aplicar o ficheiro no SQL Editor do
Supabase (conteúdo já pronto, é só colar).

---

## 4. Decisões de arquitectura

- **PostgreSQL (Supabase) como alvo único.** O SQLite fica apenas como
  caminho de desenvolvimento, suportado por `isSqliteUrl()`.
- **Opção A para as migrações.** Como não existe `dev.db`, aplica-se
  `prisma db push` e gera-se uma migração inicial limpa para Postgres.
- **`migration_lock.toml` muda para `postgresql`.** Sem isto, o Prisma
  recusa-se a aplicar migrações sobre um schema de outro motor.

---

## 5. O que NÃO será tocado

- ❌ Lógica de negócio, cálculo de dinheiro, regras do POS
- ❌ Isolamento de tenant (o código já está correcto)
- ❌ Fronteiras de segurança (`rbac.js`, `auth.js`, `adminOriginCheck.js`)
- ❌ Ficheiros de frontend, salvo se um teste revelar bloqueio

---

## 6. Segurança — acções recomendadas ao fundador

Estas credenciais foram expostas nesta sessão e devem ser **rodadas**:

- 🔴 Password do Postgres
- 🔴 `SUPABASE_SECRET_KEY` (prefixo `sb_secret_`)
- 🔴 `TWILIO_AUTH_TOKEN`

Depois de a ligação ser confirmada (passo 5), a password pode ser rodada no
painel do Supabase. O `.env` já está no `.gitignore` ✅ — mas ver o passo 11
(`backend/.env.txt` **não** está protegido pelo `.gitignore`, porque o padrão
`*.env` não cobre `.env.txt`).


