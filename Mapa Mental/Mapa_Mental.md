# Mapa Mental — Genesis

Fonte única de verdade do estado real do repositório. Actualizado em cada sessão.

---

## Parte A — ESTADO ACTUAL

Actualizado: 18 de Setembro de 2026 (Fases 0.4-H e 0-B.1 — expurgo de histórico, segredos e `.gitignore`)

### Identidade
| Item | Valor | Estado |
|---|---|---|
| Nome do produto | Genesis | ✅ CONFIRMADO (regra; grep de resíduos LucroCerto/GESTÃO INTELIGENTE MZ ainda ⚠️ NÃO VERIFICADO nesta sessão) |
| Moeda interna | centavos inteiros (MZN) | ✅ CONFIRMADO nos formulários que **enviam** dinheiro (`frontend/src/utils/money.js`). Debts/Goals/Suppliers.jsx não POST-am valores. `setup.fixedCosts` no onboarding ainda não vai para a API. |
| Frontends | `frontend/` (Owner/Cashier) + `admin-frontend/` (Super Admin) | 🔴 Separação física incompleta (ficheiros admin ainda em `frontend/`) |

### Frontend — arranque e rotas
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| `frontend/src/main.jsx` | Ponto de entrada Vite. Importa `./App.jsx` (não `pages/App.jsx`). | ✅ CONFIRMADO FUNCIONAL | 13/09/2026 — leitura directa do ficheiro: `import App from './App.jsx';` |
| `frontend/src/App.jsx` | Router único da app Owner/Cashier. Envolve `/owner/*`, `/onboarding`, `/cashier`, `/pos` em `ProtectedRoute`. Redirecciona `/admin` e `/super-admin` para `/login`. Ainda importa `AdminLogin` e `AdminDashboard` (código admin no bundle). | ✅ CONFIRMADO FUNCIONAL para protecção de rotas; 🔴 ainda contém rotas/imports de admin (Fase 1) | 13/09/2026 — leitura integral do ficheiro |
| `frontend/src/pages/App.jsx` | Cópia residual. No último commit (`HEAD`) era a versão **sem** ProtectedRoute (`/admin`, `/owner`, `/pos` abertos). Na working tree tinha sido copiado por cima da versão protegida, o que mascarava o problema. | ❌ NÃO EXISTE AINDA (apagado nesta sessão; era o objectivo) | 13/09/2026 — `test ! -f frontend/src/pages/App.jsx` + `git show HEAD:frontend/src/pages/App.jsx` mostrou rotas sem ProtectedRoute |
| `frontend/src/components/ProtectedRoute.jsx` | Verifica `/api/auth/me`, loading/unauthorized/wrong-role | ✅ CONFIRMADO (auditoria 13/09; não reaberto nesta sessão) | auditoria ficheiro a ficheiro 13/09 |
| `frontend/src/pages/AdminLogin.jsx` | Login Super Admin no bundle principal | 🔴 CONHECIDO COMO QUEBRADO (violação de separação física) | auditoria 13/09 |
| `frontend/src/pages/SuperAdmin/Dashboard.jsx` | Dashboard Super Admin no bundle principal | 🔴 CONHECIDO COMO QUEBRADO (violação de separação física) | auditoria 13/09 |
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
| `frontend/src/pages/Login.jsx` | 🔴 Tinha as **passwords pré-preenchidas** no formulário do site principal (owner, cashier e super_admin) | ✅ CORRIGIDO 18/09 (password começa vazia) | 18/09/2026 — `git grep` = 0 |
| `admin-frontend/src/App.jsx` | 🔴 Tinha a password do Super Admin pré-preenchida no formulário | ✅ CORRIGIDO 18/09 | 18/09/2026 — `git grep` = 0 |
| `test.sh`, `backend/scripts/*` (6), `docs/curl_collection.sh`, `docs/postman_genesis_collection.json` | Usam a mesma password demo em texto claro | 🔴 CONHECIDO COMO QUEBRADO | 18/09/2026 — grep: 11 ficheiros |
| `frontend/src/App.jsx` (linhas 4 e 8) | Importa `AdminLogin` e `AdminDashboard` → código admin **compilado no bundle principal** | 🔴 CONHECIDO COMO QUEBRADO (violação SECÇÃO 12.2.4) | 18/09/2026 — grep no `App.jsx`; `SuperAdmin/Dashboard.jsx` = 188 linhas |
| `admin-frontend/` | Projecto Super Admin separado, porta 5175, **auto-contido** (`src/App.jsx` 344 linhas, sem imports do `frontend/`) | ✅ CONFIRMADO FUNCIONAL (estrutura) | 18/09/2026 — leitura integral de `App.jsx`, `main.jsx`, `vite.config.js` |
| `backend/src/routes/sales.js` | Cancelamento com PIN + restauro de stock, reescrito de SQL cru → ORM | ⚠️ NÃO VERIFICADO (sintaxe OK; **sem prova funcional**) | 18/09/2026 — `node --check` OK; commitado por outro agente sem registo no Mapa |

### Roadmap — o que falta (não fazer nesta sessão)
- **Fase 0.1** — dois `App.jsx` → feita (commitada em `f58b30b` por outro agente).
- **Fase 0.2** — conversão ×100 nos forms que enviam dinheiro → feita (commitada em `f58b30b`).
- **Fase 0.3** — fórmula relatório mensal → feita; testes 6/6 PASS (commitada em `f58b30b`).
- **Fase 0.4-H** — resíduos + `.gitignore` + expurgo de histórico → feita localmente; **`force-push` pendente de autenticação** (o credential helper do VS Code não resolve fora da UI).
- **Fase 0-B.1** — passwords demo fora do código + seed opt-in + expurgo dos literais e dos `.swp` → feita e verificada (ver Parte B).
- **Pendente: `force-push` + rotação** — `origin/main` continua na história antiga (dev.db, logs, passwords).
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
