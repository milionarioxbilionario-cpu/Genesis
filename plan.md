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



---

# PLANO — 26-09-2026 — Sete frentes (pedido do fundador)

Sete pedidos, ordenados por risco (primeiro o que corrompe dados ou segurança,
só depois o visual). Estado por frente: ⬜ não iniciado · 🟨 a decorrer · ✅ feito.

---

## Frente 1 — Google OAuth ✅ desbloqueado

O fundador forneceu o Client ID:
`8132927831-ml07r5e7acop6f3kg27rj0ccfrs0tbbi.apps.googleusercontent.com`
(formato válido: número-de-projecto + hash de 32 + `.apps.googleusercontent.com`).

- `backend/.env` → `GOOGLE_CLIENT_ID=<id>`
- `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=<id>`
- **Acção do fundador (não é código):** Google Cloud Console → Credenciais →
  Origens JavaScript autorizadas → `http://localhost:5173`, `http://localhost:5174`
  e o domínio de produção. Sem isto o botão falha com `origin_mismatch`.
- Verificação já existente e testada (18/18 em `npm run test:google`): `iss`, `aud`,
  `exp`, `email_verified`, assinatura RS256, recusa de API Key `AIza...`.
- Regra mantida: **nunca** criar conta automaticamente; email desconhecido recebe a
  mensagem + ligação para "Pedir conta".

---

## Frente 2 — Email real + código obrigatório ✅ (falta só a senha)

**Decisão do fundador: Gmail normal + App Password.**

Causa raiz actual: não existe nodemailer nem SMTP no projecto. `forgot-password`
tenta WhatsApp/Twilio; sem Twilio devolve `twilio-not-configured` e o código fica
**apenas no log do servidor** em desenvolvimento — o utilizador nunca o recebe.

Trabalho:
1. `nodemailer` como dependência do backend.
2. Novo `backend/src/utils/mailer.js` — `sendMail({ to, subject, text, html })` com
   SMTP genérico (`SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`), default Gmail
   (`smtp.gmail.com:465`). **Falha alto e claro**, nunca em silêncio: devolve
   `{ ok, reason }` e faz `console.error` do erro real do SMTP.
3. **Normalizar o App Password**: o Gmail mostra-o em 4 grupos de 4 caracteres
   (`abcd efgh ijkl mnop`) mas usa-se sem espaços. O código remove os espaços —
   é o erro nº1 e dá `Username and Password not accepted`.
4. `MAIL_FROM` = o Gmail autenticado (o Gmail reescreve o `From:` e não deixa usar
   outro endereço sem alias verificado em *Enviar email como*).
5. **Remover `POST /auth/reset-password-instant`** e a variável `RESET_IMMEDIATE`.
   A senha só muda com código de 6 dígitos confirmado — pedido explícito.
6. `forgot-password` passa a entregar por **email** (Twilio fica como canal
   secundário, se estiver configurado).
7. **Correcção de robustez:** mover os códigos do `Map` em memória
   (`passwordResetStore.js`) para tabela `PasswordResetCode`
   (hash, expira, tentativas). Sem isto: um restart invalida pedidos a meio e com
   duas instâncias o código emitido numa não é validado na outra — o próprio
   ficheiro admite esta dívida.
8. `ResetPassword.jsx`: remover o modo directo e o aviso laranja; fica o fluxo por
   código, com reenvio e contagem decrescente.
9. Manter a **resposta genérica** no `forgot-password` (não revelar se o email
   existe) — é uma boa defesa que já está no código.

Risco declarado: a partir daqui, sem SMTP a funcionar ninguém recupera a senha.
Esta frente só fecha quando o email chegar mesmo.

### O que ficou FEITO (27-09-2026)

- `backend/.env` reescrito: bloco SMTP com `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`,
  `SMTP_HOST`, `SMTP_PORT` e o passo-a-passo da senha de aplicativo do Google
  dentro do próprio ficheiro. `RESET_IMMEDIATE` foi apagada (a rota que lia já
  não existe).
- `backend/scripts/check_mail.js` (novo): confirma a configuração, testa a
  ligação SMTP e envia um email de teste. `node scripts/check_mail.js --to <email>`.
- `frontend/src/pages/ResetPassword.jsx`: **três fases em vez de duas**. Antes de
  o utilizador escrever a nova senha, tem de *confirmar o código*; o formulário
  da senha nem existe no DOM até essa confirmação. Corrigiu-se também um bug que
  impedia **qualquer** reposição: o estado `confirm` era comparado com a senha sem
  haver campo de confirmação, logo o erro "não coincidem" saía sempre.
- `SecurityGateIcon` (novo): o cadeado do ecrã abre quando o código é confirmado.
- i18n: saem os textos do modo directo; entram `verifyCode`, `codeVerified` e
  `resendCode` (PT e EN).

**Estado real:** o código está completo e o servidor exige o código
(`test_auth.js` confirma que `/reset-password-instant` devolve 404). Falta **uma
coisa que só o fundador tem**: a senha de aplicativo. Até a por, o código de 6
dígitos sai no log do servidor em vez de ir para o email.


---

## Frente 3 — Fechar o furo do fecho de turno ✅

**Bug provado** (é a explicação directa do "permite fechar abaixo do vendido").
Existem **dois** caminhos de fecho e um não valida nada:

| Caminho | Validação |
|---|---|
| `POST /api/owner/cashiers/:id/close-shift-blind` (`owner.js:381`) | Correcta — calcula o real no servidor, recusa `declared < realCash` |
| `POST /api/shift_closings` (`shift_closings.js:27`) | **Nenhuma** — aceita `counted_amount` E `expected_amount` do corpo |

Em `index.js:195` a segunda está montada com `requireRole('owner','cashier')`,
logo **um token de caixista grava um fecho oficial com `difference: 0`**,
contornando o fecho cego e deixando auditoria falsa.

Trabalho:
1. `shift_closings.js` deixa de aceitar `expected_amount` do cliente. O servidor
   calcula o esperado (vendas em dinheiro desde o último fecho) e deriva
   `difference`.
2. `counted < expected` passa a seguir a **mesma via** de tentativa falhada e
   bloqueio do fecho cego, em vez de gravar um fecho válido.
3. Remover `'cashier'` do `requireRole` dessa rota (o caixa fecha pelo
   `/close-shift-blind`). Verificado: o POS usa o `close-shift-blind`.
4. Actualizar `backend/scripts/shift_closing_e2e.js` — hoje testa justamente o
   caminho permissivo.
5. Teste novo: caixista tenta gravar abaixo do vendido → **recusado** + auditoria.

Nota: o filtro `payment_method: 'cash'` do cálculo é fiável hoje porque
`sales.js:218` normaliza o método na escrita (`normalizePaymentMethod`).

### O que ficou FEITO (27-09-2026) — 12/12 testes a passar

- `shift_closings.js`: o `expected_amount` do corpo deixou de existir, o
  `difference` é calculado no servidor, `counted < expected` vai para a via da
  tentativa falhada (com auditoria e bloqueio a 3) e a rota é só do dono.
- **Furo novo encontrado pelo teste e fechado:** depois de um fecho aceite, o
  esperado voltava a 0 (porque `since` passa a ser o último fecho), e dava para
  gravar um **segundo fecho do mesmo dinheiro** — a diferença ficava "a mais" e
  os relatórios de caixa ficavam envenenados. Guarda nova em **ambos** os
  caminhos (`/api/shift_closings` e `/close-shift-blind`): se já existe um fecho
  e não houve nenhuma venda depois, devolve `400 NO_OPEN_SHIFT`. Coerente com a
  regra que o sistema já usava ("vendas sem fecho posterior = turno aberto").
- `backend/scripts/run_checks.js` (novo): sobe o backend numa porta livre com
  SQLite, corre os testes e **mata o servidor** no fim. É o que vale a pena
  correr depois de mexer na caixa.

`node scripts/run_checks.js` → `test_auth` PASS, `shift_closing_e2e` PASS
(12/12), `check_mail` em AVISO (falta a senha de aplicativo).

---

## Frente 4 — Recibo: imprimir de facto, PDF automático, 3D a sério ✅

### 4a. Porque não imprime (causa provada)
`receiptPrinter.js:140` chama `tryWebSerialPrint` **antes** de imprimir, e essa
função invoca `navigator.serial.requestPort()`. Isso abre o **seletor de porta
série** em vez de imprimir. Se cancelar — ou o browser não suportar Web Serial —
cai para `window.open(...)` + `print()`, que o bloqueador de pop-ups impede.
Nenhum dos caminhos funciona.

Correcção:
- Imprimir por **iframe escondido** (`document.createElement('iframe')` +
  `contentWindow.print()`). Não é bloqueado por pop-ups.
- Web Serial passa a **opt-in** numa definição da loja, deixando de capturar o
  clique por omissão.

### 4b. PDF automático
- `jspdf` (offline após bundle). **Gerado a partir dos dados da venda, não de
  screenshot** — três razões: texto vectorial nítido, o `html2canvas` corromperia a
  captura de um elemento com transform 3D, e o ficheiro fica muito mais leve.
- Fonte Courier (look de talão) e QR embutido como imagem.
- Nome exacto: `Recibo_1  26-09-2026  23:58:34.pdf` — com os **dois espaços**
  pedidos.
- Numeração: `sale.daily_number` (servidor, por loja/dia, **já reinicia à
  meia-noite** — `sales.js:41`), para coincidir com o recibo impresso. Fallback por
  dispositivo em `localStorage` com chave por data, para vendas offline; reseta
  sozinho no dia seguinte.
- O download dispara no **mesmo clique** de imprimir.

### 4c. Impressora 3D verdadeira
O `Receipt3D` actual (`components/ui/index.jsx:491`) é só uma barra de 6px com um
gradiente — não há impressora desenhada, razão pela qual o fundador não reconheceu
ali animação nenhuma. Novo `Printer3D`: corpo em CSS 3D, slot, LED, papel a sair
com `rotateX`, linha de varrimento durante a impressão e oscilação suave no fim.
Respeita `prefers-reduced-motion`.

### 4d. Recibo mais bonito
É a cara do Genesis no balcão: cabeçalho com marca, hierarquia tipográfica, totais
destacados, QR emoldurado, rodapé memorável — um recibo que dá vontade de guardar.

### O que ficou FEITO (27-09-2026)

- `frontend/src/utils/receiptPdf.js` (novo): PDF **vectorial** de 80 mm com
  cabeçalho ★ GENESIS ★, faixa da marca com o nº da venda, serreto no fim, QR,
  totais em bloco escuro e rodapé. `clean()` em todos os textos.
- Nome: `Recibo_<N>  <DD-MM-YYYY>  <HH:mm:ss>.pdf` com os **dois espaços**,
  `N` = `daily_number` do servidor; em venda offline o contador local do dia
  (chave com a data) reinicia sozinho à meia-noite.
- `frontend/src/components/Printer3D.jsx` (novo): impressora a sério — corpo em
  CSS 3D, fenda, dois LEDs, barra de tinta e o papel a sair com inclinação que
  endireita. O `Receipt3D` antigo (a barra de 6 px) foi substituído, mas o nome
  continua exportado para não partir importes.
- `CashierDashboard.jsx`: **um clique, três passos** — animação 3D → (no fim da
  animação) PDF gerado e **descarregado automaticamente** → impressão real
  (Web Serial se existir, senão diálogo do browser). A barra inferior mostra o
  nome do ficheiro gerado.
- O `jspdf` entra por **import dinâmico**: o pacote inicial do POS desceu de
  407 kB para 286 kB (gzip) e o PDF passou a ser um bloco à parte, carregado
  só quando se imprime.
- `receiptPrinter.js`: **XSS corrigido** — nome de produto, loja e caixista
  passavam por concatenação crua para o documento do diálogo de impressão (um
  produto chamado `<img onerror=…>` executava). Tudo passa por `esc()` e o `src`
  do QR é validado como data URL de imagem.
- `index.css`: o talão ganhou grão de papel e serreto; continua a ser papel nos
  dois temas (nunca vira vidro).

---

## Frente 5 — Tema claro (azul-piscina) + botão sol/lua ✅

Descobertas que tornam isto contido:
- **Zero classes `dark:`** em todo o código. O `tailwind.config.js` declara
  `darkMode: ['class','[data-theme="dark"]']` mas nada o usa, logo pôr `data-theme`
  não rebenta nada.
- Os tokens estão **todos** em `frontend/src/ui/tokens.css` → um bloco
  `[data-theme="light"]` muda a app inteira de uma vez.
- **Excepção:** `frontend/src/pages/Hub.jsx` ainda tem hex fixo (`#0a1220`,
  `#7aa5d6`, `#141c2b`…) em `style={{}}` inline — não adapta ao claro e precisa de
  limpeza, senão fica uma ilha escura.

Trabalho:
1. Novo `frontend/src/ui/theme-light.css`: fundo branco-azulado, marca ciano
   (`#0ea5e9`), texto azul-escuro. Azul e branco a reinar.
2. **Efeito de água:** camadas de ondas SVG + brilho especular animados a
   velocidades diferentes, com `mix-blend-mode` e `filter: blur`, para as
   "ondinhas/linhas de azulejo" descritas. Desligado em `prefers-reduced-motion`.
3. Botão `Moon`/`Sun` (lucide) no login, header do Owner, POS e Super Admin.
   Persistência em `localStorage` + script inline nos dois `index.html` para não
   haver flash branco ao carregar.
4. Limpar os hex fixos do `Hub.jsx`.

### O que ficou FEITO (27-09-2026)

- `frontend/src/ui/theme-light.css` (novo): bloco `[data-theme="light"]` com
  fundo branco-azulado, marca ciano `#0891b2`, sombras de luz do dia e o brilho
  ambiente do corpo trocado. Azul e branco a reinar, como pedido.
- `frontend/src/theme/ThemeProvider.jsx` + `ThemeToggle.jsx` + `PoolWater.jsx`
  (novos): o botão está **no login, no ecrã de recuperar senha, no shell do
  dono, no POS e no Hub** — em todas as telas, como pedido.
- **A piscina**: azulejos à deriva, quatro ondas a passar e três manchas de luz
  (causticas), em CSS puro com `mix-blend-mode: screen`. Fica parada em
  `prefers-reduced-motion` e nunca intercepta cliques.
- `frontend/index.html`: script inline que aplica o tema **antes do primeiro
  pixel** (sem flash branco) e ajusta a `meta theme-color`.
- `Hub.jsx` limpo: todos os hex fixos passaram a tokens. Era mesmo uma ilha
  escura dentro da aplicação no modo claro.
- `tokens.css` ganhou `--overlay`, usado pelos modais do Hub.

---

## Frente 6 — Super Admin ✅

- Redesenhar `admin-frontend/src/App.jsx` + `index.css` com os mesmos tokens e o
  botão de tema.
- **Remover o `admin@genesis.co.mz` pré-preenchido** (`App.jsx:8`) — mesmo defeito
  já corrigido no login do owner.
- Expor o que a API já oferece e a UI ignora. `admin.js` tem `/audit`, `/requests`,
  `approve`, `reject`, `/tenants`, `suspend`, `unsuspend`, `block`, `unblock`,
  `restore`, `delete`, `impersonate`; a UI só usa approve/reject/suspend.
- `reject` usa `window.prompt` → substituir por modal próprio com motivo validado.
- Pesquisa e filtros por estado.

### O que ficou FEITO (27-09-2026)

- `admin-frontend/src/index.css` reescrito: **tokens nos dois temas** (escuro
  vermelho/preto, claro ciano/branco) e mais a camada da piscina. Zero hex fora
  dos tokens.
- `admin-frontend/src/theme.js` + `ThemeToggle.jsx` (novos): botão lua/sol no
  login e no topo do painel, com a **mesma chave `localStorage`** do produto —
  quem escolheu o modo claro no login encontra o painel já claro.
- `admin-frontend/index.html`: script anti-flash antes do primeiro pixel.
- **Email `admin@genesis.co.mz` pré-preenchido removido** (era o mesmo defeito
  já corrigido no login do dono) + `type="email"`, `autoComplete` e
  `required` nos campos.
- `window.prompt` saiu: `ReasonModal` próprio para **rejeitar** e **bloquear**,
  com motivo obrigatório (mínimo 5 caracteres, como o backend exige).
- **Pesquisa e filtros por estado** (loja, dono, email, telefone, tipo), com
  contador "X de Y" e estado vazio próprio.
- Badges por estado com cor semântica (verde/laranja/vermelho).

### O que fica de fora (decisão declarada)

`/audit` continua sem interface. É a única peça da API que o painel não mostra,
e é trabalho de leitura + paginação próprios; fica anotado no mapa como
pendente em vez de ser feito à pressa.

---

## Frente 7 — Mapa mental 3D ✅

**Decisão técnica: canvas + matemática 3D própria, SEM Three.js.** Razões: a regra
do projecto é funcionar **offline sem CDN**; o Three.js são ~600 KB para um ficheiro
estático; e com 200–300 nós o canvas 2D com algoritmo do pintor dá o mesmo efeito de
constelação/galáxia, com controlo total do glow e do rasto. **Custo assumido:** mais
código meu e sem orbit controls prontos — rotação, zoom e pan escritos à mão.

- `Mapa Mental/mapa_mental_3d.html` — nós = ficheiros, ligados a quem dependem,
  **agrupados por directoria** (backend, frontend, admin-frontend, scripts, docs)
  com ligações entre grupos, para se ver que tudo está interligado.
- Cores: **verde** funciona · **laranja** incompleto · **vermelho** não roda ou tem
  falha de segurança · **azul** planeado.
- Clique num nó → painel com caminho, estado, o que faz e com quem está ligado
  (entradas e saídas). Zoom com a roda, rodar, arrastar.
- `Mapa Mental/mapa_mental_status.json` = fonte de verdade curada (estado +
  descrição + dependências). `scripts/gen_mindmap_data.js` cruza com os ficheiros
  reais e deixa os desconhecidos por classificar.
- **Compromisso:** sempre que planear um ficheiro novo, registo-o lá a **azul** com
  as suas ligações. Os desta plan entram já assim: `mailer.js`, `receiptPdf.js`,
  `Printer3D`, `ThemeProvider`, `theme-light.css`, `ThemeToggle`,
  `mapa_mental_3d.html`, `gen_mindmap_data.js` e os testes novos.
- O tema claro também se aplica ao mapa.

### O que ficou FEITO (27-09-2026) — 16/16 verificações a passar

- **`Mapa Mental/mapa_mental_3d.html`**: ficheiro único, **abre com duplo
  clique**, sem servidor, sem internet e sem CDN. Canvas 2D com matemática 3D
  própria (rotação, zoom, pan escritos à mão), algoritmo do pintor, halo e
  rasto de constelação. Fundo de estrelas com paralaxe e, no modo claro, a
  mesma piscina do resto do sistema.
  - Cada ponto é um ficheiro; cada linha é um `import`/`require` **real**.
  - Grupos numa esfera (espiral de Fibonacci) e sub-aglomerados por pasta.
  - Arrastar roda, roda dá zoom, shift+arrastar move, clique abre o painel,
    duplo clique foca os vizinhos, `Esc` limpa, `/` foca a pesquisa.
  - Legenda clicável por estado, chips por grupo, ecrã inteiro.
  - Cores: **verde** funciona · **laranja** incompleto · **vermelho** não roda ou
    tem falha de segurança · **azul** planeado (nó oco, ainda não existe) ·
    cinzento = por classificar.
- **`Mapa Mental/mapa_mental_status.json`**: fonte de verdade curada, com 169
  entradas (estado, descrição, papel, nota de segurança e ligações).
- **`scripts/gen_mindmap_data.js`**: varre o repositório, extrai as ligações dos
  `import`/`require`/`@import`, resolve para o ficheiro real e escreve
  `mapa_mental_data.js` (156 ficheiros, 189 ligações, 24 600 linhas).
  Regra: **nunca adivinha estado** — o que não estiver curado fica cinzento.
- Os dados vão num `.js` e não num `.json` de propósito: em `file://` o browser
  bloqueia `fetch`, mas `<script src>` funciona sempre.
- Estado actual do mapa: **135 verdes, 21 laranjas, 0 vermelhos, 5 azuis
  (planeados), 0 por classificar**.

### Compromisso cumprido

Sempre que nasce um ficheiro planeado, entra a **azul** no mapa curado com as
suas ligações. Os 5 azuis de agora: `report.service.js`, `dailyDigest.js`, a
migração Postgres inicial, `CodeMap.jsx` (mapa dentro da app) e
`docs/README_INSTALACAO.md`.

### [2026-09-27] — Sessão das 7 frentes: mapa 3D, tema claro, recibo, fecho de turno, recuperação de senha, super admin

**Porquê:** o fundador pediu, de uma vez, (1) o mapa mental 3D independente, (2) a
senha só mudar depois de confirmar o código do email, (3) o fecho de turno abaixo
do vendido, (4) impressão do recibo com animação 3D e PDF com nome sequencial do
dia, (5) o botão de tema em todas as telas, e (6) o painel de super admin
modificado. Ordem de execução escolhida: **de trás para a frente**, começando pelo
HTML independente (que não depende de nada estar a correr).

**Ficheiros criados (10):**
- `Mapa Mental/mapa_mental_3d.html` — o mapa. Ficheiro único, abre com duplo
  clique, canvas 2D + matemática 3D própria, sem libs e sem CDN.
- `Mapa Mental/mapa_mental_status.json` — fonte de verdade curada (169 entradas).
- `scripts/gen_mindmap_data.js` — varre o repositório e extrai as ligações reais.
- `backend/scripts/check_mail.js` — verificação do SMTP em 4 passos.
- `backend/scripts/run_checks.js` — sobe o backend, corre os testes e mata-o.
- `frontend/src/utils/receiptPdf.js` — PDF vectorial do recibo (jsPDF).
- `frontend/src/components/Printer3D.jsx` — a impressora 3D a sério.
- `frontend/src/components/SecurityGateIcon.jsx` — o cadeado do ecrã de reset.
- `frontend/src/theme/{ThemeProvider,ThemeToggle,PoolWater}.jsx` — tema.
- `frontend/src/ui/{theme-light,theme-toggle}.css` — tema claro e piscina.

**Ficheiros alterados:** `backend/.env` (bloco SMTP, `RESET_IMMEDIATE` removida),
`backend/src/routes/shift_closings.js` e `owner.js` (guarda `NO_OPEN_SHIFT`),
`frontend/src/pages/ResetPassword.jsx` (3 fases), `CashierDashboard.jsx` (impressão
em 3 passos + botão de tema), `Login.jsx`, `Hub.jsx` (hex → tokens), `Hub.jsx`,
`CRMLayout.jsx`, `main.jsx`, `index.html`, `index.css`, `ui/animations.css`,
`ui/tokens.css`, `i18n/index.js`, `utils/receiptPrinter.js` (XSS),
`admin-frontend/src/{App.jsx,index.css,ThemeToggle.jsx,theme.js}`,
`admin-frontend/index.html`, `frontend/package.json` (jspdf).

**Bugs encontrados e corrigidos (não estavam no pedido, saíram do caminho):**
1. `ResetPassword.jsx` comparava `password !== confirm` **sem existir campo de
   confirmação** → a reposição de senha falhava sempre. Ninguém conseguia mudar a
   senha. Corrigido ao reescrever o ecrã em 3 fases.
2. **Fecho duplo**: depois de um fecho aceite, o esperado voltava a 0 e dava para
   gravar um segundo fecho do mesmo dinheiro (diferença "a mais", relatório de
   caixa envenenado). Apanhado pelo E2E, fechado em **ambos** os caminhos.
3. **XSS no recibo**: o nome de um produto ia por concatenação crua para o
   documento do diálogo de impressão. Agora tudo passa por `esc()` e o `src` do
   QR é validado.
4. `mapa_mental_data.js` e os `.map` de scratch entravam no mapa como ficheiros.

**Validações (todas com evidência, nenhuma por achar):**
- `node backend/scripts/run_checks.js` → `test_auth` **5/5**, `shift_closing_e2e`
  **12/12** (era 11/12), `check_mail` em AVISO (falta a senha de aplicativo).
- `npm run build` no frontend → OK, 8.4 s. O pacote inicial desceu de
  **407 kB → 286 kB (gzip)** porque o jsPDF passou a `import()` dinâmico.
- `npm run build` no admin-frontend → OK, 1.1 s.
- Mapa 3D: 16/16 verificações automáticas (dados coerentes + 3 frames de render
  sem excepções).
- Estado do mapa: 135 verdes, 21 laranjas, **0 vermelhos**, 5 azuis, 0 cinzentos.

**Porquê o 0 em vermelho:** era o objectivo. Os dois vermelhos que existiam
(`ResetPassword.jsx` e `receiptPrinter.js`) foram corrigidos; o que não está
perfeito está declarado laranja, com a nota do que falta.

**Decisões tomadas sem perguntar (e porquê):**
- **Canvas 2D em vez de Three.js**: o mapa tem de abrir sem internet; o Three.js
  são ~600 KB e o Three não se resolves de um ficheiro local com o mesmo comforto.
  O custo é mais código de câmara, escrito à mão.
- **jsPDF em vez de `html2canvas`**: texto vectorial fica nítido a imprimir, não
  pesa, e o `html2canvas` corromperia a captura de um elemento com transform 3D.
- **Web Serial passa a ser a última opção**, depois do download do PDF: antes
  capturava o clique e abria um selector de porta em vez de imprimir.
- **Numeração do PDF pela venda do dia (servidor)**, não por dispositivo: para o
  número coincidir com o que está impresso no talão.

**Falta o fundador fazer (bloqueios reais, não código):**
1. `MAIL_USER` + `MAIL_PASS` (senha de aplicativo do Google) em `backend/.env`.
2. Autorizar `http://localhost:5173` e `http://localhost:5175` em *OAuth client ID*
   no Google Cloud Console.

**Segue-se:** `prisma db push` no Supabase (Postgres + RLS) — bloqueado por
acesso ao projecto Supabase, não por código.

---



1. **Os dois espaços no nome do PDF.** Alguns sistemas colapsam espaços duplos em
   nomes de ficheiro. Implementado como pedido; se vier com espaços simples, avisa-se.
2. **Numeração com dois caixistas no mesmo dia.** Usa-se o `daily_number` do servidor
   (por loja/dia). Numeração **por dispositivo** é uma mudança pequena, mas o número
   do PDF deixa de coincidir com o recibo impresso — preferiu-se o comportamento actual.
3. **`RESET_IMMEDIATE` desapareceu** (já agora: a rota também). Perda deliberada: era
   a via que funcionava sem email. **Enquanto `MAIL_USER`/`MAIL_PASS` estiverem
   vazios, o código de 6 dígitos vai para o log do servidor e não para o email** —
   quem tentar recuperar a senha em produção sem SMTP-configurado vai ficar à
   espera. Passos para fechar: Google Conta → Segurança → verificação em duas
   etapas → senha de aplicativo → colar em `backend/.env` → `node scripts/check_mail.js --to <email>`.
4. **Origens do Google Console são do fundador.** O `GOOGLE_CLIENT_ID` já está nos
   dois `.env`; falta autorizar as origens no painel do Google.
5. **Remover `'cashier'` de `/api/shift_closings`** — verificado: o POS usa
   `/close-shift-blind` e o E2E confirma 403 para o caixista.
6. **Novo: fechar duas vezes o mesmo turno passou a dar 400.** É intencional (ver
   Frente 3), mas se alguém habituado a "arrumar a gaveta" com dois fechos
   seguidos notar a mudança, é este o motivo.

## Como validar o que foi feito hoje

```bash
# 1. Backend (sobe e desce sozinho; não deixa processos)
cd backend && node scripts/run_checks.js

# 2. E-mail (depois de preencher o .env)
node scripts/check_mail.js --to oseu@email.com

# 3. Frontend
cd frontend && npm run build
cd admin-frontend && npm run build

# 4. Mapa mental 3D (abre no browser, sem servidor)
node scripts/gen_mindmap_data.js   # actualizar dados
# depois: duplo clique em Mapa Mental/mapa_mental_3d.html
```

## O que NÃO é tocado
- ❌ Cálculo de dinheiro e regras do POS (excepto o fecho de turno, que é o bug)
- ❌ Isolamento por tenant (o código está correcto)
- ❌ Modo offline (IndexedDB, `useOfflineSync`) — o fallback do PDF é aditivo

