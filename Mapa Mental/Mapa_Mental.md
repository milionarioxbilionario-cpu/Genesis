# Mapa Mental — Genesis

Fonte única de verdade do estado real do repositório. Actualizado em cada sessão.

---

## Parte A — ESTADO ACTUAL

Actualizado: 18 de Setembro de 2026 (Fases 0.4-H, 0-B.1 e 0-B.2 — expurgo, segredos e separação do admin)

### Identidade
| Item | Valor | Estado |
|---|---|---|
| Nome do produto | Genesis | ✅ CONFIRMADO (regra; grep de resíduos LucroCerto/GESTÃO INTELIGENTE MZ ainda ⚠️ NÃO VERIFICADO nesta sessão) |
| Moeda interna | centavos inteiros (MZN) | ✅ CONFIRMADO nos formulários que **enviam** dinheiro (`frontend/src/utils/money.js`). Debts/Goals/Suppliers.jsx não POST-am valores. `setup.fixedCosts` no onboarding ainda não vai para a API. |
| Frontends | `frontend/` (Owner/Cashier) + `admin-frontend/` (Super Admin, porta 5175) | ✅ separação física concluída 18/09 (ficheiros admin apagados do bundle principal; rotas `/admin*` redireccionam para `/login`) |

### Frontend — arranque e rotas
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| `frontend/src/main.jsx` | Ponto de entrada Vite. Importa `./App.jsx` (não `pages/App.jsx`). | ✅ CONFIRMADO FUNCIONAL | 13/09/2026 — leitura directa do ficheiro: `import App from './App.jsx';` |
| `frontend/src/App.jsx` | Router único da app Owner/Cashier. Envolve `/owner/*`, `/onboarding`, `/cashier`, `/pos` em `ProtectedRoute`. `/admin`, `/super-admin` e `/admin/login` redireccionam para `/login`. **Sem imports admin** (removidos 18/09). | ✅ CONFIRMADO FUNCIONAL para protecção de rotas e separação | 18/09/2026 — leitura integral + `vite build` OK + varredura do bundle compilado: `SuperAdminDashboard`/`/api/admin/*` = 0 |
| `frontend/src/pages/App.jsx` | Cópia residual. No último commit (`HEAD`) era a versão **sem** ProtectedRoute (`/admin`, `/owner`, `/pos` abertos). Na working tree tinha sido copiado por cima da versão protegida, o que mascarava o problema. | ❌ NÃO EXISTE AINDA (apagado nesta sessão; era o objectivo) | 13/09/2026 — `test ! -f frontend/src/pages/App.jsx` + `git show HEAD:frontend/src/pages/App.jsx` mostrou rotas sem ProtectedRoute |
| `frontend/src/components/ProtectedRoute.jsx` | Verifica `/api/auth/me`, loading/unauthorized/wrong-role | ✅ CONFIRMADO (auditoria 13/09; não reaberto nesta sessão) | auditoria ficheiro a ficheiro 13/09 |
| `frontend/src/pages/AdminLogin.jsx` | Login Super Admin no bundle principal | ❌ APAGADO 18/09 (separação física; vive só em `admin-frontend/`) | 18/09/2026 — `ls` = inexistente; `grep` no bundle = 0 refs |
| `frontend/src/pages/SuperAdmin/Dashboard.jsx` (188 linhas) | Dashboard Super Admin no bundle principal | ❌ APAGADO 18/09 (separação física; vive só em `admin-frontend/src/App.jsx`) | 18/09/2026 — `ls` = inexistente; `SuperAdminDashboard` no bundle compilado = 0 |
| `frontend/src/pages/Owner/POS.jsx` | POS dentro da pasta Owner | 🔴 CONHECIDO COMO QUEBRADO (Owner não deve ter UI de vendas) | auditoria 13/09 — existência reportada; não reaberto nesta sessão |
| `frontend/src/utils/money.js` | `mznToCents` / `centsToMznInput` | ✅ CONFIRMADO FUNCIONAL | 13/09/2026 — node 8/8 PASS (150.50→15050, 95→9500, 2500→250000) |
| `frontend/src/pages/OnboardingWizard.jsx` | Catálogo em MZN; envia `mznToCents`. Passo custos **não** chama API. | ✅ produtos; ⚠️ fixedCosts não persistidos | 13/09/2026 — linhas 115-116 |
| `frontend/src/pages/Owner/Employees.jsx` | Form em MZN (default 2500); POST `mznToCents` | ✅ CONFIRMADO FUNCIONAL | 13/09/2026 — leitura + teste helper |
| `frontend/src/pages/Owner/Dashboard.jsx` | Produto/stock/fornecedor: MZN no input, centavos no POST; edição com `centsToMznInput` | ✅ CONFIRMADO FUNCIONAL | 13/09/2026 — handlers 197-277 |
| `frontend/src/pages/CashierDashboard.jsx` | Carrinho: preços já em centavos da API. Recebido e fecho de turno: `mznToCents` | ✅ código; ⚠️ NÃO VERIFICADO no browser | 13/09/2026 — leitura + teste helper |
| `frontend/src/pages/Owner/Debts.jsx` | Só GET. Sem POST monetário. | ✅ CONFIRMADO (sem form de envio) | 13/09/2026 — leitura integral |
| `frontend/src/pages/Owner/Goals.jsx` | Só GET. Sem POST `/goals`. | ✅ CONFIRMADO (sem form de envio) | 13/09/2026 — leitura integral |
| `frontend/src/pages/Owner/Suppliers.jsx` | Só GET. POST de fornecedor está no Dashboard. | ✅ CONFIRMADO (sem POST) | 13/09/2026 — leitura integral |
| `frontend/src/pages/Owner/Settings.jsx` | PIN e horário. Sem moeda. | ✅ N/A | 13/09/2026 — leitura integral |
| `frontend/src/components/PosCart.jsx` | Já fazia `Math.round(parseFloat(amountReceived) * 100)` | ✅ CONFIRMADO FUNCIONAL | 13/09/2026 — linha 10 |

### Backend
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| `backend/src/index.js` | Monta `/api/admin` com `adminOriginCheck`, `authMiddleware`, `requireRole('super_admin')`. CORS `origin: true`. | ✅ cadeia admin confirmada na auditoria; 🔴 CORS aberto | auditoria 13/09 |
| `backend/src/routes/owner.js` | Lógica Owner. Relatório mensal usa `computeMonthlyDeductions` (renda por `type===rent`, entregas a partir de `stockEntry` do período). | ✅ isolamento tenant (auditoria); ✅ fórmula mensal (testes unitários) | 13/09/2026 — `node --test tests/monthlyDeductions.test.js` 6/6 PASS; rota lida |
| `backend/src/services/monthlyDeductions.js` | Cálculo puro de deduções mensais (sem Prisma) | ✅ CONFIRMADO FUNCIONAL | 13/09/2026 — 6 testes PASS |
| `backend/src/controllers/` | Vazio | ❌ NÃO EXISTE AINDA (pasta vazia) | auditoria 13/09 |
| `backend/src/validators/` | Vazio | ❌ NÃO EXISTE AINDA | auditoria 13/09 |
| `report.service.js` | Extração completa de relatórios (diário/semanal/mensal) | ❌ NÃO EXISTE AINDA (só `monthlyDeductions.js`, Fase 3.3) | 13/09/2026 |

### Decisões em aberto (não assumir)
- Routes-com-lógica vs controllers/services separados.
- `ADMIN_ORIGINS` em produção.

### Repositório / higiene de credenciais (verificado 18/09/2026)
| Caminho | O que faz / problema | Estado | Última verificação |
|---|---|---|---|
| `backend/prisma/dev.db` | Base SQLite local (33 users / 29 tenants, hashes bcrypt `$2b$12$`) | ✅ fora do git e do histórico; existe só no disco e está ignorada | 18/09/2026 — `git log --all -- <f>` = 0 commits; `git check-ignore -v` → regra `.gitignore:27` |
| `logs/` | Logs locais — continham credenciais de demonstração em **texto claro** (linha `Demo data ensured: …`) | ✅ fora do git e do histórico | 18/09/2026 — `git log --all -- logs/backend.log` = 0 |
| `Desktop.zip`, `Genesis.txt`, `Genesis - SaaS`, `ConteudoDentro…txt`, `tree*`, `backend_server.log` | Dumps e resíduos | ✅ removidos do git e do histórico | 18/09/2026 — `git ls-files` sem ocorrências |
| `.gitignore` | Exclusões consolidadas (`*.db`, `logs/`, `*.zip`, `backend/prisma/dev.db`) | ✅ CONFIRMADO FUNCIONAL | 18/09/2026 — `git check-ignore -v` OK; ficheiros essenciais **não** ignorados (verificado) |
| `backend/src/index.js` (seed demo) | ✅ **CORRIGIDO 18/09**: `ensureDemoData()` é agora opt-in (`SEED_DEMO_DATA=true`) e lê `DEMO_*_PASSWORD` do `.env`; já não imprime credenciais | ✅ CONFIRMADO FUNCIONAL | 18/09/2026 — ver Fase 0-B.1 na Parte B |
| `backend/src/routes/.auth.js.swp`, `backend/src/.index.js.swp` | 🔴 Swap files do Vim **versionados**; o primeiro continha uma comparação directa da password do super_admin com um literal escrito no código (estado antigo do `auth.js`). O `auth.js` actual usa `bcrypt.compare` — sem backdoor activo | ✅ REMOVIDOS 18/09 (git + disco; backup) e `*.swp` no `.gitignore` | 18/09/2026 — varredura a todos os objectos = 0 literais |
| `backend/.env.example` | Template das variáveis (inclui `SEED_DEMO_DATA`, `DEMO_*_PASSWORD`) | ✅ versionado (negado `!.env.example`) | 18/09/2026 — `git ls-files` + `git check-ignore` |
| `backend/.env` | Credenciais locais reais | ✅ nunca versionado nem presente na história | 18/09/2026 — varredura ampla: só placeholders |
| `frontend/src/pages/Login.jsx` | 🔴 Tinha as **passwords pré-preenchidas** no formulário do site principal (owner, cashier e super_admin) | ✅ CORRIGIDO 18/09 (password começa vazia; preset `super_admin` removido; login super_admin aqui recusado com mensagem para o painel dedicado) | 18/09/2026 — `git grep` = 0 + leitura integral na Fase 0-B.2 |
| `admin-frontend/src/App.jsx` | 🔴 Tinha a password do Super Admin pré-preenchida no formulário | ✅ CORRIGIDO 18/09 | 18/09/2026 — `git grep` = 0 |
| `test.sh`, `backend/scripts/*` (6), `docs/curl_collection.sh`, `docs/postman_genesis_collection.json` | Usam a mesma password demo em texto claro | 🔴 CONHECIDO COMO QUEBRADO | 18/09/2026 — grep: 11 ficheiros |
| `frontend/src/App.jsx` (linhas 4 e 8) | Importava `AdminLogin` e `AdminDashboard` → código admin **compilado no bundle principal** | ❌ REMOVIDO 18/09 (imports apagados; `/admin*` redirecciona para `/login`; bundle varrido: 0) | 18/09/2026 — `vite build` + grep no `dist/assets/index-*.js` |
| `frontend/src/utils/auth.js` (`getPortalRoute`) | Devolvia `/admin` para `super_admin` neste bundle | ✅ CORRIGIDO 18/09 (super_admin cai em `/login`; nota no código) | 18/09/2026 — leitura directa |
| `frontend/src/components/ProtectedRoute.jsx` (`roleRedirects`) | Tinha entrada `super_admin: '/admin-forbidden'` (rota inexistente) | ✅ CORRIGIDO 18/09 (super_admin cai em `/login` por omissão) | 18/09/2026 — leitura directa |
| `frontend/src/layouts/CRMLayout.jsx` | Barra lateral tinha item `Super Admin` → `/admin` visível a Owner/Cashier | ✅ CORRIGIDO 18/09 (item removido) | 18/09/2026 — leitura directa |
| `admin-frontend/` | Projecto Super Admin separado, porta 5175, **auto-contido** (`src/App.jsx` 344 linhas, sem imports do `frontend/`) | ✅ CONFIRMADO FUNCIONAL (estrutura + build OK 18/09) | 18/09/2026 — leitura integral de `App.jsx`, `main.jsx`, `vite.config.js` + `vite build` 1.63s + `node --check` em `routes/admin.js` e `adminOriginCheck.js` |
| `backend/src/routes/sales.js` | Cancelamento com PIN + restauro de stock, reescrito de SQL cru → ORM | ⚠️ NÃO VERIFICADO (sintaxe OK; **sem prova funcional**) | 18/09/2026 — `node --check` OK; commitado por outro agente sem registo no Mapa |

### Roadmap — o que falta (não fazer nesta sessão)
- **Fase 0.1** — dois `App.jsx` → feita (commitada em `f58b30b` por outro agente).
- **Fase 0.2** — conversão ×100 nos forms que enviam dinheiro → feita (commitada em `f58b30b`).
- **Fase 0.3** — fórmula relatório mensal → feita; testes 6/6 PASS (commitada em `f58b30b`).
- **Fase 0.4-H** — resíduos + `.gitignore` + expurgo de histórico → feita localmente; **`force-push` pendente de autenticação** (o credential helper do VS Code não resolve fora da UI).
- **Fase 0-B.1** — passwords demo fora do código + seed opt-in + expurgo dos literais e dos `.swp` → feita, verificada, **publicada** (`ab684a7`) e passwords **rodadas** (ver Parte B).
- **Fase 0-B.2** — separação física do admin (apagar `AdminLogin` + `SuperAdmin/Dashboard` do bundle principal; limpar referências em `Login`/`auth`/`ProtectedRoute`/`CRMLayout`) → feita e verificada (ver Parte B). **Pendente: commit + push desta fase.**
- **Segue-se: Fase 0-B.3** — prova funcional do cancelamento com PIN (`backend/src/routes/sales.js`, reescrito para ORM sem prova).
- **Pendente (SECÇÃO 11)** — `Mapa Mental/mapa_mental_3d.html` não existe ainda.
- Fases 1–7 conforme Prompt Mestre.

---

## Parte B — JORNAL CRONOLÓGICO

### [2026-09-13] — Prompt mestre recebido; Mapa Mental criado
- Ficheiros alterados: `Mapa Mental/Mapa_Mental.md` (criado), `Mapa Mental/Prompt_Mestre.md` (cópia de referência).
- Porquê: o directório `Mapa Mental/` não existia. O prompt mestre exige criação imediata com a Secção 6 como Parte A, antes de qualquer outra decisão.
- Prova/teste realizado: listagem do repositório antes da criação devolveu 0 ficheiros `Mapa_Mental.md`.
- Resultado: funcionou — âncora de estado criada a partir da auditoria de 13/09/2026, não a partir de resumos de agentes anteriores.
- Segue-se: uma única mini-meta da Fase 0: 0.1 (conflito dos dois `App.jsx`).

### [2026-09-13] — Fase 0.1: removido `frontend/src/pages/App.jsx`
- Ficheiros alterados: `frontend/src/pages/App.jsx` (apagado).
- Porquê: coexistiam dois routers. `frontend/src/main.jsx` importa só `./App.jsx`. O ficheiro em `pages/` no `HEAD` do git era a versão antiga **sem** `ProtectedRoute` (`/admin`, `/owner`, `/pos` acessíveis sem login). Na working tree alguém tinha copiado o `App.jsx` protegido para `pages/App.jsx`, o que fazia os dois parecerem iguais e escondia o risco: um revert ou um import errado voltava a expor o router inseguro.
- Prova/teste realizado (output real):
  1. `frontend/src/main.jsx` linha 3: `import App from './App.jsx';`
  2. `git show HEAD:frontend/src/pages/App.jsx` (24 linhas) incluía, sem ProtectedRoute:
     `/admin` → AdminDashboard, `/owner` → OwnerDashboard, `/pos` → CashierDashboard, `/cashier` → CashierDashboard.
  3. `grep -R pages/App` no repo: zero matches.
  4. `test ! -f frontend/src/pages/App.jsx` → OK, ficheiro inexistente.
  5. `frontend/src/App.jsx` (135 linhas) mantém ProtectedRoute em `/owner`, `/pos`, `/cashier`.
  6. `git status --short`: `D frontend/src/pages/App.jsx` e `?? Mapa Mental/`
- Resultado: funcionou. Resta um único router, o protegido.
- Segue-se: **parar** e aguardar confirmação humana. Próxima mini-meta proposta: Fase 0.2 (grep de valores monetários em formulários).

### [2026-09-13] — Fase 0.2: conversão MZN→centavos em todos os forms que enviam dinheiro
- Ficheiros alterados: `frontend/src/utils/money.js` (novo), `Employees.jsx`, `Owner/Dashboard.jsx`, `OnboardingWizard.jsx`, `CashierDashboard.jsx`.
- Porquê: a UI pede Meticais; a API exige inteiros em centavos. Employees e Dashboard enviavam o número do input sem ×100. O POS copiava centavos da API no carrinho (correcto) mas "dinheiro recebido" e fecho de turno tratavam o input como centavos (`placeholder: 150000`).
- Inspecção sem alteração: `Debts.jsx`, `Goals.jsx`, `Suppliers.jsx`, `Settings.jsx`, `Cashiers.jsx` — nenhum POST monetário. `PosCart.jsx` já convertia. Custos fixos do onboarding não chamam API — não inventei persistência.
- Prova/teste (node, 8/8 PASS): `mznToCents(150.5)=15050`, `mznToCents(95)=9500`, `mznToCents(2500)=250000`; payloads simulados employee 250000 / produto 9500 / shift 150000. Grep residual `sell_price: Number(` só no carrinho POS a copiar preços já em centavos (não multiplicar outra vez).
- Resultado: funcionou ao nível de código + teste do helper. Não foi feito POST autenticado contra o backend nesta sessão.
- Segue-se: parar. Próxima mini-meta proposta: Fase 0.3 (fórmula do relatório mensal em `owner.js`).

### [2026-09-13] — Fase 0.3: fórmula do relatório mensal
- Ficheiros alterados: `backend/src/services/monthlyDeductions.js` (novo), `backend/tests/monthlyDeductions.test.js` (novo), `backend/src/routes/owner.js` (`GET /reports/monthly`).
- Porquê: `total_rent` estava hardcoded a `0`; `total_supplier_delivery` somava cada fornecedor activo uma vez, mesmo sem entregas no mês. O lucro líquido real ficava errado.
- Fórmula agora: renda = soma de `fixedCost` com `type` rent (case-insensitive); outros tipos → `total_other_fixed`; custo de entrega = uma visita por (`supplier_id` + dia) nas `stockEntry` do período, vezes `delivery_cost_per_visit`. Entradas sem fornecedor = 0. `operating_expenses` = salários + renda + outros fixos + entregas (sem duplicar renda).
- Prova/teste realizado (output real):
```
✔ renda vem de fixedCosts type=rent; outros tipos ficam em other
✔ fornecedores activos sem entradas de stock no período não geram custo de entrega
✔ várias linhas de stock no mesmo dia e fornecedor contam uma visita
✔ o mesmo fornecedor em dias diferentes conta duas visitas
✔ entrada sem supplier_id não entra no custo de entrega
✔ lucro líquido = lucro bruto - despesas operacionais (renda incluída)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```
- Resultado: funcionou nos testes unitários. Não foi chamado `GET /api/owner/reports/monthly` autenticado contra a API nesta sessão. Grep: `total_rent = 0` já não existe.
- Segue-se: parar. Próxima mini-meta proposta: Fase 0.4 (ficheiros residuais e `.gitignore`).

### [2026-09-18] — Fase 0.4-H: expurgo de dev.db/logs/dumps do histórico + `.gitignore`
- Contexto/incidente: um segundo agente (Copilot CLI, pid 40748) commitou e **já publicou** enquanto esta sessão investigava: `f58b30b "Melhoria na arquitetura"` (03:33) engoliu todo o trabalho pendente das Fases 0.1–0.3 **e** arrastou para o git `backend/prisma/dev.db`, `logs/*.log`, `tree (copy 1)`; `ac104e5 "Prompt"` (03:35) adicionou `Desktop.zip`. O prompt mestre não registava nada disto. O fundador confirmou ter parado esse agente.
- Motivo da urgência: `backend/prisma/dev.db` (34 commits de histórico) contém 33 users / 29 tenants com hashes bcrypt; `logs/backend.log` continha **credenciais em texto claro** e essas credenciais **funcionam** (o próprio `test.sh` faz login com elas).
- Ficheiros alterados: `.gitignore` (consolidado); história do git reescrita; `backend/prisma/dev.db` restaurada do backup.
- Procedimento (prova):
  1. Backup verificado: `git bundle create ~/genesis-backup-20260918/genesis-full.bundle --all` → "The bundle records a complete history"; `dev.db` com sha256 `cd13aa77…d00d4e83` **idêntico** ao original; cópia integral do `.git`.
  2. `git-filter-repo` (script autónomo; o `pip3` falhou por PEP 668) `--force --invert-paths` sobre `backend/prisma/dev.db`, `logs/`, `Desktop.zip`, `Genesis.txt`, `treeSaaS.txt`, `Genesis - SaaS`, `ConteudoDentroDosArquivosDoMeuSaaS.txt`, `tree`, `tree (copy 1)`, `tree.txt.save`, `backend_server.log` → "Parsed 70 commits … Completely finished after 0.56 seconds".
  3. Como previsto, o `reset --hard` do filter-repo **apagou `dev.db` do disco** → restaurada do backup, sha256 idêntico, `users=33 tenants=29` reconfirmados.
  4. `git remote add origin` (o filter-repo remove o remoto por segurança).
- Verificação (output real): todos os resíduos com `git log --all --oneline -- <f>` = **0 commits**; `git ls-files` = 158 ficheiros, sem resíduos na raiz; `git check-ignore -v` devolve a regra correcta para `dev.db`/`logs/`/`.zip` e **não** ignora `schema.prisma`, `App.jsx`, `run-local.sh`; `node --check backend/src/index.js` OK; ficheiros críticos presentes.
- Commits: `08d1536 chore(security): purgar da historia dev.db, logs e dumps; reforcar .gitignore` (local).
- ⚠️ **NÃO COMPLETO — push pendente:** `git push --force-with-lease origin main` **falhou por falta de credenciais** (sem credential helper, sem `~/.git-credentials`, `gh` não autenticado; o askpass do VS Code exige a UI). `origin/main` continua em `ac104e5` — ou seja, **o vazamento ainda está visível no GitHub** até este push ser feito. Rollback disponível: `git clone ~/genesis-backup-20260918/genesis-full.bundle`.
- Descoberta nova (mais grave que o lixo): as passwords demo **não** estavam só nos logs — estão hardcoded em `backend/src/index.js` linhas 58/101/147, que **cria** as contas reais `owner@genesis.local`, `cashier@genesis.local` e `admin@genesis.co.mz`; e repetidas em 6 scripts, `test.sh` e `docs/`. O expurgo de histórico **não** resolve isto: continua no HEAD e na história, e corrigi-lo muda comportamento da aplicação (exige decisão do fundador).
- Resultado: limpeza local **funcionou e está provada**; publicação **não concluída**.
- Segue-se: parar. Itens propostos por ordem — (1) o fundador autenticar e fazer o `force-push`; (2) decidir como remover as credenciais hardcoded do seed demo; (3) Fase 1 restante (remover `AdminLogin`/`SuperAdmin` do bundle principal, 188 linhas confirmadas); (4) prova funcional do cancelamento com PIN em `sales.js`.

#### Adenda de verificação (18/09/2026) — como ler correctamente os resultados
- `git log --all -- <caminho>` devolveu **9 commits** após o expurgo, o que parecia contradizer o resultado. Causa apurada: o `--all` inclui `refs/remotes/origin/main`, que **continua a apontar para a história antiga** (`ac104e5`) porque o `force-push` está pendente. Contando apenas a história reescrita que será publicada:
  `git log --oneline main -- backend/prisma/dev.db` → **0**; `logs/` → 0; `Desktop.zip` → 0; `Genesis.txt` → 0; `tree` → 0; `backend_server.log` → 0.
- **Refs escondidas descobertas:** existem 36 refs `refs/agents/<uuid>/checkpoints/turn/N` (estado de checkpoints de ferramentas de agente). Não aparecem em `git branch -a`. Apenas **2** (`refs/agents/5eae0493-…/checkpoints/turn/1` e `/turn/2`) contêm snapshots com `dev.db`/`logs/backend.log`.
- **Não são uma exposição:** `git ls-remote origin` devolve **apenas 2 refs** (`HEAD`, `refs/heads/main`) — nenhuma `refs/agents/*` foi publicada, e a `dev.db` já existe no disco local por desenho. Não foram removidas (pertencem ao estado de ferramentas de agente; removê-las quebraria o restauro de checkpoints e não reduz exposição externa).
- **Risco a evitar:** nunca usar `git push --all` ou `--mirror` neste repositório enquanto essas refs existirem — isso publicaria os snapshots locais.
- Pós-push esperado: `git log --all -- <caminho>` passa a **0** depois de `git fetch --prune` trazer o `origin/main` reescrito.

### [2026-09-18] — Fase 0-B.1: passwords demo fora do código + expurgo do histórico
- Ficheiros alterados: `backend/src/index.js`, `frontend/src/pages/Login.jsx`, `admin-frontend/src/App.jsx`, 8 scripts (`create_owner_user.js`, `e2e_test.js`, `e2e_test2.js`, `e2e_test2.fixed.js`, `e2e_test2 (copy 1).js`, `seed_admin.js`, `smoke_tests.js`, `verify_hash.js`), `test.sh`, `docs/curl_collection.sh`, `docs/postman_genesis_collection.json`, `plan.md`, `backend/.env.example`, `.gitignore`, `Mapa Mental/Mapa_Mental.md`, `Oque ja fiz…txt`.
- Porquê: `ensureDemoData()` corria **incondicionalmente** (linha 201, sem `NODE_ENV` nem flag) e fazia `upsert` de um **super_admin com password conhecida** — no dia do deploy num VPS (SECÇÃO 5.1) qualquer pessoa entrava como Super Admin. Não era só lixo de repo: era vulnerabilidade latente de produção.
- Alterações: seed passou a **opt-in** (`SEED_DEMO_DATA=true`) e lê `DEMO_OWNER_PASSWORD` / `DEMO_CASHIER_PASSWORD` / `DEMO_ADMIN_PASSWORD` do `.env`; falha com mensagem clara se faltarem; **deixa de imprimir credenciais**. Os literais saíram de todo o código, scripts e docs.
- **Achado adicional 1:** `frontend/src/pages/Login.jsx` tinha as passwords **pré-preenchidas** no formulário do site principal (`rolePresets`), incluindo a do super_admin — pior que o seed, porque as entregava na UI a qualquer visitante. O `admin-frontend/src/App.jsx` idem. Ambos corrigidos (password começa vazia).
- **Achado adicional 2 (grave, só detectado por mudar de método):** `git ls-tree HEAD` revelou **dois ficheiros de swap do Vim versionados** — `backend/src/routes/.auth.js.swp` e `backend/src/.index.js.swp`. O primeiro continha uma comparação directa da password do super_admin com um literal escrito no código (estado antigo do `auth.js`, `passwordMatch = (password === "<literal>")`). O `auth.js` **actual está correcto** (`bcrypt.compare(password, user.password_hash)`, linha 104) — não há backdoor activo. Removidos do git e do disco (backup em `~/genesis-backup-20260918/swp/`) e `*.swp/*.swo/*.swx/*.orig/*.rej` adicionados ao `.gitignore`.
- **Lição de método (importante para a SECÇÃO 9):** a primeira verificação usou `git grep -I`, que **ignora ficheiros binários** — por isso os `.swp` nunca apareceram e a conclusão "0 ocorrências" estava errada. A varredura que encontrou o problema foi `git cat-file --batch-all-objects` sem `-I`. Conclusão: greps de segurança **não devem usar `-I`**.
- Procedimento de expurgo (4 passes de `filter-repo`, cada um com verificação própria):
  1. `--invert-paths` (dev.db, logs/, Desktop.zip, dumps, tree*, backend_server.log) — Fase 0.4-H.
  2. `--replace-text` dos literais com `!` (721 → 2 blobs).
  3. `--replace-text` dos prefixos nus (resíduo em documentação minha).
  4. `--invert-paths` dos dois `.swp`.
- Verificação (output real): `node --check` 9/9 OK e `bash -n test.sh` OK; `git grep -I` = 0; varredura a **todos os objectos** (303 blobs, inclui binários e soltos, sem `-I`) → **0 com literais**; varredura ampla de outros segredos (`JWT_SECRET=`, `SUPABASE_SERVICE_ROLE`, `TWILIO_TOKEN=`, `AC[0-9a-f]{32}`, `sk-…`, `ghp_…`, `postgresql://`) → **apenas placeholders** do `.env.example` e do `run_phase0.sh`, nenhum segredo real.
- Teste funcional do gate: sem a flag → log só mostra "Genesis backend running", **sem seed**; com a flag → "Demo data ensured … (passwords lidas de DEMO_*_PASSWORD; não são impressas)"; flag sem password → erro claro `SEED_DEMO_DATA=true exige as variáveis DEMO_OWNER_PASSWORD`; **login real → HTTP 200, role=owner, token emitido**.
- Preservação: `backend/prisma/dev.db` sobreviveu a todos os rewrites com sha256 idêntico (`3aa63cce…`, 33 users / 29 tenants); `backend/.env` intacto; `.git` reduziu de 11M para 3.5M.
- `.gitignore`: negado `!.env.example` (a regra `.env.*` estava a excluir o template, deixando `SEED_DEMO_DATA`/`DEMO_*` sem documentação versionada); `backend/.env` continua fora do git.
- ️ **Push continua pendente de autenticação** — `origin/main` ainda é a história antiga com `dev.db`, logs e passwords. Enquanto não for feito, o vazamento mantém-se visível no GitHub.
- Segue-se: parar. Ordem proposta — (1) `force-push` + rotação das passwords; (2) Fase 0-B.2 (remover `AdminLogin`/`SuperAdmin` do bundle principal, 188 linhas); (3) Fase 0-B.3 (prova funcional do cancelamento com PIN).

### [2026-09-18] — Push 0-B.1 concluído + rotação de passwords provada
- **Push:** `git push --force-with-lease origin main` → exit 0; `git ls-remote` confirma `origin/main = ab684a7` (igual ao local). A história antiga com `dev.db`, logs e literais saiu do GitHub. Repositório **privado** (confirmado via API: `private: true`, 0 forks) — exposição limitada a quem já tivesse clonado.
- **Rotação das 3 demo passwords:** novos valores de 20 caracteres escritos em `backend/.env` (backup do anterior em `~/genesis-backup-20260918/`). Verificação directa na BD: `bcrypt.compare` das **novas = MATCH** e das **antigas = NO** para owner, cashier e admin — as antigas deixaram de funcionar. (Nota: o teste via HTTP deu 429 por rate-limit após os logins repetidos; a prova por bcrypt directo na BD é equivalente e não toca no limiter.)
- Estado: Fase 0-B.1 **encerrada**. Segue-se a Fase 0-B.2.

### [2026-09-18] — Fase 0-B.2: separação física do Super Admin (código admin fora do bundle principal)
- Ficheiros apagados: `frontend/src/pages/AdminLogin.jsx`, `frontend/src/pages/SuperAdmin/Dashboard.jsx` (188 linhas) + directório `SuperAdmin/`. Ficheiros alterados: `frontend/src/App.jsx` (imports admin removidos; `/admin/login` passa a redireccionar para `/login`), `frontend/src/pages/Login.jsx` (preset `super_admin` removido; `activeMode` só aceita owner/cashier; login com role super_admin recusado com mensagem para o painel dedicado; textos do modo admin removidos), `frontend/src/utils/auth.js` (`getPortalRoute` já não devolve `/admin`), `frontend/src/components/ProtectedRoute.jsx` (entrada `super_admin: '/admin-forbidden'` removida — cai em `/login`), `frontend/src/layouts/CRMLayout.jsx` (item `Super Admin` → `/admin` removido da barra lateral).
- Porquê (SECÇÃO 12.2.4 do Prompt Mestre): mesmo com as rotas `/admin` desactivadas, o código de admin era **compilado e servido no JS de qualquer Owner/Cashier**, inspeccionável no browser — falha de segurança arquitectural, não estética.
- Verificação (output real): `vite build` do `frontend/` OK (3.77s); varredura do bundle compilado `dist/assets/index-*.js` → `SuperAdminDashboard` = 0, `/api/admin/requests` = 0, `/api/admin/tenants` = 0; as únicas ocorrências restantes são benignas e intencionais — 1× `super_admin` (mensagem de recusa no `Login.jsx`) e 1× `"/admin"` (rota que redirecciona para `/login`). Armadilha evitada: o primeiro `grep -l` deu falso positivo (`Super Admin` aparece em 3 sítios do bundle ANTIGO em cache); o rebuild confirma que o bundle actual ainda era o antigo — a varredura válida foi feita após rebuild com `touch` forçado. `vite build` do `admin-frontend/` OK (1.63s); `node --check` em `backend/src/routes/admin.js` e `adminOriginCheck.js` OK; `backend/src/routes/admin.js` intacto (12 `router.*`) — a API de admin não foi tocada.
- Nota: `git stash`/`pop` usado a meio para comparar bundle antigo vs novo correu sem perda (working tree restaurada, 7 ficheiros); `frontend/dist/` continua fora do git (ignorado) — o grep foi feito no disco, não no histórico.
- Segue-se: Fase 0-B.3 (prova funcional do cancelamento com PIN). **Publicada em `cbf2e1a`** (`git ls-remote` confirma `origin/main = cbf2e1a`).

### [2026-09-18] — Fase 0-C.1: PC do balcão estacionado no Hub (fim do bug "Vendas volta a Visão Geral")
- Causa do bug reportado pelo fundador (login owner `Wendy1313$` -> clicar Vendas/POS -> volta a Visão Geral): `CRMLayout.jsx` mostrava `Vendas / POS -> /pos` a toda a gente, mas `App.jsx` guardava `/pos` com `requiredRole="cashier"`; `ProtectedRoute` fazia `owner != cashier -> wrong-role -> /owner`. Não era a senha — era o guarda a funcionar como escrito.
- Alterações: `CRMLayout.jsx` passa a consciente de role (`/api/auth/me`): cashier vê só `Caixa -> Vendas / POS`; owner vê `Visão Geral`, `Caixistas (Hub do Balcão)`, `Stock` (link corrigido, antes apontava para `/owner`), `Onboarding`, gestão. Novo `frontend/src/components/PosGate.jsx`: cashier -> POS directo; owner -> redirect para `/owner/cashiers` (Hub estilo Netflix, a construir na Fase 0-C.2); anónimo -> `/login`. Rota `/pos` no `App.jsx` passa a `<PosGate />` (sem `ProtectedRoute` directo).
- Porquê assim e não "abrir /pos ao owner": o modelo aprovado pelo fundador diz que o owner NÃO vai directo ao POS — vai ao Hub, escolhe perfil do caixista + senha, vende, fecha turno para sair; voltar ao menu owner só com senha do owner.
- Verificação (output real): `vite build` OK; login real owner (`Wendy1313$`) -> `/api/auth/me` = `role=owner`; sem sessão -> 401; decisão PosGate simulada: owner->HUB, cashier->POS, anon->LOGIN, super_admin->LOGIN; `PosGate.jsx` + `App.jsx` com PosGate confirmados servidos pelo vite em 5173 (HMR activo, sem restart).
- Segue-se: Fase 0-C.2 (Hub de Caixistas: endurecer `deactivate` com `tenant_id`, `reactivate`, reset password caixista, `verify-password` owner, sessão de turno + fecho obrigatório).

### [2026-09-18] — Fase 0-C.2: Hub de Caixistas Netflix + portas com senha + vendedor atribuído
- Backend `owner.js`: `deactivate` endurecido com `tenant_id` (era `update` só por `id` — cross-tenant); novos `reactivate`, `PUT /cashiers/:id/password` (bcrypt 12), `POST /cashiers/:id/operate` (audit OPERATE_AS_CASHIER), `GET /cashiers/:id/open-shift` (vendas de hoje sem fecho posterior = aberto), `POST /verify-password` (fechadura Hub->menu, sem trocar sessão). Todos com audit. `GET /cashiers` inalterado (só activos — Hub não mostra inactivos).
- Backend `sales.js`: novo campo opcional `seller_user_id`; owner via Hub pode indicar vendedor (validado na transacção: tem de ser cashier activo do mesmo tenant); cashier que tentar forjar é ignorado (usa o próprio id). `sale.cashier_user_id` = vendedor; `audit CREATE_SALE.user_id` = quem operou (dono); `new_value` leva `cashier_user_id` + `operated_by`. `GET /api/sales?cashier_id=` filtra por vendedor + inclui nome do caixista.
- Frontend: `Cashiers.jsx` reescrito (grelha de perfis, criar, entrar com senha do caixista via login de prova + operate, desactivar/reactivar, nova senha, voltar ao menu com senha do dono). Novo `utils/hubSession.js` (vendedor activo em sessionStorage). `PosGate.jsx` reescrito (owner sem vendedor -> Hub; owner com vendedor -> POS com banner + botão Sair que consulta open-shift e bloqueia sem fecho). `CashierDashboard` aceita `hubSeller` e envia `seller_user_id`.
- Provas reais (output): criar->operate->verify correcta `{ok:true}`->verify errada 401->reset pw->deactivate(false)->reactivate(true)->6 audits novos; venda owner-com-seller: `cashier_user_id=vendedor true`, `operated_by=dono true`, filtro inclui a nova, `open-shift={open:true,salesToday:2}`; ANTI-FORJA: cashier tentou seller=outro, gravado=próprio `true`. Limpeza: vendas de teste removidas, stock Arroz reposto a 35, vendedor desactivado, 24 sales / 1 cashier activo (estado igual ao inicial). `vite build` OK (3.31s); PosGate + Cashiers novos confirmados servidos em 5173.
- Nota: login com `Wendy1313$` deu 401 porque o restart com `SEED_DEMO_DATA=true` fez upsert da password do `.env` (rotação anterior) — comportamento esperado do seed, não regressão. Testes usaram a sessão existente + password do `.env` sem a imprimir.
- Segue-se: Fase 0-B.3 (prova funcional do cancelamento com PIN) ou barra de meta realtime + cascata do lucro real.

### [2026-09-18] — Passwords demo alinhadas (Wendy1313$) + causa raiz dos resets
- Ficheiros alterados: `backend/.env` (DEMO_ADMIN_PASSWORD, DEMO_OWNER_PASSWORD), `Oque ja fiz…txt`.
- Porquê: o seed demo faz UPSERT das contas demo no arranque com as passwords do .env — resets manuais (ex: OTP) eram sobrepostos. Alinhar o .env resolve.
- Prova: login admin+owner com Wendy1313$ = 200 + /me correcto (curl, backend 4000).
- Resultado: funcionou. Passwords demo estáveis em restarts.
- Segue-se: Fase 0-C.2 Hub de Caixistas (sessão de turno + senha do caixista/owner).

### [2026-09-18] — Fase 0-C.2 concluída: 3 bugs do Hub corrigidos + bug pré-existente de audit
- Ficheiros alterados: `backend/src/routes/owner.js`, `backend/src/routes/shift_closings.js`, `frontend/src/pages/Owner/Cashiers.jsx`, `frontend/src/pages/CashierDashboard.jsx`.
- **Bug 1 (troca de sessão):** `handleEnter` chamava `/api/auth/login` com a senha do caixista → substituía o cookie httpOnly do owner. Fix: novo `POST /api/owner/cashiers/:id/verify-password` (bcrypt, sem criar sessão, audit `VERIFY_CASHIER_PASSWORD[_FAIL]`); `handleEnter` nunca mais toca em `/api/auth/login`.
- **Bug 2 (open-shift furável):** comparava último fecho com início do dia — venda pós-fecho no mesmo dia não reabria o turno. Fix: `open` = existe venda de hoje posterior ao último fecho (`lastSale.created_at > closed_at`).
- **Bug 3 (deadlock de perfil):** `POST /api/shift_closings` gravava `cashier_user_id = req.user.userId` (owner em modo Hub) → `open-shift` do caixista nunca fechava. Fix: owner pode indicar `cashier_user_id` validado (caixista activo do tenant); caixista não pode forjar outro vendedor (anti-forja). Frontend `closeShift` envia `cashier_user_id: hubSeller.id`.
- **Bug 4 (descoberto nos testes, PRÉ-EXISTENTE):** `auditLog.new_value` é String no schema mas o `shift_closings.js` passava objecto cru → o audit falhava SEMPRE e o endpoint respondia 500 mesmo gravando o fecho. Fix: `JSON.stringify` (igual ao `sales.js`).
- Prova (teste E2E real contra backend vivo, 16/16 PASS): login owner → criar caixista → verify-password errada=401/certa=200 → **sessão continua owner** (`/api/auth/me` via cookie = role owner após operate) → venda com `seller_user_id` → open-shift true → fecho em nome do caixista (201) → open-shift false → venda pós-fecho → open-shift true (re-bloqueia) → caixista não consegue fechar em nome de outro (ignora campo) → limpeza (caixista desactivado).
- Limpeza: `backend/dev.db` órfã + `create_superadmin.mjs`, `test_bcrypt.mjs`, `tmp_set_admin_pw.js`, `dev.db.backup.*` movidos para `~/genesis-backup-20260918/orfaos/`.
- Segue-se: Fase 0-C.3 (banner/UX do Hub já no PosGate; a seguir Meta realtime + cascata de lucro real) — ou prioridade do fundador.
