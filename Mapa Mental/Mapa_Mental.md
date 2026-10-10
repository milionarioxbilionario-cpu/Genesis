# Mapa Mental — Genesis

Fonte única de verdade do estado real do repositório. Actualizado em cada sessão.

---

## Parte A — ESTADO ACTUAL

Actualizado: 3 de Outubro de 2026 (Genesis 2.0 — RLS real, terminal POS com PIN, design system novo)

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
| `backend/src/routes/sales.js` | Venda (preço = catálogo, idempotente por id, erros 4xx com `code`) + cancelamento com PIN (falhas gravadas FORA da transacção; 3/venda → 423; 5/loja/15 min → 429) | ✅ CONFIRMADO FUNCIONAL | 03/10/2026 — `node scripts/verify_security_fixes.js 3 4 6` contra Postgres real |

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

### Correcções de segurança — 03/10/2026 (prova: `backend/scripts/verify_security_fixes.js`, 6 secções, contra servidor real + Supabase)
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| Senha exposta no GitHub (`[SENHA-REMOVIDA]`) | Removida dos ficheiros versionados. **Ainda válida em 3 contas** (super_admin, owner demo, kleyton) e presente no histórico do git | 🔴 CONHECIDO COMO QUEBRADO até o fundador rodar as senhas e limpar o histórico | 03/10/2026 — bcrypt.compare contra as 18 contas: 3 aceitam |
| `backend/src/utils/tokens.js` | Fonte única de emissão de tokens; claims `pv` (versão da senha) e `scope` | ✅ CONFIRMADO FUNCIONAL | 03/10/2026 — secções 2 e 7 |
| `backend/src/utils/kioskScope.js` + `middleware/auth.js` | Sessão `kiosk` do PC do balcão só chega às rotas do POS/Hub (403 KIOSK_RESTRICTED) | ✅ CONFIRMADO FUNCIONAL | 03/10/2026 — secção 2 (9 rotas do dono bloqueadas; POS funciona; refresh mantém o modo) |
| `backend/src/routes/owner.js` `/kiosk/enter`, `/kiosk/exit` + rate limit em verify-password/unlock-shift | Entrar/sair do modo balcão; força bruta da senha do dono → 429 | ✅ CONFIRMADO FUNCIONAL | 03/10/2026 — secção 2 |
| `frontend/src/pages/Hub.jsx`, `components/ProtectedRoute.jsx` | Hub activa o modo balcão; sessão kiosk em página do dono → volta ao /hub | ✅ build OK; ⚠️ NÃO VERIFICADO no browser | 03/10/2026 — `vite build` |
| `backend/src/routes/products.js` `PATCH /:id/stock` | Só owner; increment atómico com guarda; auditoria STOCK_ADJUSTMENT | ✅ CONFIRMADO FUNCIONAL | 03/10/2026 — secção 5 (incl. 5 ajustes em paralelo) |
| `backend/src/utils/sessionUser.js` + `middleware/auth.js` + `routes/refresh.js` | Cada pedido/refresh valida conta activa + senha actual (pv); logout apaga access e refresh | ✅ CONFIRMADO FUNCIONAL | 03/10/2026 — secção 7 |
| `backend/src/utils/prisma.js` | Timeout das transacções 45 s (antes 5 s: ~1,2 s/query → TODAS as vendas davam 500) | ✅ CONFIRMADO FUNCIONAL | 03/10/2026 — venda 201 em Postgres real |
| `frontend/src/db/localDb.js` (v6), `utils/syncPolicy.js`, `utils/offlineQueue.js`, `hooks/useOfflineSync.js` | Fila offline com `sync_state` (o booleano lançava DataError e nada sincronizava); id fixo por venda; só rede/5xx vão para a fila; recusas visíveis | ✅ CONFIRMADO FUNCIONAL (lógica); ⚠️ NÃO VERIFICADO no browser | 03/10/2026 — `node --test tests/offline_queue.test.mjs` 8/8 + secção 6 ponta-a-ponta |
| `backend/src/routes/shrinkage_records.js`, `demand_captures.js` | Idempotentes por id; atómicos; só regras de negócio são 4xx (BD em baixo = 500) | ✅ CONFIRMADO FUNCIONAL | 03/10/2026 — secção 6 |
| RLS no Postgres | `postgres` tem `rolbypassrls=true`, nenhuma tabela com FORCE | 🔴 CONHECIDO COMO QUEBRADO (decorativo) | 03/10/2026 — consulta a pg_roles/pg_class |

### Genesis 2.0 — 03/10/2026 (prova: `scripts/verify_system.js` 13 secções + browser real `frontend/tests/e2e/flows.mjs` e `admin-frontend/tests/admin_flows.mjs`)
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| RLS Postgres (`prisma/rls_v2.sql`, papel `genesis_app`, `utils/prisma.js` cliente sistema/aplicação + AsyncLocalStorage) | Isolamento entre lojas aplicado pela BD (antes decorativo: `postgres` tem bypassrls) | ✅ CONFIRMADO FUNCIONAL | 03/10 — secção 13 + toda a bateria a correr com RLS activo (129 OK) |
| Terminal POS (`routes/pos.js`, `utils/terminals.js`, `middleware/terminalAuth.js`, `middleware/posWriteAuth.js`, `pages/pos/*`) | Emparelhamento por código + PIN do caixista; a conta do dono sai do balcão. Substitui Hub/quiosque/device keys (removidos) | ✅ CONFIRMADO FUNCIONAL | 03/10 — secção 2 + browser (emparelhar, PIN, vender, offline, fecho cego) |
| Descontos (`routes/sales.js`, `routes/settings.js`) | Até X% livre (10% por omissão), acima exige PIN do dono; falhas gravadas e bloqueadas | ✅ CONFIRMADO FUNCIONAL | 03/10 — secção 8 + browser |
| Custos fixos / renda (`routes/settings.js`, onboarding) | A renda passa a ser registada e deduzida no lucro líquido | ✅ CONFIRMADO FUNCIONAL | 03/10 — secção 9 + browser (cascata mensal) |
| Exposição do caixista (`products`, `sales`, `dashboard`, `inventory`) | Caixista sem custos, sem vendas de outros, sem dashboard financeiro | ✅ CONFIRMADO FUNCIONAL | 03/10 — secção 10 |
| Painel admin (`routes/admin.js` + `admin-frontend`) | asyncHandler (erro não derruba o servidor), aprovações só em pendentes, reactivar repõe estado anterior, modo suporte só leitura, métricas | ✅ CONFIRMADO FUNCIONAL | 03/10 — secção 11 + browser admin |
| Trial (`utils/tenantStatus.js`, `middleware/auth.js`) | Trial expirado = só leitura (402) | ✅ CONFIRMADO FUNCIONAL | 03/10 — secção 12 |
| Sessão que cai (`utils/api.js`, `App.jsx`) | Refresh automático; mensagem com o motivo; terminal volta ao PIN | ✅ build + lógica; ⚠️ cenário de senha mudada não percorrido no browser | 03/10 |
| Design system (`ui/tokens.css`, `tailwind.config.js`, `components/ui/*`) | Tema único grafite + verde-esmeralda; tema escuro, animações e Printer3D removidos | ✅ CONFIRMADO (build + revisão visual de 25 capturas, desktop e 390 px) | 03/10 |
| Ecrãs do dono (`layouts/AppShell.jsx`, `pages/owner/*`) | Início, Vendas, Produtos, Fornecedores, Chenecas, Equipa, Relatórios, Definições, Onboarding | ✅ abertos no browser sem erros de JS; ⚠️ onboarding de 5 passos não percorrido no browser | 03/10 |
| Senha exposta no GitHub | Removida dos ficheiros; contas ainda por rodar | 🔴 CONHECIDO COMO QUEBRADO até o fundador rodar as senhas | 03/10 |
| Inglês (especificação 6.10) | O i18n antigo (só login) foi removido; a app está só em português | ❌ NÃO EXISTE AINDA | 03/10 |

### Genesis 2.1 — Fase 0 (03/10/2026, noite) — plano `~/.claude/plans/a-malha-entrou-dentro-effervescent-honey.md`
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| Onboarding (`pages/owner/Onboarding.jsx` + `routes/catalogs.js`) | 5 passos; categorias adicionais; catálogo com coluna de código de barras (Enter do leitor salta de linha; código repetido bloqueia); fornecedores no passo 4; explicação de cada passo | ✅ CONFIRMADO FUNCIONAL | 04/10 — `onboarding.mjs` 18/18, 0 erros JS; import inválido → 400 com produto e campo |
| Catálogo-mestre (`data/master_catalogs.json` → tabela `MasterCatalog`, colunas novas `barcode`/`image_url`) | 207 produtos: bottle store 43, restaurante 25, mercearia 31, padaria 25, talho 25, supermercado 58; preço sugerido com fonte ou "estimativa — confirmar" | ✅ CONFIRMADO (seed idempotente: 207 → 0) · ⚠️ 100 de 207 preços são estimativas · ⚠️ sem imagens (Open Food Facts quase não tem produtos moçambicanos) · ⚠️ 2 linhas antigas de teste em `mercearia` ("Cerveja 500ml", "Água 500ml") não apagadas | 04/10 — migração `20261004_catalogo_mz` aplicada |
| Formas de pagamento (`utils/paymentMethods.js`, `services/reports.js`, `utils/format.js`, `PosScreen.jsx`) | Dinheiro / M-Pesa / e-Mola / Cartão separados; `mobile_money` antigo continua aceite (vendas offline pendentes) e aparece como "M-Pesa/e-Mola (antigo)" | ✅ CONFIRMADO FUNCIONAL | 04/10 — `paymentMethods.test.js` 4/4; `pos.mjs`: venda gravada como `emola`, relatório separa M-Pesa e e-Mola |
| Imagens de produto (`components/ui/ProductImage.jsx`, `utils/imageResize.js`, `utils/productImage.js`, `routes/products.js`) | Foto do dono (câmara/ficheiro → WebP/JPEG ≤ 256 px, < 60 000 car., guardada no produto e portanto offline); sem foto → ícone da categoria | ✅ CONFIRMADO FUNCIONAL | 04/10 — `pos.mjs`: foto gravada `data:image/webp`, cartão com foto mostra `img`, sem foto mostra ícone |
| POS: leitor + atalhos (`pages/pos/PosScreen.jsx`) | Faixa com o código lido e o produto; código desconhecido avisa; F2 desconto, F3 recebido (volta a Dinheiro), F4 alterna pagamento, Ctrl+Enter cobra, Alt+1…9 categoria, setas na grelha, Esc pesquisa; legenda visível | ✅ CONFIRMADO FUNCIONAL | 04/10 — `pos.mjs` 21/21, 0 erros JS; `flows.mjs` 24/24 |
| Stock por lote e validades (`StockLot`, `utils/fefo.js`, `utils/stockLots.js`, `services/expiryJob.js`) | FEFO em todas as saídas; alerta X dias antes (Definições → Loja); perda automática no dia seguinte à validade; stock = soma dos lotes | ✅ CONFIRMADO FUNCIONAL | 04/10 — `verify_system.js 14` 27/27; completo 160/160; `stock.mjs` 3/3 |
| Relatórios 2.1 (`services/reports.js`, `services/restock.js`, `pages/owner/Reports.jsx`, `components/SaleDrawer.jsx`) | Diário: KPIs com perdas e resultado, % da meta no dia e acumulado, comparação com o dia anterior, mais vendido vs mais rentável, rastreio ao segundo (vendas → recibo, perdas com código e validade, cancelamentos, stock, chenecas, fechos, pedidos em falta). Semanal: dia a dia (clique → diário), melhor/pior dia, restock 7 dias. Mensal: mês anterior, semanas, a crescer/a cair, chenecas novas/recebidas/em aberto, metas de 12 meses, restock 30 dias + "não reforçar", perdas à parte | ✅ CONFIRMADO FUNCIONAL | 04/10 — `verify_system.js 15` 34/34; completo 194/194; `reports.mjs` no browser |
| Despesas avulsas (`Expense`, `routes/settings.js` `/expenses`, `services/monthlyDeductions.js`, `services/reports.js`, `pages/owner/Settings.jsx` → Custos e despesas) | Despesa com data, categoria (sugerida ou escrita pelo dono), descrição e valor em centavos; entra em `total_expenses` e no lucro líquido do mês; linha na cascata do mensal + por categoria; no rastreio como "Despesa" (só dia, sem hora) | ✅ CONFIRMADO FUNCIONAL | 04/10 — `monthlyDeductions` 8/8; `verify_system.js 16` 23/23 (RLS, 403 caixista, futuro=400, auditoria); `fase5.mjs` 9/9, 0 erros JS |
| Lista de compras (`ShoppingList`/`ShoppingListItem`, `routes/shoppingLists.js`, `services/shoppingList.js`, `pages/owner/ShoppingLists.jsx` → Produtos → Lista de compras) | Gerar da recomendação (7/14/30 dias) ou à mão; fornecedor; investimento + entrega = total; guardar; "Enviar por WhatsApp" abre `wa.me/258…` com produtos e quantidades (sem custos) e marca "Enviada"; "Recebida" fica só de leitura e **não** mexe no stock (entrada continua em Stock) | ✅ CONFIRMADO FUNCIONAL | 04/10 — `shoppingList.test.js` 5/5; `verify_system.js 17` 25/25; `fase5.mjs` 16/16, 0 erros JS; captura 390 px sem scroll |
| Fecho do mês (`Tenant.month_close_day`, `services/monthClose.js`, `routes/owner.js` `/month-close`, `components/MonthCloseDialog.jsx`, Definições → Loja) | A partir do dia do fecho (1–28), o 1.º acesso do dono mostra o mês anterior (receita, lucro líquido, despesas, perdas, meta) + lista sugerida 30 dias; "Contactar fornecedor agora" (WhatsApp, lista Enviada) ou "Agora não" (lista em rascunho); visto em `MONTH_CLOSE_SEEN` por mês; X adia só a sessão; loja criada este mês não vê | ✅ CONFIRMADO FUNCIONAL · ⚠️ caminho "Agora não" provado só pela API (não percorrido no browser) · ❌ envio automático do relatório para o WhatsApp do dono (exige Twilio) | 04/10 — `monthClose.test.js` 6/6; `verify_system.js 18` 15/15; `fecho_mes.mjs` 10/10, 0 erros JS |
| Alojamento (`deploy/*`) — **produção em https://genesismz.com e https://admin.genesismz.com** | Akamai/Linode Frankfurt (`139.162.186.49`, Ubuntu 24.04, Nanode 1 GB) + Node 22 + nginx + Let's Encrypt (renova sozinho); backend systemd em 127.0.0.1:4000; ufw 22/80/443; SSH só com chave (`~/.ssh/genesis_do`); IP real do cliente atrás da Cloudflare (`/etc/nginx/conf.d/cloudflare-realip.conf`); publicação `APP_HOST=genesismz.com ADMIN_HOST=admin.genesismz.com bash deploy/publicar.sh 139.162.186.49` | ✅ CONFIRMADO FUNCIONAL (atrás da Cloudflare desde 05/10: `server: cloudflare`, ponto JNB, IP real do cliente no log do nginx) | 05/10 — `verify_system` no servidor 238/238 em 21 s (Maputo: ~20 min); browser contra o site público: `flows.mjs` e `reports.mjs` passaram, 0 erros JS; TCP até ao Supabase 5 ms (Maputo 340–700 ms) |
| `run-local.ps1` / `run-local.bat` / `run-admin.bat` | Arranque Windows: abre `/entrar`; espera até 150 s pelo backend; se falhar mostra o log e sai com erro; o `.bat` fica aberto em erro | ✅ CONFIRMADO FUNCIONAL | 04/10 — arranque real exit 0 (7 s); BD inexistente → "FALHOU" + exit 1 |
| `backend/src/utils/dbEngine2.js` | Sondagem do Postgres com 3 tentativas antes de cair para SQLite | ✅ CONFIRMADO FUNCIONAL | 03/10 — host inexistente: 3 tentativas + recusa em 4 s; rede real: 1.ª falhou, 2.ª OK → postgresql |
| `backend/src/utils/prisma.js` | `connect_timeout=30` e `pool_timeout=30` acrescentados aos URLs | ✅ CONFIRMADO FUNCIONAL | 03/10 — bateria completa com 0 erros de ligação no log |
| Ligações à BD (Supabase) | `DATABASE_URL` e `APP_DATABASE_URL` passaram à porta **6543** (pooler em modo transacção; `DIRECT_URL` fica na 5432 para migrações) | ✅ CONFIRMADO FUNCIONAL | 03/10 — `verify_system.js` todas as secções OK; `flows.mjs` 24/24; `onboarding.mjs` 8/8; 0 erros P1001/P2024/EMAXCONN no log |
| `DB_ALLOW_SQLITE_FALLBACK` no `.env` | Passou a `false` (decisão do fundador 03/10): sem Postgres o servidor recusa arrancar em vez de servir de outra base | ✅ CONFIRMADO | 03/10 — leitura do `.env` após a alteração; backup em `~/genesis-backup-20261003/` |

### Fase 7.1 — turno e lista de vendas no terminal (09/10/2026) — **publicado em genesismz.com (`8f9b348`, 09/10)**
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| `backend/src/utils/shift.js` (`shiftStatus`) | Estado explícito do turno: aberto se nunca houve fecho ou se há `SHIFT_OPENED` (auditoria) depois do último fecho; fechado depois de um fecho aceite. Fechar um turno fechado → 409 `NO_OPEN_SHIFT` | ✅ CONFIRMADO FUNCIONAL | 09/10 — `verify_system.js` 271/271 (secção 2) |
| `backend/src/routes/sales.js` (POST) | Caixista com turno fechado não vende (409 `SHIFT_CLOSED`); excepção: venda offline com `created_at` do terminal anterior ao fecho | ✅ CONFIRMADO FUNCIONAL | 09/10 — secção 2 |
| `backend/src/routes/sales.js` (GET) + `utils/sessionScopes.js` | `GET /api/sales` recusado ao caixista (403) e retirado do âmbito `pos` | ✅ CONFIRMADO FUNCIONAL | 09/10 — secção 10 |
| `backend/src/routes/pos.js` `POST /shift/open`, `POST /sales` | Abrir turno novo e ver as últimas vendas (só as dele, sem custos) exigem o PIN de autorização do dono; auditoria `SHIFT_OPENED` / `SALES_VIEWED`; perfis com `shift_open` | ✅ CONFIRMADO FUNCIONAL | 09/10 — secções 2 e 10 + browser |
| `backend/src/utils/authPin.js` | Verificação única do PIN do dono; falhas (`SHIFT_OPEN_PIN_FAIL`, `SALES_VIEW_PIN_FAIL`) partilham o limite de 5/loja/15 min com cancelamentos e descontos | ✅ CONFIRMADO FUNCIONAL | 09/10 — secções 2, 3, 8, 10 |
| `frontend/src/pages/pos/PosScreen.jsx`, `PosDialogs.jsx`, `Terminal.jsx` | Faixa "Turno fechado" + "Abrir turno novo" (PIN do dono); produtos desactivados; "Vendas" pede o PIN antes da lista; perfis mostram "Turno aberto/fechado"; o cadeado é pausa | ✅ CONFIRMADO FUNCIONAL | 09/10 — `flows.mjs` todos os fluxos passaram (32 OK), capturas 28/28b/29 revistas |
| `PosDialogs.jsx` `CloseShiftDialog` | Antes de contar envia a fila offline; com vendas ainda por enviar recusa o fecho com explicação (evita o falso "abaixo do esperado" no turno seguinte e a tentativa falhada/bloqueio) | ✅ CONFIRMADO FUNCIONAL | 09/10 — `flows.mjs` (captura 28b) |
| Aviso "Sem ligação: a usar o catálogo guardado" | Não desaparecia quando a rede voltava — corrigido na Fase 7.3 (ver abaixo) | ✅ CORRIGIDO (local) | 09/10 — `flows.mjs` |

### Fase 7.2 — QR dos recibos e pesquisa sem acentos (09/10/2026) — **publicado em genesismz.com (`8f9b348`, 09/10)**
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| `backend/src/routes/verify.js` (`GET /api/verify/:saleId`, público) | Confirma que o recibo existe e se a venda está concluída ou cancelada; só devolve o que já está impresso (loja, n.º, data, artigos, total, pagamento) — sem custos, caixista nem ids; UUID validado (400), inexistente 404, 60/IP/15 min, `Cache-Control: no-store` | ✅ CONFIRMADO FUNCIONAL | 09/10 — `verify_system.js 19` 8/8 |
| `frontend/src/pages/VerifyReceipt.jsx` + rota `/verify/:saleId` | Página pública aberta pelo QR: "Recibo autêntico" / "Venda cancelada" / "Recibo não encontrado" (com nota sobre vendas offline ainda por enviar) | ✅ CONFIRMADO FUNCIONAL | 09/10 — `flows.mjs` (sem sessão, 390 px, captura 24b revista) |
| QR (`receiptPrinter.js` `saleVerifyUrl`, `PosDialogs.jsx`) | O QR aponta para a origem da app + `/verify/<id>` (antes `genesis.co.mz`, domínio que não é nosso) | ✅ CONFIRMADO no diálogo do recibo (pixel a pixel + contraprova); ⚠️ talão impresso (Web Serial/print) não percorrido — usa a mesma função | 09/10 — `flows.mjs` |
| `frontend/src/utils/search.js` (POS, escolha de produto na quebra/pedido, Produtos do dono) | Pesquisa sem acentos nem maiúsculas ("acucar" → "Açúcar") | ✅ CONFIRMADO FUNCIONAL | 09/10 — `search.test.mjs` 4/4; `pos.mjs` ("agua" → só "Água Namaacha 1,5L") |
| `genesis.co.mz` ainda no código | `routes/admin.js:106-108` (email inventado na aprovação — item da lista de 06/10) e seed demo opt-in em `index.js` | ⚠️ por tratar (fora desta fase) | 09/10 — grep |

### Fase 7.3 — defeitos pequenos (09/10/2026) — **local, ainda NÃO publicado em genesismz.com**
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| `frontend/src/pages/pos/PosScreen.jsx` (catálogo guardado) | Com o catálogo em cache e rede disponível, volta a pedir o catálogo (logo e de 30 em 30 s); o aviso "Sem ligação: a usar o catálogo guardado" sai sozinho | ✅ CONFIRMADO no ponto da captura 29 (`flows.mjs`: com rede, sem aviso) · ⚠️ a verificação passa também se o aviso nunca chegar a aparecer; a contraprova é a captura 29 da versão anterior (mesmos passos, aviso visível) | 09/10 — `flows.mjs` todos os fluxos |
| `admin-frontend/src/App.jsx` (modo suporte) | O separador abre no próprio toque (antes do pedido) e recebe o link depois; se o browser bloquear, aparece "Tocar aqui para abrir o modo suporte" | ✅ CONFIRMADO no Chromium (normal + bloqueio simulado) · ⚠️ NÃO VERIFICADO no Safari do iPhone (fundador) | 09/10 — `admin_flows.mjs` 7/7 |
| `backend/src/routes/admin.js` (aprovar pedido) | Email do pedido já com conta → 409 `EMAIL_IN_USE`, pedido continua pendente, nenhuma conta criada (antes inventava `<nome>.<hora>@genesis.co.mz`) | ✅ CONFIRMADO FUNCIONAL | 09/10 — `verify_system.js 11` |
| Pedido **sem** email | Continua a gerar um login `<loja>@genesis.co.mz` (domínio que não é nosso; o reset de senha nunca lhe chega) | ⚠️ DECISÃO DO FUNDADOR em aberto: tornar o email obrigatório no pedido, ou outro identificador | 09/10 — leitura |

### Fase 8.1 — iPhone: PDF dos relatórios, recibo sem janela nova, ranking por níveis (10/10/2026) — **local, ainda NÃO publicado em genesismz.com**
| Caminho | O que faz | Estado | Última verificação |
|---|---|---|---|
| `backend/src/services/ranking.js` + `services/reports.js` (`top_products`, `top_profitable`) | Ranking por níveis (decisão do fundador 10/10): empates partilham o lugar; até 3 níveis; nunca o nível mais baixo, excepto se só houver um; no lucro só entram valores > 0. Antes: ordenar e cortar em 10 | ✅ CONFIRMADO FUNCIONAL | 10/10 — `ranking.test.js` 6/6; `fase8_1.mjs`: venda 3/2/1/1 → API e ecrã com 2M (1.º) e Coca-Cola (2.º); lucros 66/34/30/15 → 3 lugares sem Sumol |
| `frontend/src/utils/pdf/{deliver,text,receiptPdf,reportPdf}.js`, `components/{PdfButton,PdfReadyDialog}.jsx`, `utils/timelineText.js` | PDF gerado no browser (jsPDF 4.2.1 + autotable 5.0.8, carregados só no clique). Telemóvel/tablet (toque ou app do ecrã principal): folha de partilha do sistema (imprimir, Ficheiros, WhatsApp); se o iPhone recusar por o toque já não estar "fresco" → diálogo "PDF pronto" com novo toque. Computador: descarga. Nomes: `Relatório diário - <Loja> (DD-MM-AAAA).pdf`, `Recibo_<n> - <Loja> (DD-MM-AAAA - HH-MM-SS).pdf` (`:` não é válido em nomes de ficheiro) | ✅ CONFIRMADO no Chromium (descarga + partilha emulada) · ⚠️ NÃO VERIFICADO no iPhone real (folha de partilha a sério) | 10/10 — `fase8_1.mjs` 32/32; PDF diário e talão desenhados com pdf.js e revistos à vista |
| `frontend/src/pages/owner/Reports.jsx` | Botão "PDF / imprimir" em cada separador (substitui `window.print()`, que não faz nada na app do ecrã principal do iPhone); o PDF leva o rastreio do período (até 1000 movimentos) | ✅ CONFIRMADO FUNCIONAL (Chromium) | 10/10 — `fase8_1.mjs`, `reports.mjs` |
| `frontend/src/utils/receiptPrinter.js` + `PosDialogs.jsx` + `SaleDrawer.jsx` | Recibo: telemóvel/tablet → PDF de talão (80 mm) pela partilha; computador → impressora série (se houver) ou impressão numa moldura escondida na própria página. **Nunca abre janela nova** (antes `window.open` prendia o utilizador na app do ecrã principal, sem botão de voltar) | ✅ CONFIRMADO no Chromium · ⚠️ NÃO VERIFICADO no iPhone real | 10/10 — `fase8_1.mjs` (0 janelas novas em tablet, PC e iPhone emulado) |
| Grelhas dos ecrãs do dono (`Reports`, `Home`, `Products`, `Settings`, `Onboarding`) | `grid-cols-1` no telemóvel: uma tabela larga esticava os Relatórios para 426 px num ecrã de 390 → o telefone afastava o zoom e o rodapé das gavetas (botões do recibo) ficava abaixo do ecrã visível | ✅ CONFIRMADO nos Relatórios (diário/semanal/mensal cabem em 390 px) · ⚠️ restantes ecrãs corrigidos por precaução, sem medição com dados largos | 10/10 — `fase8_1.mjs` |
| `vite.config.js` (workbox `globIgnores`) | As partes opcionais do jsPDF (html2canvas, DOMPurify, canvg ≈ 380 KB) não entram na cache offline; o gerador (≈ 420 KB) entra, para recibos offline | ✅ CONFIRMADO | 10/10 — `dist/sw.js` sem esses ficheiros; `index.html` só pré-carrega o índice |
| `window.open('')` em `ShoppingLists.jsx:79` e `MonthCloseDialog.jsx:68` (WhatsApp) | Mesmo padrão de janela em branco; na app do ecrã principal do iPhone pode prender como o recibo | ⚠️ NÃO VERIFICADO (fora desta mini-meta) | 10/10 — grep |

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
- Causa do bug reportado pelo fundador (login owner `[SENHA-REMOVIDA]` -> clicar Vendas/POS -> volta a Visão Geral): `CRMLayout.jsx` mostrava `Vendas / POS -> /pos` a toda a gente, mas `App.jsx` guardava `/pos` com `requiredRole="cashier"`; `ProtectedRoute` fazia `owner != cashier -> wrong-role -> /owner`. Não era a senha — era o guarda a funcionar como escrito.
- Alterações: `CRMLayout.jsx` passa a consciente de role (`/api/auth/me`): cashier vê só `Caixa -> Vendas / POS`; owner vê `Visão Geral`, `Caixistas (Hub do Balcão)`, `Stock` (link corrigido, antes apontava para `/owner`), `Onboarding`, gestão. Novo `frontend/src/components/PosGate.jsx`: cashier -> POS directo; owner -> redirect para `/owner/cashiers` (Hub estilo Netflix, a construir na Fase 0-C.2); anónimo -> `/login`. Rota `/pos` no `App.jsx` passa a `<PosGate />` (sem `ProtectedRoute` directo).
- Porquê assim e não "abrir /pos ao owner": o modelo aprovado pelo fundador diz que o owner NÃO vai directo ao POS — vai ao Hub, escolhe perfil do caixista + senha, vende, fecha turno para sair; voltar ao menu owner só com senha do owner.
- Verificação (output real): `vite build` OK; login real owner (`[SENHA-REMOVIDA]`) -> `/api/auth/me` = `role=owner`; sem sessão -> 401; decisão PosGate simulada: owner->HUB, cashier->POS, anon->LOGIN, super_admin->LOGIN; `PosGate.jsx` + `App.jsx` com PosGate confirmados servidos pelo vite em 5173 (HMR activo, sem restart).
- Segue-se: Fase 0-C.2 (Hub de Caixistas: endurecer `deactivate` com `tenant_id`, `reactivate`, reset password caixista, `verify-password` owner, sessão de turno + fecho obrigatório).

### [2026-09-18] — Fase 0-C.2: Hub de Caixistas Netflix + portas com senha + vendedor atribuído
- Backend `owner.js`: `deactivate` endurecido com `tenant_id` (era `update` só por `id` — cross-tenant); novos `reactivate`, `PUT /cashiers/:id/password` (bcrypt 12), `POST /cashiers/:id/operate` (audit OPERATE_AS_CASHIER), `GET /cashiers/:id/open-shift` (vendas de hoje sem fecho posterior = aberto), `POST /verify-password` (fechadura Hub->menu, sem trocar sessão). Todos com audit. `GET /cashiers` inalterado (só activos — Hub não mostra inactivos).
- Backend `sales.js`: novo campo opcional `seller_user_id`; owner via Hub pode indicar vendedor (validado na transacção: tem de ser cashier activo do mesmo tenant); cashier que tentar forjar é ignorado (usa o próprio id). `sale.cashier_user_id` = vendedor; `audit CREATE_SALE.user_id` = quem operou (dono); `new_value` leva `cashier_user_id` + `operated_by`. `GET /api/sales?cashier_id=` filtra por vendedor + inclui nome do caixista.
- Frontend: `Cashiers.jsx` reescrito (grelha de perfis, criar, entrar com senha do caixista via login de prova + operate, desactivar/reactivar, nova senha, voltar ao menu com senha do dono). Novo `utils/hubSession.js` (vendedor activo em sessionStorage). `PosGate.jsx` reescrito (owner sem vendedor -> Hub; owner com vendedor -> POS com banner + botão Sair que consulta open-shift e bloqueia sem fecho). `CashierDashboard` aceita `hubSeller` e envia `seller_user_id`.
- Provas reais (output): criar->operate->verify correcta `{ok:true}`->verify errada 401->reset pw->deactivate(false)->reactivate(true)->6 audits novos; venda owner-com-seller: `cashier_user_id=vendedor true`, `operated_by=dono true`, filtro inclui a nova, `open-shift={open:true,salesToday:2}`; ANTI-FORJA: cashier tentou seller=outro, gravado=próprio `true`. Limpeza: vendas de teste removidas, stock Arroz reposto a 35, vendedor desactivado, 24 sales / 1 cashier activo (estado igual ao inicial). `vite build` OK (3.31s); PosGate + Cashiers novos confirmados servidos em 5173.
- Nota: login com `[SENHA-REMOVIDA]` deu 401 porque o restart com `SEED_DEMO_DATA=true` fez upsert da password do `.env` (rotação anterior) — comportamento esperado do seed, não regressão. Testes usaram a sessão existente + password do `.env` sem a imprimir.
- Segue-se: Fase 0-B.3 (prova funcional do cancelamento com PIN) ou barra de meta realtime + cascata do lucro real.

### [2026-09-18] — Passwords demo alinhadas ([SENHA-REMOVIDA]) + causa raiz dos resets
- Ficheiros alterados: `backend/.env` (DEMO_ADMIN_PASSWORD, DEMO_OWNER_PASSWORD), `Oque ja fiz…txt`.
- Porquê: o seed demo faz UPSERT das contas demo no arranque com as passwords do .env — resets manuais (ex: OTP) eram sobrepostos. Alinhar o .env resolve.
- Prova: login admin+owner com [SENHA-REMOVIDA] = 200 + /me correcto (curl, backend 4000).
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

### [2026-09-19] — Lote A: POS dedicado (sem sidebar do dono) + bloqueio REAL do perfil

**Causa raiz dos 4 bugs reportados pelo fundador**
- R1 Botao do Hub: `CRMLayout.jsx:71` apontava para `/owner/cashiers` (tabela feia). A pagina `Hub.jsx` (Netflix, dedicada) existia mas NAO estava ligada a nada.
- R2 Caixista ia a "Visao Geral": `PosGate.jsx` embrulhava o POS em `<CRMLayout>`. Em modo Hub o autenticado e o OWNER, logo o CRMLayout desenhava o menu completo do dono.
- R3 Bloqueio nao bloqueava: (a) o ecra de bloqueio era um modal SOBREPOSTO com o POS activo por baixo; (b) so aparecia ao clicar em "Fechar turno"; (c) tinha botao "Voltar ao Hub" (fuga); (d) `POST /api/sales` nao consultava o bloqueio -> continuava a vender.
- R4 "Valor esperado" a aumentar: `closingOpen/countedAmount/expectedAmount` (l.42-44) eram ESTADO MORTO. O valor a subir era o Troco (`changeGiven`).

**Alteracoes**
- NOVO `backend/src/utils/shiftLock.js` — `getShiftLock()`: 3 falhas apos ultimo `CASHIER_UNLOCKED` => bloqueado. Fonte unica de verdade.
- `backend/src/routes/sales.js` — bloqueia a venda (403 `statusCode`) quando o vendedor efectivo esta bloqueado. Import + `getShiftLock(tx, ...)` dentro da transaccao + tratamento de `err.statusCode` no catch.
- `backend/src/routes/owner.js` — `GET /cashiers` passa a devolver `locked/attempts/maxAttempts` e a NAO expor `password_hash` (a versao anterior devolvia o user completo, incluindo o hash).
- `frontend/src/layouts/CRMLayout.jsx` — "Caixistas - Hub do Balcao" -> `/hub`; menu completo do dono reposto (Produtos, Fornecedores, Trabalhadores, Chenecas, Relatorios, Metas, Definicoes, Chaves de Dispositivo); removido o duplicado "Painel do Dono".
- `frontend/src/components/PosGate.jsx` — REESCRITO: POS em ecra proprio, **sem `<CRMLayout>`** para `hub-seller` e `cashier`. `handleLeave` passa a checar `shift-state` (bloqueado / hasOpenSales).
- `frontend/src/pages/CashierDashboard.jsx` — estado morto removido; `locked/lockAttempts/operatorName`; verifica `shift-state` AO MONTAR (nao so ao clicar em Fechar turno); `submitSale` recusa quando bloqueado; overlay full-screen sem qualquer saida (so senha do dono); removido o botao "Voltar ao Hub" do ecra de bloqueio; botao "Sair do perfil"; header deixa de mostrar "Sergio Bila" hardcoded.
- `frontend/src/pages/Hub.jsx` — badge BLOQUEADO + contagem de erros; clicar num perfil bloqueado abre o gate do dono e desbloqueia; "+ Novo caixista" atras do gate do dono; inactivos nao entram.
- `frontend/src/App.jsx` — `/owner/cashiers` -> redirect `/hub`; rota em falta `/owner/device-keys` adicionada (antes dava ecra vazio).
- REMOVIDO `frontend/src/pages/Owner/Cashiers.jsx` (pagina feia) — decisao do fundador.

**Prova (REGRA 3)**
- E2E `/tmp/huba_test.mjs` contra backend vivo: **13 PASS / 0 FAIL**
  login owner -> criar caixista -> lista locked=false -> operate -> venda em dinheiro -> 3 falhas (locked=false,false,true) -> Hub ve BLOQUEADO(attempts=3) -> **venda RECUSADA 403** -> desbloqueio com senha do dono -> venda ACEITE 201.
- `npm run build` frontend: OK. Bundle contem `PERFIL BLOQUEADO`, `Hub do Balcao`, `Novo caixista`, `Sair do perfil`.
- `node --check` OK nos 3 ficheiros backend. `grep pages/Owner/Cashiers` = 0 referencias. PosGate sem import de CRMLayout.
- Portas 5173/5175/4000 -> 200.

**Pendente (Lotes B/C/D)**
- Lote B: desconto (manual + regras condicionais) — exige migracao `discount_amount` em `Sale`; recibo redesenhado (nome loja, localizacao, caixista, QR local sem CDN); numeracao diaria `VendaN-DD-MM-AAAA+HH:MM:SS` com reset a meia-noite.
- Lote C: notificacoes do dono (derivadas de AuditLog — sem migracao) + reimpressao de recibos antigos so com senha do dono.

### [2026-09-24] — Lote D2 (parte visual): motor de movimento, Login, Owner e POS refeitos
- Ficheiros alterados: `frontend/src/ui/animations.css`, `frontend/src/ui/primitives.css`, `frontend/src/components/ui/index.jsx`, `frontend/src/index.css`, `frontend/src/pages/Login.jsx`, `frontend/src/pages/CashierDashboard.jsx`, `frontend/src/pages/Owner/Dashboard.jsx`, e mais 11 paginas de Owner (`AuditLogViewer`, `Debts`, `DeviceKeys`, `Employees`, `Products`, `Settings`, `Stock`, `Suppliers`, `Reports/DailyReport`, `Reports/MonthlyReport`, `Reports/WeeklyReport`).
- Porquê: a interface tinha tres defeitos visiveis (emojis em vez de icones, cores escritas a mao dentro do codigo, e ecras sem hierarquia) e um **bug de dinheiro real** no POS.
- **Bug de dinheiro (corrigido):** `CashierDashboard.jsx` linha 777 tinha `style={{ color: {...} }}` (um objeto dentro de `color`, invalido) e calculava o desconto com os operandos trocados — imprimia `-MZN -50,00` em vez de `-MZN 50,00`. Passou a `money(subtotalAmount - totalAmount)`.
- Alteracoes:
  - `ui/animations.css` — nova seccao 7 "Efeitos de assinatura": recibo 3D (`g-receipt-feed` com `perspective`/`rotateX`), spotlight que segue o rato (`.g-track`), loops ambientes (auroras, grelha a derivar, scanline).
  - `components/ui/index.jsx` — `Card` passou a `forwardRef`; novas pecas `usePointerGlow`, `GlowCard`, `AmbientLayer`, `Receipt3D`, `SheenBar`; `StatCard` passou a reagir ao rato.
  - `pages/Login.jsx` — ecra deixou de ser um cartao centrado com um cadeado gigante: passou a layout split (painel de valor a esquerda em desktop, cartao glass a direita), com `AmbientLayer`, `SheenBar` e spotlight.
  - `pages/Owner/Dashboard.jsx` — 9 emojis -> icones lucide; cartoes de grafico com `GlowCard`; cores do recharts passaram a tokens (`var(--brand)`, `var(--info)`, `var(--border)`).
  - `pages/CashierDashboard.jsx` — ecrãs de bloqueio e de fecho de turno reescritos com classes CSS em vez de `style={{}}` com hex; emojis `🔒`/`💰` eliminados; recibo pos-venda agora **sai da impressora em 3D**; botao "Remover" passou a icone com `aria-label`.
  - 11 paginas de Owner — todos os `EmptyState` com emoji passaram a icones lucide.
- **Bug encontrado nas minhas proprias alteracoes (e corrigido):** ao juntar `g-track` ao `StatCard`, o brilho passou a usar `::before` — o mesmo pseudo-elemento usado por `g-stat-kpi::before` (barra de tom). O KPI perdia a barra colorida. O brilho passou a ser um elemento filho real (`.g-track-glow`), preservando a barra de tom e a scanline (`::after`).
- Prova/teste realizado: `npm run build` (frontend) verde em todas as etapas — ultimo `built in 5.95s`, `EXIT=0`, ficheiros PWA gerados. Varreduras: `icon="<emoji>"` = **0 resultados** em 185 ficheiros; `style={{ color: {` = **0 resultados**.
- Resultado: funcionou. Interface coesa sem emojis, sem cores escritas a mao nos ecras tocados, e o bug do desconto corrigido. **Nenhuma logica de negocio, regra de dinheiro, limite de tenant ou fronteira de seguranca foi alterada** — so apresentacao, mais a correccao aritmetica do desconto.
- Limite desta fase: nao ha prova visual em browser (so build). `pos-header-bar` e a barra de pesquisa mantem o layout anterior.

### [2026-09-24] — "Servidor offline": causa raiz encontrada (schema sqlite vs Supabase Postgres)
- Ficheiros alterados: `backend/.env`, `backend/.env.txt` (APAGADO), `.env.txt` (APAGADO), `.gitignore`, `backend/prisma/schema.prisma`, `backend/prisma/schema.sqlite.prisma` (novo), `backend/prisma/migrations/migration_lock.toml`, `backend/src/utils/dbEngine.js` (novo), `backend/src/utils/prisma.js`, `backend/src/index.js`, `backend/package.json`, `backend/scripts/smoke_boot.js` (novo), `plan.md`.
- Porquê: o backend não arrancava e o founder reportava "servidor offline". **Não era falha do Supabase**: o Prisma validava a URL *antes* de ligar e morria.
- **Causa raiz (provada, não inferida):** `schema.prisma` declarava `provider = "sqlite"` enquanto `backend/.env` apontava `DATABASE_URL` para o Postgres do Supabase. Erro exacto reproduzido: `PrismaClientInitializationError: the URL must start with the protocol 'file:'`.
- Defeitos adicionais encontrados no `.env`: (a) `DIRECT_URL` **duplicado**, e o último (`file:./dev.db`) sobrescrevia o Postgres real — confirmado por leitura: `DIRECT_URL e file? true`; (b) linhas de notas coladas sem `=`; (c) **`JWT_SECRET` não existia**, pelo que o servidor nem teria sessões.
- Decisão do fundador: **PostgreSQL (Supabase) como alvo**. Criado `prisma/schema.prisma` (postgresql) e `prisma/schema.sqlite.prisma` (sqlite) — necessário porque um cliente gerado com provider `postgresql` **recusa** um URL `file:` (verificado experimentalmente: "RECUSA file:"). `migration_lock.toml` passou a `postgresql`.
- **Diagnóstico de rede (com prova, não palpite):** a password está CORRECTA (a autenticação passou). O projecto NÃO está pausado (REST respondeu `401 Secret API key required`). DNS resolve. `Test-NetConnection` dá `True` nas portas 6543 e 5432, mas o socket **nunca recebe o banner do Postgres** (TIMEOUT). O controlo decisivo: a porta **9999 (inexistente) dá exactamente o mesmo resultado** que a 5432 — assinatura de firewall/proxy que aceita a ligação e a descarta. Conclusão: **é bloqueio de rede deste ambiente, não configuração do projecto.**
- Como não se pode deixar o produto parado, foi implementado `src/utils/dbEngine.js`: escolhe o motor no arranque (Postgres se responder; SQLite local se `DB_ALLOW_SQLITE_FALLBACK=true`; **recusa arrancar** se não houver base — nunca servir dados de uma base errada em silêncio). `prisma.js` passou a Proxy preguiçoso com `require('@prisma/client')` **tardio**.
- **Dois bugs meus detectados e corrigidos durante a execução:** (1) `spawnSync npx.cmd` devolvia `EINVAL` no Windows — resolvido com `shell: true`; (2) a sondagem inicial baseda-se só na porta aberta e dava **falso positivo** ("Postgres acessivel") porque o pgbouncer aceita o SYN mas morre antes da primeira query — corrigida para exigir uma **query real**.
- **Prova/teste realizado (executado agora):**
  - `prisma validate` → schema válido (postgresql).
  - `prisma generate` → OK (295ms).
  - `prisma db push` (sqlite) → "Your database is now in sync with your Prisma schema".
  - `device_keys` criada (é `@@ignore` no Prisma, criada por SQL directo).
  - **Arranque + API reais:** `GET /` → **HTTP 200** `{"message":"Genesis API - v1.0"}`; `GET /api/auth/me` → **HTTP 401** (protecção activa).
  - **Fail-closed:** com `DB_ALLOW_SQLITE_FALLBACK=false`, o servidor **recusa arrancar em 8.2s** com mensagem clara, em vez de servir de uma base errada.
- Resultado: **o Genesis arrancou e responde.** O caminho Postgres está pronto e testado; a barreira actual é a rede deste ambiente, não o código.
- **Pendente (bloqueio externo, não resolvível em codigo):** aplicar as 16 políticas de `prisma/rls_policies.sql` no Supabase (passo 8 do plano) e correr `prisma db push` para o Postgres — ambos exigem saída de rede para a porta 5432. Assim que houver rede, basta: `npm run db:use:pg` + `npm run db:push:pg`.
- **Segurança:** `.env.txt` e `backend/.env.txt` (cópias com a password do Postgres, `SUPABASE_SECRET_KEY` e `TWILIO_AUTH_TOKEN` em texto claro) foram **APAGADOS**; `.gitignore` reforçado (o padrão `*.env` não cobria `.env.txt`).
- **Credenciais expostas nesta sessão — a RODAR:** password do Postgres, `SUPABASE_SECRET_KEY`, `TWILIO_AUTH_TOKEN`. Ver secção 6 do plano activo.

- Segue-se: revisao do `CRMLayout` (shell), das paginas `Hub`/`Onboarding`, e so depois o `Mapa Mental/mapa_mental_3d.html` (SECÇÃO 11), que continua por criar.

- Lote D: redesign visual (Visao Geral/CRM enterprise, graficos Recharts, popups flutuantes).

### [2026-09-19] — Lote D1: fundacao de design (tokens + primitivas) + nome real da loja

**Causa raiz do "visual amador"**
- `frontend/src/index.css` tinha **ZERO variaveis CSS** (`grep -c '--'` = 0). Todas as 16 paginas do dono escreviam cores a mao e existiam **48 ocorrencias de `bg-white`** — cartoes BRANCOS num tema escuro. Padrao Tailwind de demonstracao misturado com tema escuro.

**Bug novo 1 — a sidebar mostrava uma loja FALSA.**
- `App.jsx` importava `ui/mockData.js` que injecta `window.GENESIS_DATA`; o `CRMLayout` lia dai o nome da loja -> aparecia "Bottle Store Motla", que NAO existe na base de dados (os tenants reais sao "Loja Teste", "Genesis Demo Store", etc.). `GET /api/auth/me` nao devolvia o nome do tenant, logo nao havia de onde vir o nome verdadeiro.

**Bug novo 2 — sem botao de SAIR.** `POST /api/auth/logout` existia no backend mas NUNCA era chamado pelo frontend. Nao havia logout em lado nenhum.

**Bug novo 3 — codigo morto + arquitectura errada.** `pages/Owner/POS.jsx` (219 linhas) nao estava roteado e o dono nao deve ter POS. `PosCart.jsx`, `PosProductList.jsx` so serviam esse ficheiro.

**Alteracoes**
- NOVO `frontend/src/ui/tokens.css` — paleta near-black + vermelho Genesis (aprovada pelo fundador): `--bg-base #0a0a0c`, `--brand #e50914`, `--ok/--warn/--danger/--info`, `--goal/--goal-bonus`, niveis de stock, `--text/--text-muted/--text-dim`, raios, sombras, espacamentos, transicoes e z-index.
- NOVO `frontend/src/ui/primitives.css` — classes `.g-*` (card, stat, btn, badge, input, backdrop/modal com animacao, toast, table, empty, skeleton, goal track/bonus, alert).
- NOVO `frontend/src/components/ui/index.jsx` — primitivas React: `Card`, `CardHead`, `StatCard`, `Button`, `Badge`, `Input`, `Modal` (popup flutuante animado), `ToastProvider`/`useToast`, `Table`, `EmptyState`, `Skeleton`, `PageHead`, `Alert`, `GoalBar` (cores progressivas + barra de bonus azul >100%).
- `frontend/src/main.jsx` — importa `tokens.css` e `primitives.css`.
- `backend/src/routes/owner.js` — NOVO `GET /api/owner/tenant` (nome real, business_type, location, status, trial, subscription_price; nao expoe `cancel_pin_hash`).
- `frontend/src/layouts/CRMLayout.jsx` — REESCRITO: usa tokens; nome/plano da loja vindos da API; menu com icones e seccoes; **paleta de comandos Ctrl+K** real (Modal flutuante); **botao de logout** (novo); chip de utilizador com nome real e role. Deixou de ler `window.GENESIS_DATA`.
- `frontend/src/App.jsx` — `ToastProvider` a envolver as rotas; `/cashier` -> redirect `/pos` (o POS ja nao e embrulhado no shell do dono); import de `CashierDashboard` removido.
- REMOVIDOS: `pages/Owner/POS.jsx`, `components/PosCart.jsx`, `components/PosProductList.jsx`.

**Prova (REGRA 3)**
- E2E `/tmp/d1_test.mjs`: **5 PASS / 0 FAIL** — `GET /api/owner/tenant` devolve `name=Genesis Demo Store`, `business_type=mercearia`, `location=Maputo`, nao expoe `cancel_pin_hash`, e o nome **nao e** o falso `Bottle Store Motla`.
- `npm run build`: OK. Bundle CSS contem `--brand`, `--bg-base`, `g-goal-bonus`, `g-modal`, `g-toast`. Bundle JS contem `api/auth/logout`.
- `grep GENESIS_DATA` em CRMLayout = 0.
- 4 ficheiros confirmados apagados. Portas 4000/5173/5175 = 200.

**Adiado para D2 (com prova)**
- `ui/mockData.js`, `components/StatsGrid.jsx`, `components/Pipeline.jsx` ainda existem porque o `Dashboard.jsx` (696 linhas) os usa com `require(...)`. Sao removidos quando o Dashboard for dividido no D2.
- Restam **46 ocorrencias de `bg-white`** em 14 paginas -> D2 (Dashboard) e D3 (restantes ecras).

### [2026-09-20] — Criacao dos scripts de arranque nativos para Windows (PowerShell / Batch)
- Ficheiros criados: `run-local.ps1`, `run-local.bat`, `stop.ps1`, `stop.bat`, `run-admin.ps1`, `run-admin.bat`.
- Porquê: O utilizador mudou do ambiente Kali Linux para Windows e precisava do equivalente ao `run-local.sh` para iniciar Backend (4000), Frontend (5173) e Admin Frontend (5175), com suporte a `--admin` para abrir duas abas no navegador (Owner/Cashier em http://localhost:5173/login e Super Admin em http://localhost:5175/login).
- Prova/teste realizado: `stop.ps1` executado com sucesso em PowerShell; `run-local.ps1` e `run-local.bat` parametrizados e testados com `-Admin` / `--admin`. Corrigido erro de parâmetro duplicado `$admin` (PowerShell é case-insensitive).
- Resultado: funcionou perfeitamente.



### [2026-09-28] — Correcção dos erros de login, Google, reset de senha e pedido de conta

**Sintomas reportados:** login com credenciais certas dava "Erro interno no servidor" (500) no painel do dono e no de super admin; o login Google morria a meio; o "Esqueci a senha" dizia logo que a senha estava redefinida, sem pedir código; o "Pedir conta" não avançava.

#### 1. Causa-raiz única — faltava uma coluna na base de dados

`Tenant.onboarding_completed` **não existia no Postgres**. Toda a query de login faz `include: { tenant: true }`, que traz **todas** as colunas de `Tenant`, e o Prisma lançava `The column Tenant.onboarding_completed does not exist in the current database`. O `catch` da rota engolia o erro e devolvia `500 "Erro interno no servidor"` — com a senha certa ou errada. O mesmo motivo fazia o `POST /request-account` falhar (o `tenant.create` escreve essa coluna).

- Correcção: `backend/prisma/fix_2026-09-28_colunas.sql`, executado com `npx prisma db execute`.
- **Porque não `prisma db push`?** O push completo tentava converter várias colunas de `uuid` para `text` e o Postgres recusa: `ERROR: cannot alter type of a column used in a policy definition / DETAIL: policy tenant_isolation_auditlog on table AuditLog`. As **16 políticas de RLS** que isolam os dados entre empresas não podem ser destruídas só para mudar um tipo de coluna. Verificou-se primeiro a integridade referencial (**zero linhas órfãs**) e depois só se adicionou o que faltava.
- Acrescenta também: `Sale.daily_number`, `Sale.discount_amount`, índice `Sale_tenant_created_idx` e a tabela `device_keys`.

#### 2. Erros de código corrigidos

| Ficheiro | O que estava mal |
|---|---|
| `backend/src/routes/auth.js` | Todos os `catch` que devolviam 500 **não registavam o erro** — era impossível diagnosticar. Agora cada um faz `console.error` com o email. |
| `backend/src/routes/auth.js` | `bcrypt.compare(pass, null)` em conta sem `password_hash` lançava TypeError → 500. Agora devolve **401 `NO_PASSWORD`**. |
| `backend/src/routes/auth.js` | Google: `NOT_YET_VALID` passou a **`CLOCK_SKEW`**, com a medida do desvio. |
| `backend/src/routes/auth.js` | `forgot-password` devolve o código **no ecrã** quando não há SMTP (`DEV_SHOW_RESET_CODE`, só em dev e só se não foi entregue). |
| `backend/src/utils/prisma.js` | O proxy preguiçoso devolvia uma **função** para tudo antes de `ready()` resolver → `prisma.user.findUnique` ficava `undefined` → *TypeError* → 500 em qualquer rota que tocasse na BD cedo. Agora é um `Proxy` recursivo. |
| `backend/src/index.js` | O handler global devolvia **`details` ao cliente** (nomes de tabelas/colunas e host da BD). Removido; ganhou `headersSent` e log com a stack. |
| `frontend/src/pages/ResetPassword.jsx` | **Ramo `: !sent ?` duplicado** logo a seguir a `done ?` — como `sent` começa a `false`, ao abrir `/forgot-password` aparecia de imediato "Senha redefinida com sucesso", sem pedir email nem mostrar o campo do código. |
| `frontend/src/pages/Login.jsx` | Com `CLOCK_SKEW` mostrava o genérico "não foi possível validar a sessão". Agora explica que **a hora do computador** está errada. |


#### 3. Relógio do computador — causa do login Google

```
LOCAL  = 2026-09-27T21:49Z   GOOGLE = 2026-09-28T06:08Z   DESVIO = -29 893 s (≈ 8h18min)
```

O Google emite o `nbf`/`iat` com o "agora" verdadeiro; com o relógio 8 horas atrás o token parecia estar no futuro e era rejeitado — era exactamente a linha `[google] token recusado: NOT_YET_VALID` do log. **O código estava correcto, o relógio é que estava errado.** A tolerância mantém-se em 60 s (aumentá-la abriria uma janela de replay).

- **Acção pendente do fundador:** `w32tm /resync` em PowerShell de administrador; fuso `Africa/Maputo`.

#### 4. Ferramenta nova de gestão de senhas

`backend/scripts/gerir_contas.js` + `gerir-contas.bat` (Windows) + `gerir-contas.sh` (Linux/macOS).

As senhas estão em **bcrypt custo 12** (`bcrypt.hash(password, 12)`), um hash de **sentido único** — não há como as listar nem reverter. O script faz o único possível: **listar as contas**, **verificar** se uma senha bate certo, **definir** uma nova, **gerar** uma forte, **repor** a do `.env` e **activar/desactivar** contas. Senhas sempre mascaradas, hash nunca impresso por inteiro, cada alteração registada em `AuditLog` como `PASSWORD_CHANGED_VIA_SCRIPT` e verificada relendo a BD.

#### 5. Validação (tudo testado)

| Verificação | Antes | Depois |
|---|---|---|
| `POST /api/auth/login` (senha errada) | **500** | **401** "Credenciais inválidas" |
| `POST /api/auth/login` (senha certa) | **500** | **HTTP 200** com token JWT |
| `POST /api/auth/request-account` | **500** (não avançava) | **201** "Pedido recebido" |
| `POST /api/auth/forgot-password` | 200 mas sem código em lado nenhum | 200 + código no ecrã |
| `POST /api/auth/reset-password` (código errado) | 400 | **400** correcto |
| `POST /api/auth/reset-password-instant` | — | **404** (porta dos fundos fechada) |
| `GET /api/auth/me` sem sessão | 401 | **401** |
| `node --check` nos ficheiros backend | — | exit 0 |
| esbuild nos 3 JSX alterados | — | compilam |

#### LIMITE HONESTO DESTA VEZ

- **Não reiniciei o backend.** O processo (PID 4304) é filho do VS Code e o `taskkill` devolve *Access is denied* sem privilégios de administrador. A correcção da **base de dados** já está activa (o login já devolve 401 em vez de 500), mas o **código novo** só entra no próximo arranque: `.\run-local.ps1`.
- **Não corri `w32tm /resync`** — exige PowerShell elevado. O login Google continua bloqueado até o fundador o fazer.
- **Não configurei o SMTP** (`MAIL_USER`/`MAIL_PASS` continuam vazios). O `DEV_SHOW_RESET_CODE` é uma mitigação de desenvolvimento, não substituto do email em produção.
- **Não consegui reiniciar o backend** por falta de permissões sobre o PID 4304 (filho do VS Code). A correcção da **base de dados** já está activa, mas o **código novo** só entra no próximo arranque: `.\run-local.ps1`.
- A barra de estado do mapa 3D **foi resolvida depois**: auto-esconde ao fim de 3,5 s e há modo limpo permanente (tecla H).

#### FALTA AINDA

- Reiniciar o backend (`.\run-local.ps1`) para activar o código novo.
- Sincronizar `admin@genesis.co.mz` e `cashier@genesis.local` — o `.env` não correspondia a nenhuma delas em base de dados.
- Remover `DEV_SHOW_RESET_CODE` assim que o SMTP estiver configurado.
- Rodar as chaves do `.env` antes de qualquer deploy (`JWT_SECRET` de dev, chaves Supabase e Twilio em texto simples).


### [2026-10-03] — Organização da memória persistente: CLAUDE.md + skills do Prompt Mestre
- Ficheiros alterados: `CLAUDE.md` (criado e depois expandido); novos `.claude/skills/genesis-spec/SKILL.md`, `.claude/skills/genesis-guia-tecnico/SKILL.md`, `.claude/skills/genesis-historico-auditoria/SKILL.md`.
- Porquê: o `Prompt_Mestre.txt` (2198 linhas) é demasiado grande para carregar em todas as sessões. O essencial (Regras Invioláveis da Secção 8, regra dos centavos, regra do RLS/isolamento, hierarquia de 3 níveis da Secção 4, protocolo Mapa Mental + ficheiro "Oque ja fiz…") foi fundido no `CLAUDE.md`, que o Claude Code lê sempre. As Secções 6 (spec funcional), 18 (guia técnico) e 12-13 (auditoria/bugs) foram copiadas literalmente para skills que só carregam quando invocadas.
- Prova: `wc -l CLAUDE.md` abaixo de 200 linhas; as três skills criadas com `sed -n` sobre as linhas exactas do `Prompt_Mestre.txt` (491-726, 1542-1949, 959-1268). Verificado que `Mapa Mental/` e `Oque ja fiz para corrigir estes erros.txt` já existiam (Secção 0 / Secção 22) — nada foi recriado.
- Resultado: funcionou. Nenhum ficheiro de código foi tocado.
- Segue-se: aguardar o fundador para escolher a próxima mini-meta.

### [2026-10-03] — Análise crítica + correcção dos 7 problemas prioritários
- Ficheiros alterados: backend `middleware/auth.js`, `middleware/deviceKeyAuth.js`, `routes/{auth,admin,owner,refresh,sales,products,shrinkage_records,demand_captures}.js`, `utils/prisma.js`; novos `utils/{tokens,kioskScope,sessionUser}.js`, `scripts/verify_security_fixes.js`. Frontend `App.jsx`, `components/ProtectedRoute.jsx`, `pages/{Hub,CashierDashboard}.jsx`, `db/localDb.js`, `hooks/useOfflineSync.js`; novos `utils/{syncPolicy,offlineQueue}.js`, `tests/offline_queue.test.mjs`; devDependency `fake-indexeddb`.
- Porquê: análise crítica do sistema (sessão de 03/10) — 7 falhas prioritárias (senha exposta, quiosque só no frontend, PIN sem bloqueio real, venda abaixo do catálogo, caixista a mexer no stock, fila offline, sessões de contas desactivadas).
- Descobertas durante a correcção: (a) a senha exposta ainda abre 3 contas; (b) TODAS as vendas em Postgres falhavam com 500 (timeout de transacção 5 s vs ~1,2 s/query); (c) a fila offline NUNCA sincronizou (booleano indexado → DataError) e o hook de sync não estava montado em lado nenhum — pedidos de reposição e quebras nunca saíam do browser; (d) o RLS não se aplica (bypassrls) — o comentário em `scripts/_limpar_teste_venda.js` que diz o contrário está errado.
- Prova: `node scripts/verify_security_fixes.js` (servidor real na porta 4100 + Supabase, loja de teste criada e apagada) → "RESULTADO: todas as verificacoes passaram" nas secções 2-7 em conjunto; `node --test tests/offline_queue.test.mjs` 8/8; `vite build` OK; testes unitários antigos 6/6 + device keys 2/2 (com `-r dotenv/config`).
- Resultado: pontos 2-7 funcionaram. Ponto 1 parcial: literal removido dos ficheiros versionados; a rotação das senhas foi BLOQUEADA pelo sistema de permissões e fica para o fundador; histórico do git por limpar.
- Segue-se: fundador roda as 3 senhas (`gerir-contas.bat`) e decide a limpeza do histórico; validar Hub e fila offline no browser real; política de descontos (precisa de decisão — REGRA 8).

### [2026-10-03] — Genesis 2.0: RLS real, terminal POS com PIN, descontos, custos fixos, design system novo, painel admin
- Ficheiros: backend — `utils/{prisma,http,audit,shift,terminals,sessionScopes,supportCodes,tenantStatus,tokens}.js`, `middleware/{auth,terminalAuth,posWriteAuth,rbac}.js`, `routes/{pos,settings,owner,admin,sales,products,inventory,dashboard,catalogs,auth,refresh}.js`, `services/reports.js`, `prisma/{schema*.prisma,rls_v2.sql,migrations/20261003_genesis2}`, `scripts/{verify_system,e2e_fixture,e2e_admin_fixture}.js`; removidos device keys, shift_closings, kioskScope, dbEngine.js, rls.sql/rls_policies.sql e 60 ficheiros de lixo. Frontend reescrito (design system, AppShell, pages/auth|owner|pos, App com lazy-loading); removidos tema escuro, Hub, CashierDashboard, Printer3D, i18n, jsPDF. Admin-frontend reescrito sobre o mesmo kit (@ui).
- Porquê: pedido do fundador — fechar as 4 lacunas (browser, descontos, sessão, resto da análise) e dar ao produto um aspecto profissional (decisões: grafite + verde, terminal + PIN, descontos até X%, admin no mesmo sistema).
- Descobertas: drift do esquema (tenant ids `uuid`, nenhuma FK para Tenant) — migração aplicada só com SQL aditivo; o `migrate diff` propunha recriar a PK do Tenant. Animação de barras do Recharts desenhava a barra no dia errado durante a captura — animações desligadas. Em localhost os cookies não distinguem portas: o modo suporte substitui a sessão do admin no mesmo browser (em produção cada painel no seu domínio com proxy /api).
- Prova: `verify_system.js` com RLS activo — 129 verificações OK; secção 8 isolada da 3 e repetida (OK). Browser real: dono+terminal 25/25 passos, 0 erros de JS; admin 5/5, 0 erros de JS. `offline_queue.test.mjs` 8/8, `monthlyDeductions.test.js` 6/6, `prisma validate` OK, builds OK (POS ~375 KB; gráficos só no painel).
- Resultado: funcionou. Pendentes: rodar as 3 senhas expostas (fundador), inglês (6.10), percorrer no browser o onboarding e o fim de sessão por senha mudada, lojas de teste antigas na BD (não criadas nesta sessão), latência de ~1–2,5 s por query (alojar o backend em eu-central-1).
- Segue-se: o fundador valida no balcão real (emparelhar um PC, criar PIN em Equipa) e decide o alojamento.

### [2026-10-03] — Genesis 2.1, Fase 0: commit do 2.0 + reprodução dos bugs relatados (onboarding OK; causa real do "servidor indisponível")
- Plano aprovado: `~/.claude/plans/a-malha-entrou-dentro-effervescent-honey.md` (acrescento ao 2.0; não desfaz nada — sem modo escuro, onboarding continua no 1.º login).
- Ficheiros alterados: commit `0cf0d30` (Genesis 2.0, ~190 ficheiros, varredura de segredos = 0); `backend/scripts/e2e_fixture.js` (modo `onboarding`); novo `frontend/tests/e2e/onboarding.mjs`; `backend/src/utils/dbEngine2.js` (3 tentativas); `backend/src/utils/prisma.js` (`connect_timeout`/`pool_timeout`).
- Porquê: o fundador relatou (versão antiga) onboarding partido, "servidor indisponível" ao vender e fecho de turno a dizer "já fechado".
- Prova real:
  - Onboarding no browser: login → `/onboarding` → bottle store → categoria adicional selecciona/desselecciona → catálogo carregado → concluir → `/app`; produtos gravados = escolhidos; sem "Higiene". **8/8 OK, 0 erros JS.** Os bugs do relato não existem no 2.0.
  - **Causa 1 (reproduzida):** com `DB_ALLOW_SQLITE_FALLBACK=true`, uma falha de rede na sondagem mandou o fixture para a SQLite local → `column discount_free_pct does not exist`, e o cliente Prisma partilhado foi regenerado para `sqlite` (`activeProvider: "sqlite"`, reposto para `postgresql` com `prisma generate`). Correcção: 3 tentativas; prova com rede real (1.ª falhou "timeout expired", 2.ª OK).
  - **Causa 2:** P2024 "Timed out fetching a new connection from the connection pool (timeout 10, limit 5)" no Início após o onboarding (500 em `/reports/daily`, 503 em `/goals/current`). Correcção parcial: `pool_timeout=30`, `connect_timeout=30`.
  - **Causa 3 (a de fundo):** Postgres com `max_connections=60`; o pooler 5432 está em **modo sessão** → `EMAXCONNSESSION max clients reached` acima de ~15 clientes (o Prisma mostra isto como P1001). Medido: 9/24 ligações paralelas entram. A 6543 (modo transacção, já compatível com o `pgbouncer=true` do `.env`) aceitou 24/24 em 3 s com `genesis_app` e o `set_config` do RLS dentro da transacção.
  - Erro meu, corrigido: subi `connection_limit` para 8 e revertí — num servidor de 60 ligações piora o problema. Os meus testes de 24 ligações deixaram ~49 ligações inactivas presas no Supavisor (59/60); nenhum backend local estava a correr.
  - Bateria `flows.mjs` falhou no relatório diário por esta falta de ligações (sessão caiu para `/entrar`); não é regressão de código.
  - Lojas de teste `5e25b39e…` e `f1945b22…` apagadas.
- Resultado: onboarding provado; 2 correcções de código provadas; a causa de fundo exige mudar o `.env` → **parado para decisão do fundador**.
- Segue-se: (1) fundador decide `APP_DATABASE_URL`/`DATABASE_URL` na porta 6543 e `DB_ALLOW_SQLITE_FALLBACK=false`; (2) libertar as ligações presas (esperar pelo Supavisor ou reiniciar o pooler no painel do Supabase); (3) repetir `flows.mjs` + `verify_system.js`; (4) Fase 1.

### [2026-10-04] — Fase 1 (2.1): catálogo moçambicano + onboarding melhorado + scripts de arranque
- Ficheiros alterados: `run-local.ps1`, `run-local.bat`, `run-admin.bat`, `backend/src/utils/dbEngine2.js` (mensagem), `backend/data/master_catalogs.json` (reescrito), `backend/scripts/seed_master_catalogs.js` (reescrito), `backend/prisma/schema.prisma` + `schema.sqlite.prisma` (`MasterCatalog.barcode`, `image_url`), `backend/prisma/migrations/20261004_catalogo_mz/migration.sql` (novo, só `ADD COLUMN IF NOT EXISTS`), `backend/src/routes/catalogs.js` (reescrito), `frontend/src/pages/owner/Onboarding.jsx`, `frontend/src/components/ui/Form.jsx` (`Input` com `forwardRef`), `frontend/tests/e2e/onboarding.mjs`.
- Porquê: pedido do fundador (catálogo com produtos e preços reais de Moçambique, código de barras, perceber para que servem os passos 4 e 5) + "actualiza o run-admin.bat".
- Arranque: abria `/login` (rota antiga), esperava ~25 s e dizia "Genesis a rodar com sucesso!" mesmo com o backend morto; a janela do `.bat` fechava e escondia o erro. Agora: `/entrar`, espera até 150 s, pára com as últimas linhas do log e `exit 1`; os `.bat` fazem `pause` em erro. Provado: arranque real exit 0 em 7 s (`[db] ...:6543`); BD inexistente → "FALHOU", 3 tentativas no log, exit 1.
- Preços: bazara.co.mz (loja online de Maputo, out/2026), canal.co.mz (pão 12–15 MT), hikersbay (pão de forma, peito de frango); o resto marcado "estimativa — confirmar". Custo sugerido = venda × margem típica por tipo. Códigos de barras a null (não se inventam EAN). Open Food Facts: 100 produtos para Moçambique, quase todos sul-africanos — sem imagens fiáveis para os produtos locais.
- Bug encontrado: com 2 linhas de teste na tabela `MasterCatalog` (`mercearia`), uma mercearia nova recebia só esses 2 produtos no onboarding. Resolvido ao carregar o catálogo; as 2 linhas ficam (não criadas por mim).
- Prova real: `prisma validate` dos 2 schemas OK; migração aplicada; seed 207 inseridos e 2.ª execução 0; `GET /api/catalogs/bottle_store` → 43 produtos; tipo desconhecido → 404; import com preço 0 → `400 "Produto 2 (Fanta): preço de venda tem de ser maior que zero"`; código repetido → `400 DUPLICATE_BARCODE`; `image_url: javascript:` → 400; `onboarding.mjs` 18/18 (leitor simulado salta de linha, código repetido bloqueia, 2 códigos gravados, Txilar 55 MT = 5500, fornecedor 500 MT = 50000, restaurante traz "Grelhados", sem "Higiene"); `flows.mjs` 24/24 (regressão do `Input`); capturas revistas — nomes cortados corrigidos. Lojas de teste apagadas.
- Resultado: funcionou.
- Segue-se: paragem entre fases. Fase 2 (POS: e-Mola separado, imagens/ícone de categoria, faixa do leitor, atalhos, acabamento visual).

### [2026-10-04] — Fase 2 (2.1): POS — M-Pesa/e-Mola separados, imagens, leitor e atalhos
- Ficheiros alterados: `backend/src/utils/paymentMethods.js`, `backend/src/services/reports.js`, `backend/src/routes/owner.js` (filtro), `backend/src/routes/products.js` (`image_url`), `backend/src/routes/catalogs.js` (regra partilhada); novos `backend/src/utils/productImage.js`, `backend/tests/paymentMethods.test.js`, `frontend/src/components/ui/ProductImage.jsx`, `frontend/src/utils/imageResize.js`, `frontend/tests/e2e/pos.mjs`; alterados `frontend/src/pages/pos/PosScreen.jsx`, `frontend/src/pages/owner/Products.jsx`, `frontend/src/utils/format.js`, `frontend/src/components/ui/index.js`, `frontend/src/index.css` (animação `.pos-scan` com `--dur`).
- Porquê: pedido do fundador — botão e-Mola (Movitel) além do M-Pesa, imagens nos produtos para quem vê mal, mostrar o código lido pelo leitor, usar o POS só com teclado.
- Decisões aplicadas: atalhos com teclas F (Ctrl+W/Ctrl+2/Ctrl+P são do browser e não se apanham); nenhum atalho sem modificador (o leitor só escreve dígitos + Enter); imagens = foto do dono ou ícone de categoria (sem fotos de marcas tiradas da internet).
- `mobile_money` mantido como valor aceite: vendas offline já em fila nos terminais seriam recusadas (4xx = recusa definitiva) e perdidas.
- Código de barras desconhecido: a faixa diz que não existe e que o dono o regista em Produtos (o "Produto em falta" exige um produto existente, por isso não serve para códigos novos).
- Prova real: `paymentMethods.test.js` 4/4; `monthlyDeductions` 6/6; `offline_queue` 8/8; `vite build` OK; `pos.mjs` **21/21**, 0 erros JS (foto escolhida → `data:image/webp` < 60 000; cartão com foto/ícone; 4 formas de pagamento; faixa com `6001234000017` + "2M 340ml"; código desconhecido avisado; F4 Dinheiro→M-Pesa→e-Mola; F2 foca o desconto; Esc volta à pesquisa; Alt+2 muda categoria; seta+Enter adiciona; Ctrl+Enter cobra; F3 volta a Dinheiro e foca o recebido; venda gravada `emola`; relatório separa M-Pesa e e-Mola); `flows.mjs` 24/24. Capturas revistas: ícone genérico em "Refrigerantes" corrigido; 4 botões de pagamento cabem a 390 px.
- Resultado: funcionou.
- Segue-se: paragem entre fases. Fase 3 (stock por lotes, validades com alerta e perda automática).

### [2026-10-04] — Fase 3 (2.1): stock por lote, FEFO, alertas de validade e perda automática
- Ficheiros: `backend/prisma/schema.prisma` + `schema.sqlite.prisma` (modelo `StockLot`; `Tenant.expiry_alert_days`; `ShrinkageRecord.lot_id`/`unit_cost`), migração `20261004_stock_lotes` (só adições + preenchimento inicial idempotente + RLS), `prisma/rls_v2.sql` (StockLot na lista); novos `src/utils/fefo.js`, `src/utils/stockLots.js`, `src/services/expiryJob.js`, `tests/fefo.test.js`, `frontend/tests/e2e/stock.mjs`; alterados `routes/inventory.js`, `sales.js`, `shrinkage_records.js`, `products.js`, `catalogs.js`, `settings.js`, `owner.js`, `services/tenantAlerts.js`, `index.js` (arranca o job), `scripts/verify_system.js` (secção 14 + limpeza), `scripts/e2e_fixture.js`, `frontend/src/pages/owner/{Products,Home,Settings}.jsx`.
- Desenho: `Product.stock_qty` continua a fonte de verdade da quantidade (e a guarda atómica da venda); os lotes dizem de que data é o stock. Os 8 caminhos que mexem em stock actualizam os lotes na mesma transacção: entrada (lote com validade), stock inicial, import do catálogo, ajuste + (lote) e − (FEFO), venda (FEFO), quebra (FEFO + lote + custo), cancelamento (volta como lote sem validade — a venda não guarda de que lote saiu). O `PATCH /products/:id` deixou de aceitar `stock_qty` (saltava auditoria e lotes; o ecrã não o usava).
- Validade: "válido até 12/10" vende-se no dia 12 (hora de Maputo) e é perda a partir do dia 13. Job 15 s após arrancar e de hora a hora; corre o cliente de sistema para encontrar lotes vencidos e trata cada loja dentro de `runWithTenant`; idempotente (só zera o lote se a quantidade lida não mudou). `EXPIRY_JOB=false` desliga.
- Migração real: 26 lotes criados = 487 unidades = stock total; 0 produtos com diferença; 2.ª execução não duplicou; RLS `tenant_isolation_stocklot` activa.
- Prova real: `fefo.test.js` 7/7 (inclui fronteira 23:59/00:01 de Maputo); unitários 17/17; `verify_system.js 14` **27/27** (FEFO 5+2 de 7 vendidos; alerta "4 de 8 un. em 20 dias, valor ao custo"; quebra sai do lote certo com o custo dele; job: 1 lote vencido → quebra `expired` 3 un. a 29 MT em nome do dono + auditoria `AUTO_EXPIRY_LOSS`, 2.ª execução 0; cancelamento repõe; ajustes ±; PATCH stock ignorado; RLS: lotes invisíveis noutra loja; stock = soma dos lotes em todos os passos); `verify_system.js` completo **13 secções, 160 OK, 0 falhas**; browser `stock.mjs` 3/3, `pos.mjs` 21/21, `flows.mjs` 24/24.
- Aviso ao fundador: há 2 lotes reais já vencidos (abril e maio de 2026) na loja de teste antiga "Test Tenant 4444" (2M 19 un., Água 500ml 7 un.). Ao arrancar o backend novo, o job regista-os como perda — comportamento esperado da funcionalidade.
- Custo: cada venda faz +2 consultas por produto (ler e descontar lotes); a partir de Maputo isso soma ~2–5 s por produto à transacção (limite 45 s). Em produção, com o servidor em Frankfurt, é desprezável.
- Segue-se: paragem entre fases. Fase 4 (relatórios com rastreio completo, metas com histórico, recomendação de restock).

### [2026-10-04] — Fase 4 (2.1): relatórios com rastreio completo, metas com histórico e restock
- **4.1 (servidor, commit `b179d34`):** `services/restock.js` (novo, puro), `services/reports.js` (perdas e lucro por dia; diário com % da meta no dia e acumulado + comparação com o dia anterior; semanal com melhor/pior dia e restock 7 dias; mensal com mês anterior, semanas, tendências por produto, chenecas novas/recebidas/em aberto, meta e restock 30 dias; `timeline` paginada), `routes/owner.js` (`/reports/timeline`, `/goals/history`), `scripts/verify_system.js` (secção 15), `tests/restock.test.js`.
- **4.2 (ecrã, este registo):** `pages/owner/Reports.jsx` (KPIs → resumo → "Rastreio" com filtros; semanal dia a dia com clique → diário; mensal com cascata "Do que entrou ao que ficou", metas de 12 meses, restock + "não reforçar"), `components/SaleDrawer.jsx` (novo: recibo completo da venda num Drawer, com reimprimir), `pages/owner/Home.jsx` (linha "Mês passado: X% da meta" + ligação ao histórico), `utils/format.js` (`timeSec`), `utils/useApi.js` (ignora respostas de URLs antigos — com rede lenta um filtro trocado duas vezes mostrava o resultado errado), `components/ui/Form.jsx` (bug no regex de largura: `s` em vez de `\s`), `frontend/tests/e2e/reports.mjs` (novo), `flows.mjs` (texto do mensal mudou).
- Correcções feitas durante a prova: (a) "não reforçar" marcava produtos acabados de criar (loja nova) como parados → só julga produtos que existem há pelo menos a janela inteira (`now` em `recommendRestock`, teste novo); (b) detalhe da perda e da cheneca no rastreio trazia datas `AAAA-MM-DD` cruas → passam como campos (`expiry_date`, `due_date`) formatados no ecrã.
- Prova real (output nesta e na sessão anterior, interrompida por o PC ter desligado): unitários restock 7/7, monthlyDeductions 6/6, paymentMethods 4/4, fefo 7/7, offline_queue 8/8; `verify_system.js` completo **194/194** (após a última alteração ao restock) e secção 15 repetida hoje OK; browser com fixture nova cada: `flows.mjs` passou, `pos.mjs` passou, `stock.mjs` passou, `reports.mjs` passou (venda com hora ao segundo, caixista e +105 MT; perda com motivo, código e −55 MT; clique → recibo; meta +1% do dia; semanal → diário; filtro Perdas); onboarding passou; `vite build` OK; grep de dinheiro nos ficheiros novos: só conversões de exibição.
- ⚠️ Observado: 2× P2024 (pool de 5 ligações esgotado) no backend de teste em `/reports/monthly` e `/goals/history` enquanto o terminal vendia — o mensal faz ~19 consultas em paralelo e cada uma demora 1–2 s a partir de Maputo. Os testes passaram (o ecrã recarrega). Não alterado: é a mesma latência registada a 03/10; com o servidor em Frankfurt deixa de acontecer. Se persistir em produção, reduzir o paralelismo do mensal.
- Resultado: funcionou.
- Segue-se: paragem entre fases. Fase 5 (despesas avulsas no lucro líquido, lista de compras com WhatsApp ao fornecedor, fecho do mês).

### [2026-10-04] — Fase 5.1 (2.1): despesas avulsas no lucro líquido
- Ficheiros: `prisma/schema.prisma` + `schema.sqlite.prisma` (modelo `Expense`), migração `20261004_despesas` (só CREATE TABLE + índice + RLS + GRANT; aplicada com `db execute`), `prisma/rls_v2.sql` (Expense na lista), `routes/settings.js` (GET/POST/PUT/DELETE `/api/settings/expenses`, auditados), `services/monthlyDeductions.js` (`total_expenses` dentro de `operating_expenses`), `services/reports.js` (mensal: despesas e por categoria; rastreio: tipo `expense`), `tests/monthlyDeductions.test.js` (+2), `scripts/verify_system.js` (secção 16; fórmula da 15 inclui despesas; limpeza), `scripts/e2e_fixture.js` (limpeza), `frontend/src/pages/owner/Settings.jsx` (separador "Custos e despesas"), `Reports.jsx` (linha na cascata, por categoria, filtro "Despesas"), novo `frontend/tests/e2e/fase5.mjs`.
- Decisões: categorias "editáveis" = lista sugerida (Limpeza, Transporte do stock, Software, Luz, Água, Manutenção, Outros) + texto livre, sem tabela de categorias. A despesa é do dia escolhido (guardada ao meio-dia do servidor, para cair no mesmo dia/mês que os relatórios usam); data no futuro e datas inexistentes = 400. No rastreio aparece só com o dia e não muda o lucro bruto do dia (é deduzida no mês). `created_by` sem FK, como em `PosTerminal` (drift dos ids).
- Prova real: BD — tabela com `relrowsecurity=true`, política `tenant_isolation_expense`, `genesis_app` com INSERT; `prisma validate` dos 2 schemas OK; `monthlyDeductions` 8/8; `verify_system.js 15 16` OK (16: 23/23 — 350,50 MT gravado como 35050; categoria livre; valor 0 / não inteiro / futuro / 31-02 = 400; total e por categoria; editar; lucro líquido desce exactamente o valor; rastreio negativo com profit 0 e nome de quem registou; caixista 403; outra loja não vê nem apaga (RLS); auditoria 3; apagar e 404); `vite build` OK; browser `fase5.mjs` 9/9, 0 erros JS (servidor recebeu 35050 centavos; cascata; rastreio "(dia)"; editar; apagar). Capturas revistas.
- Resultado: funcionou.
- Segue-se: 5.2 — lista de compras (gerar da recomendação ou manual, total + entrega, guardar, WhatsApp ao fornecedor).

### [2026-10-04] — Fase 5.2 (2.1): lista de compras com WhatsApp ao fornecedor
- Ficheiros: `prisma/schema.prisma` + `schema.sqlite.prisma` (`ShoppingList`, `ShoppingListItem`), migração `20261004_lista_compras` (só CREATE TABLE + índices + CHECK + RLS + GRANT; aplicada com `db execute`), `prisma/rls_v2.sql`; novos `src/services/shoppingList.js` (puro: totais, telefone +258, mensagem, link), `src/routes/shoppingLists.js` (`/api/shopping-lists`: sugestão, CRUD, estado, whatsapp; auditado), `tests/shoppingList.test.js`; `src/index.js` (monta a rota); `scripts/verify_system.js` (secção 17 + limpeza), `scripts/e2e_fixture.js` (limpeza); frontend novo `pages/owner/ShoppingLists.jsx`, `Products.jsx` (separador), `components/ui/Overlay.jsx` (rodapé de Dialog/Drawer com `flex-wrap`: a 390 px os botões saíam do ecrã), `tests/e2e/fase5.mjs` (+7).
- Decisões: `ShoppingListItem` tem `tenant_id` + RLS (o plano não o punha; regra 7). O item guarda o nome e o custo no momento da lista. Mensagem do WhatsApp só com produtos e quantidades (os custos são do dono). Sem telefone válido, o `wa.me` abre a escolha de contacto. "Recebida" é só estado: dar entrada no stock automaticamente saltaria o custo real e a validade de cada lote (Fase 3) — fica em Produtos → Stock. A janela do WhatsApp abre no clique (senão o browser bloqueia o pop-up).
- Prova real: BD — 2 tabelas com `relrowsecurity=true` e políticas; `shoppingList.test.js` 5/5; `verify_system.js 17` **25/25** (sugestão 30 dias; dias inválidos 400; custo actual quando omisso; total 1 788 + 500; repetido/vazio/qtd 0/produto de outra loja/fornecedor inexistente = 400; link `wa.me/258841234567`; mensagem sem custos; editar sem fornecedor = sem entrega; enviada → recebida; estado inválido 400; recebida não mexe no stock; recebida não se edita 409; caixista 403; RLS listas e itens; auditoria 4; apagar com itens); `vite build` OK; browser `fase5.mjs` **16/16**, 0 erros JS (totais 1 572 + 500 = 2 072 MT; WhatsApp abre `wa.me/258841234567` com "24 × 2M 340ml" e "12 × Heineken 330ml"; Enviada → Recebida só de leitura); capturas 1440 e 390 px revistas.
- Resultado: funcionou.
- Segue-se: 5.3 — fecho do mês (diálogo no 1.º acesso do dono a partir de `month_close_day`, relatório do mês anterior + lista sugerida, "Contactar fornecedor agora?", visto registado por mês).

### [2026-10-04] — Fase 5.3 (2.1): fecho do mês + regressão completa da Fase 5
- Ficheiros: `prisma/schema.prisma` + `schema.sqlite.prisma` (`Tenant.month_close_day`), migração `20261004_fecho_mes` (ADD COLUMN IF NOT EXISTS + CHECK 1–28, idempotente — aplicada 2×), novos `src/services/monthClose.js` (puro) e `tests/monthClose.test.js`, `routes/owner.js` (`GET /month-close`, `POST /month-close/seen`), `routes/settings.js` (`PUT /month-close`, dia nas definições), `scripts/verify_system.js` (secção 18), `scripts/e2e_fixture.js` (modo `fecho`: loja de há 2 meses com venda no último dia do mês passado); frontend novo `components/MonthCloseDialog.jsx`, `layouts/AppShell.jsx` (monta o diálogo só para o dono, nunca em suporte), `pages/owner/Settings.jsx` (dia do fecho), `pages/owner/Reports.jsx` (mensal abre `?y=&m=`), novo `tests/e2e/fecho_mes.mjs`.
- Regra: a partir do dia do fecho mostra o mês anterior uma vez; antes desse dia nada; loja que não existia no mês anterior não vê; "visto" = auditoria `MONTH_CLOSE_SEEN` com `entity_id` AAAA-MM (uma só vez). Fechar no X adia só a sessão (sessionStorage). "Agora não" guarda a lista como rascunho; "Contactar fornecedor agora" cria a lista, abre o WhatsApp e marca Enviada.
- Bug encontrado na prova: na 1.ª execução o diálogo não abriu — 3× P2024 (pool de 5 esgotado): o diálogo pedia o mensal (~20 consultas) + sugestão ao mesmo tempo que o Início. Correcção no diálogo: espera 2,5 s, pede um de cada vez, tenta outra vez em 5xx/rede (3×). Depois: 10/10 e 0 erros no backend nesse teste.
- Prova real: `monthClose.test.js` 6/6; `verify_system.js 18` **15/15** (loja nova sem fecho; dia 29/0 = 400; dia 28 → nada; dia 1 → por ver; caixista 403 em ver e mudar; escolha inválida 400; visto 2× = 1 auditoria; depois não volta); browser `fecho_mes.mjs` **10/10**, 0 erros JS (abre "Fecho de Setembro 2026"; receita 1 200 MT; lucro líquido −22 460 = 540 − 8 000 − 15 000, conferido à mão; sugestão 25 Águas = 550 MT, conferido à mão; X não reabre na sessão; nova sessão reabre; contactar → `wa.me/?text=` com a encomenda; lista "Enviada"; depois de decidir não volta; `?y=&m=` abre o mês). Captura revista.
- **Regressão completa da Fase 5** (mesmo backend, fixtures novas): unitários fefo 7/7, monthClose 6/6, monthlyDeductions 8/8, paymentMethods 4/4, restock 7/7, shoppingList 5/5, offline_queue 8/8; `vite build` frontend e admin-frontend OK; `verify_system.js` completo (secções 2–18) "todas as verificações passaram"; browser flows, pos, stock, reports, onboarding, fase5, fecho_mes — todos passaram.
- ⚠️ Ainda assim, 4× P2024 no log do backend durante a regressão (`/reports/daily`, `/goals/current`, `/debts`, `/tenant` — pedidos do Início), sem falha de teste (o ecrã recarrega). Causa: latência Maputo→Frankfurt (~1–2 s por consulta) com pool de 5. Não alterei o `.env`/`connection_limit` (decisão de 03/10). Resolve-se alojando o backend perto da BD; se persistir em produção, reduzir o paralelismo do mensal.
- Pendente (não inventado): envio automático do relatório mensal para o WhatsApp do dono — exige Twilio configurado.
- Resultado: funcionou. **Fase 5 e plano Genesis 2.1 (Fases 0–5) concluídos.**
- Segue-se: paragem entre fases — o fundador decide o próximo passo.

### [2026-10-04] — Fase 6.1: kit de alojamento em Frankfurt (por publicar)
- Decisões do fundador (04/10): DigitalOcean Frankfurt; sem domínio por agora → endereço provisório com HTTPS via sslip.io; acesso por chave SSH gerada neste PC (`~/.ssh/genesis_do`, ed25519, só para este servidor; a parte privada nunca sai do PC).
- Ficheiros novos: `deploy/setup_servidor.sh` (preparação única e idempotente: pacotes, Node 22, swap 2 GB, ufw 22/80/443, SSH só com chave, utilizador `genesis` sem shell, systemd, nginx, certbot com redireccionamento), `deploy/genesis-backend.service` (systemd com `NODE_ENV=production`, reinício automático, endurecimento básico), `deploy/nginx.conf` (app e admin em origens separadas, `/api` para 127.0.0.1:4000, `sw.js` sem cache, assets com cache longa, admin `noindex`), `deploy/gerar_env_producao.js` (gera o `.env` de produção a partir do local sem o mostrar: segredos JWT novos, sem senhas demo, CORS/ADMIN_ORIGINS/APP_URL, TRUST_PROXY=1, seed/reset-code/SQLite desligados), `deploy/publicar.sh` (publica só o HEAD via `git archive`; verifica que o bundle da app não leva código admin; instala em `backend.new` e troca; se o backend novo não responder volta à versão anterior).
- Prova: `bash -n` dos 2 scripts e `node --check` OK; `.env` gerado: NODE_ENV=production, TRUST_PROXY=1, origens https certas, 2 segredos de 96 caracteres diferentes, 0 `DEMO_*_PASSWORD`; backend arrancado neste PC com esse `.env` em produção → "RLS activo", `GET /` 200, `/api/admin/tenants` sem origem 403, `/api/auth/me` 401 com HSTS e sem X-Powered-By.
- Não verificado: nada correu ainda num servidor (o servidor ainda não existe).
- ⚠️ Antes de publicar: a produção usa a MESMA base de dados que o desenvolvimento (Supabase), por isso todas as contas existentes ficam acessíveis pela internet — incluindo as 3 com a senha antiga exposta (🔴 desde 03/10). Têm de ser rodadas (`gerir-contas.bat`) antes. O login Google não funciona no endereço provisório até a origem ser autorizada na consola Google.
- Segue-se: o fundador cria o droplet com a chave pública e envia o IP + email do certificado; 6.2 = `bash deploy/publicar.sh <IP> --primeira-vez <email>` e prova no servidor (HTTPS, latência por query, verificação do sistema contra o servidor de Frankfurt).


### [2026-10-05] — Domínio genesismz.com na Cloudflare; alojamento ainda por resolver
- Decisões do fundador: domínio de produção **genesismz.com** (registado na Namecheap; substitui o `genesis.co.mz` do Prompt Mestre — previsto: `genesismz.com` = app/terminal, `admin.genesismz.com` = painel admin). DNS na **Cloudflare, plano Free**, como escudo à frente do servidor (DNS, HTTPS, DDoS, cache). Plugin `cloudflare@cloudflare` instalado no Claude Code (âmbito do utilizador).
- Alojamento: DigitalOcean, Vultr e Hetzner bloquearam o fundador nas tentativas de pagamento (cartão moçambicano recusado várias vezes → anti-fraude). Recomendado: resolver o meio de pagamento (banco com compras internacionais/3D Secure, ou PayPal) e pedir desbloqueio; entretanto Render grátis em Frankfurt só para teste (adormece após 15 min — não serve para loja real).
- Rejeitado com fundamento: correr o backend em Cloudflare Workers — o plano grátis tem ~10 ms de CPU por pedido (o `bcrypt` dos logins/PINs não cabe), o Prisma com transacções interactivas e RLS, os códigos de emparelhamento/limites em memória e o job horário teriam de ser reescritos; os Workers correm longe da BD. O projecto Workers `genesisproject` criado pelo fundador falhou no build (sem `package.json` na raiz — o repo são 3 projectos) e não deve ser usado para o backend.
- Prova: `nslookup -type=ns genesismz.com 8.8.8.8` → `sage.ns.cloudflare.com`, `indie.ns.cloudflare.com`. Registos: só os 5 MX + SPF do reencaminhamento de email da Namecheap (A e CNAME do "parking" apagados). Nenhum registo do site ainda (não há servidor).
- Não activados de propósito: Bot Fight Mode (no Free não se exclui a `/api` — desafiaria os pedidos do terminal e a fila offline), leaked credentials mitigation (só depois do servidor testado).
- Segue-se: servidor (pagamento) → registos `genesismz.com` / `admin.genesismz.com` com proxy, SSL "Full (strict)", e `APP_HOST`/`ADMIN_HOST` no `deploy/publicar.sh`.

### [2026-10-05] — Fase 6.2: Genesis em produção em Frankfurt (genesismz.com)
- Fornecedor: **Akamai (Linode) Frankfurt** — DigitalOcean/Vultr/Hetzner tinham bloqueado o fundador no pagamento. Servidor `139.162.186.49` (Ubuntu 24.04.4, 1 GB + 2 GB swap). Acesso por chave SSH gerada neste PC.
- **Limpeza da BD pedida pelo fundador** (antes de publicar): cópia de segurança completa em `~/genesis-backup-20261005/bd-antes-limpeza.json` (fora do git; contém hashes); apagadas as 20 lojas e 21 contas de teste com todos os dados; ficaram só `admin@genesismz.com` (super admin, renomeado de `admin@genesis.co.mz`) e `kleytonvelichane3@gmail.com` (dono, loja nova "Loja de Kleyton", activa, onboarding por fazer). Ambas com senha aleatória que ninguém conhece — o fundador define-as no `gerir_contas.js`. Com isto a **senha antiga exposta deixou de abrir qualquer conta** (o 🔴 de 03/10 fica resolvido). Catálogo-mestre mantido (209).
- Instalação: `publicar.sh --primeira-vez` → certificados Let's Encrypt para os 2 nomes (válidos até 03/01/2027, `certbot.timer` activo), backend `active`, sites publicados. `deploy/setup_servidor.sh` passou a gerar `cloudflare-realip.conf` (sem isto, com a nuvem laranja, todas as lojas teriam o IP da Cloudflare e os limites de login/PIN de uma bloqueavam as outras; `CF-Connecting-IP` só é aceite de IPs da Cloudflare).
- Bugs encontrados por correr perto da BD (todos nos testes, não no produto): (1) a secção 14 começava antes de a cache de 1 s do estado da loja expirar depois da 12 → `sleep(STATUS_CACHE_MS + 500)` no fim da 12 (o 1.º commit pôs a espera na 11 por engano — corrigido); (2) o limite de 10 emparelhamentos/IP/15 min (correcto) era atingido → secções 15–18 partilham um terminal (`cashierTerminal()`); (3) `flows.mjs` esperava o 1.º "Carlos" da página, que perto da BD passou a ser a `<option>` escondida do filtro → espera a linha da tabela.
- Prova real: de fora — `https://genesismz.com` e `/entrar` 200, `https://admin.genesismz.com` 200, `http`→`https` 301, `/api/auth/me` 401, login errado 401, `/api/admin/tenants` com origem da app 403, código admin no bundle da app 0; no servidor — `verify_system.js` secções 2–5 e 7–18 **238/238 em 21 s**, 0 erros no backend (a 6 precisa de `fake-indexeddb`, que não vai para produção; passa no PC); TCP até ao Supabase **5 ms** (do PC em Maputo 340–700 ms); browser contra o site público — `reports.mjs` passou e `flows.mjs` passou, 0 erros JS. BD depois de tudo: 2 contas, 1 loja (as fixtures de teste foram apagadas).
- Por fazer: ligar a nuvem laranja na Cloudflare + SSL "Full (strict)" e confirmar o IP real atrás dela; o fundador definir as senhas das 2 contas; login Google exige autorizar `https://genesismz.com` na consola Google; `CLAUDE.md` ainda menciona `admin.genesis.co.mz`.


### [2026-10-05] — Cloudflare a proteger genesismz.com; login Google por autorizar
- O fundador ligou a nuvem laranja nos 2 registos. Prova: `curl -D -` aos 2 sites e a `/api/auth/me` → `Server: cloudflare`, `CF-RAY …-JNB` (Joanesburgo), 200/200/401; `access.log` do nginx mostra `41.220.200.37` = o IP público do PC (o `cloudflare-realip.conf` funciona — limites por IP continuam por cliente). Modo SSL não é Flexible (sem ciclo de redireccionamentos); "Full (strict)" por confirmar pelo fundador.
- Login Google: o cliente OAuth `8132927831-ml0…` é o mesmo de `GOOGLE_CLIENT_ID`/`VITE_GOOGLE_CLIENT_ID`; o botão GIS (`renderButton`) só precisa da origem JavaScript `https://genesismz.com` (sem URIs de redireccionamento). Por verificar depois de o fundador guardar (5 min a horas).

### [2026-10-05] — Google OK em produção; emails (reset de senha) por configurar com Brevo
- Login Google confirmado pelo fundador em `https://genesismz.com` (conta `kleytonvelichane3@gmail.com` entrou e caiu no onboarding — captura). SSL da Cloudflare confirmado **Full (strict)** (captura).
- Reset de senha não entregou: log do servidor `[reset] codigo NAO entregue (sem SMTP/WhatsApp configurado)`; `MAIL_USER`/`MAIL_PASS` vazios no `.env` de produção (já pendente desde 09/2026). Correcto não mostrar o código no ecrã (`DEV_SHOW_RESET_CODE=false`).
- Decisão do fundador: **Brevo** (SMTP `smtp-relay.brevo.com:587`, remetente `Genesis <no-reply@genesismz.com>`). Novo `backend/scripts/configurar_email.js` (corre no servidor; chave escondida; envia email de teste e só guarda se funcionar; actualiza `.env` e a cópia mestra `/srv/genesis/backend.env`). Publicado (`9b937d8`). ⚠️ NÃO VERIFICADO até o fundador criar a conta Brevo, autenticar o domínio na Cloudflare e correr o script.
- Nota para o fundador: no CMD a chave é `"%USERPROFILE%\.ssh\genesis_do"` (o `$HOME` é do PowerShell, que está restrito no PC dele).

### [2026-10-06] — CLAUDE.md com o domínio real; teste do fundador no iPhone (lista de defeitos)
- `CLAUDE.md`: `admin.genesis.co.mz` → `admin.genesismz.com` (+ app em `genesismz.com`). Prova: `grep genesis.co.mz CLAUDE.md` → 0.
- Senhas das 2 contas: o fundador confirma que as definiu com `gerir-contas.bat`. Brevo: não consegue validar a conta (não recebe o código de verificação do telefone) → escolher outro fornecedor de email.
- Defeitos/pedidos do teste no iPhone (06/10), por confirmar e tratar um a um:
  - 🔴 Turno: depois de "Fechar turno" o caixista continua a vender (o turno é só a "janela desde o último fecho", `utils/shift.js:29`; não existe estado "turno fechado"); o cadeado sai do perfil sem fechar o turno; depois de fechar volta a entrar e vende.
  - 🔴 "Vendas" no terminal abre sem PIN do dono → o caixista vê o total e acerta o fecho cego. Fundador quer o PIN do dono para abrir a lista (e o cancelamento continua com motivo).
  - 🔴 QR dos recibos aponta para `https://genesis.co.mz/verify/…` (`receiptPrinter.js:18`, `PosDialogs.jsx:34`): domínio que não é nosso e rota `/verify` inexistente no frontend.
  - 🔴 Pesquisa do POS sensível a acentos ("acucar" não encontra "Açúcar").
  - Recibo: imprime em A4; deve imprimir no formato de talão (80/58 mm); A4 só como cópia em PDF guardada. Nome do ficheiro: `Recibo_<n> - <Loja> (DD-MM-AAAA - HH:MM:SS).pdf`; pastas `Lojas/<Loja>/{Recibos, Relatórios diários, semanais, mensais, Chenecas-Empréstimos}`.
  - Admin no iPhone: "Abrir modo suporte" não abre separador (Safari bloqueia `window.open` depois de `await`).
  - Admin: a senha temporária da conta aprovada devia ir por email automático, não ser enviada pelo fundador; email inventado `<nome>.<timestamp>@genesis.co.mz` quando o email já existe (`routes/admin.js:106-108`).
  - Dono: mudar a própria senha nas Definições (por confirmar se existe).
  - Produtos: editar (preço, custo, stock, código de barras, ícone); escolher ícone; ler código de barras com o leitor no formulário.
  - Onboarding: linhas vazias já visíveis (custos, trabalhadores, fornecedores) com exemplos (ex.: 300,00 MT) e texto mais claro sobre o "lucro real que vai para o bolso".
  - Novos (fora do spec actual — REGRA 8, autorizados pelo fundador): idioma PT/EN incluindo nomes de produtos e pesquisa bilingue; layout próprio para telemóvel/tablet; instalar como app (PWA "Adicionar ao ecrã principal").
- Segue-se: o fundador escolhe a ordem; proposta começa pelos 🔴 de turno/vendas.

### [2026-10-09] — Fase 7.1: turno fechado de verdade + "Vendas" só com o PIN do dono
- Decisões do fundador (09/10): turno fechado só reabre com o **PIN de autorização do dono** no terminal; o cadeado continua a ser **pausa** (não fecha o turno, mas os perfis mostram o estado). O fundador pediu também que o falso "abaixo do esperado" por vendas offline atrasadas fosse resolvido (clientes reais).
- Ficheiros: `backend/src/utils/shift.js` (`shiftStatus`; fechar turno fechado → 409), `backend/src/utils/authPin.js` (novo), `backend/src/routes/pos.js` (`POST /shift/open`, `POST /sales`, `shift_open` nos perfis), `backend/src/routes/sales.js` (409 `SHIFT_CLOSED`; GET recusado ao caixista; lista de falhas de PIN partilhada), `backend/src/utils/sessionScopes.js`, `frontend/src/pages/pos/{PosScreen,PosDialogs,Terminal}.jsx`, `backend/scripts/verify_system.js` (secções 2 e 10), `frontend/tests/e2e/flows.mjs`.
- Falso "abaixo do esperado": a venda offline ainda por enviar não está no servidor quando se fecha → entrava no esperado do turno seguinte. Correcção no fecho: envia a fila primeiro e recusa contar se ficar venda por enviar. Rejeitado de propósito: usar a hora do terminal como hora da venda (deixava um caixista esconder vendas do turno com datas antigas). Resta o caso de o mesmo caixista ter vendas por enviar noutro terminal — não tratado.
- Erros apanhados pela verificação (meus, corrigidos antes de declarar): as 2 rotas novas não estavam no âmbito `pos` (403 `SCOPE_RESTRICTED`); a regex do PIN perdeu a barra (`/^d{4,6}$/`) na edição por script — grep confirmou que não há outro caso.
- Prova: `verify_system.js` (todas as secções, contra Supabase com RLS) **271/271**, loja de teste apagada; `flows.mjs` no Chromium **todos os fluxos passaram** (Vendas com PIN errado/certo, fecho com venda por enviar recusado, turno fechado com produtos desactivados, cadeado + PIN do caixista não reabre, PIN do dono reabre); `vite build` OK; fixture apagada.
- Encontrado e NÃO corrigido (fora desta fase): aviso "Sem ligação: a usar o catálogo guardado" fica no ecrã depois de a rede voltar.
- Não feito: publicar em genesismz.com (pede confirmação do fundador).
- Segue-se (fase seguinte, após confirmação): QR dos recibos (domínio + rota `/verify`) e pesquisa do POS sem acentos.

### [2026-10-09] — Fase 7.2: QR dos recibos com página /verify + pesquisa sem acentos
- Ficheiros: novos `backend/src/routes/verify.js`, `frontend/src/pages/VerifyReceipt.jsx`, `frontend/src/utils/search.js`, `frontend/tests/search.test.mjs`; alterados `backend/src/index.js` (monta `/api/verify`), `frontend/src/App.jsx` (rota pública), `utils/receiptPrinter.js` (`saleVerifyUrl`), `pages/pos/PosDialogs.jsx`, `pages/pos/PosScreen.jsx`, `pages/owner/Products.jsx`, `scripts/verify_system.js` (secção 19), `tests/e2e/flows.mjs`, `tests/e2e/pos.mjs`.
- Porquê: teste do fundador no iPhone (06/10) — o QR apontava para `https://genesis.co.mz/verify/…` (domínio alheio, rota inexistente); a pesquisa do POS não encontrava "Açúcar" com "acucar".
- Decisões: o QR usa a origem da app (em produção `https://genesismz.com`); a página pública mostra só o que já está no recibo + estado — nada de custos/caixista. A mesma correcção de acentos aplicada nos 3 sítios com o mesmo padrão (POS, escolha de produto na quebra/pedido, Produtos do dono) — grep de `toLowerCase().includes` = 0 depois.
- Erros apanhados pela prova (no teste, não no produto): o 1.º `flows.mjs` comparava os bytes do PNG (browser/canvas ≠ Node) e procurava "Laurentina" numa venda de 2M + Coca-Cola. Passou a comparar pixels, com contraprova (o QR do domínio antigo tem de ser diferente).
- Incidente de escrita: a 1.ª tentativa de acrescentar estas entradas por `node -e` na shell perdeu o texto entre crases (substituição de comandos do bash). Detectado na releitura e corrigido à mão; nenhuma entrada antiga foi tocada.
- Prova: `verify_system.js 19` 8/8 (sem sessão 200, sem custos/caixista/ids, no-store, 400, 404, cancelada); `search.test.mjs` 4/4; `flows.mjs` todos os fluxos passaram, 0 erros JS; `pos.mjs` passou, 0 erros JS; `vite build` OK; fixtures apagadas. Regressão completa `verify_system.js` (secções 2–19, contra Supabase com RLS) **279/279**, loja de teste apagada.
- Não feito: publicar em genesismz.com (7.1 + 7.2 juntas, pede confirmação); push para o GitHub.
- Segue-se: paragem entre fases — o fundador escolhe o próximo item da lista de 06/10.

### [2026-10-09] — Publicação de 7.1 + 7.2 em genesismz.com e push
- Pedido explícito do fundador ("publica no genesismz.com e faz push e depois avance").
- Commit `8f9b348` em `main`; `git push origin main` → `4b7201a..8f9b348` (GitHub tinha 12 commits em atraso desde a Fase 6.2; agora `main...origin/main` igual).
- `APP_HOST=genesismz.com ADMIN_HOST=admin.genesismz.com bash deploy/publicar.sh 139.162.186.49` → "PUBLICADO 8f9b348" (1.º `curl` ao backend falhou durante o arranque; a verificação seguinte deu "backend OK"; serviço `active`).
- Prova de fora: `/` 200, `/verify/<uuid>` 200 (SPA), `/api/verify/<uuid inexistente>` 404 `RECEIPT_NOT_FOUND`, `/api/verify/xyz` 400, `/api/auth/me` 401, admin 200. Browser (`flows.mjs`) contra **https://genesismz.com** com loja de teste temporária (apagada no fim): **todos os fluxos passaram** (36 OK, 0 erros JS) — inclui os da 7.1 (turno fechado, Vendas com PIN, fecho com venda por enviar) e o QR = `https://genesismz.com/verify/<id>` com contraprova.
- Não feito: a bateria `verify_system.js` no próprio servidor (o comando foi recusado pelas permissões — e o meu `pkill` para parar o backend de teste podia atingir o de produção; ainda bem). A regressão completa foi feita a partir do PC contra a mesma BD (279/279).

### [2026-10-09] — Fase 7.3: aviso offline, modo suporte no iPhone, email já usado na aprovação
- Ficheiros: `frontend/src/pages/pos/PosScreen.jsx`, `admin-frontend/src/App.jsx`, `backend/src/routes/admin.js`, `backend/scripts/verify_system.js` (secção 11), `frontend/tests/e2e/flows.mjs`, `admin-frontend/tests/admin_flows.mjs`.
- 7.3a — aviso "a usar o catálogo guardado": a captura 29 (09/10) mostrava-o já com rede. Causa: nada voltava a pedir o catálogo depois de cair para a cópia local. Correcção: enquanto a fonte for a cache e houver rede, tenta logo e de 30 em 30 s. O 1.º teste que escrevi exigia o aviso durante o 1.º passo offline e falhou — também falhava na versão anterior (captura 26 sem aviso, Sumol a 40 un. depois da venda offline). Ou seja, nesse passo o pedido do catálogo não cai logo para a cache sob a emulação offline do Playwright; não investigado mais (fora da mini-meta). O teste passou a verificar o ponto da captura 29.
- 7.3b — "Abrir modo suporte" no Safari: o `window.open` vinha depois de um `await` (o Safari só deixa abrir no próprio toque). Agora o separador abre no toque e recebe o link depois (`opener = null`); bloqueado → link para tocar. Prova no Chromium, incluindo o bloqueio simulado (`window.open = () => null`).
- 7.3c — aprovação com email já usado: 409 `EMAIL_IN_USE` em vez de inventar um email. O caso "pedido sem email" ficou de fora (decisão do fundador).
- Prova: `verify_system.js 11` todas OK (incl. 409 EMAIL_IN_USE e pedido intacto); `flows.mjs` todos os fluxos, 0 erros JS; `admin_flows.mjs` 7/7, 0 erros JS; builds OK; fixtures apagadas.
- Não feito: publicar a 7.3 e o push (pedem confirmação); Safari real do iPhone.
- Segue-se: paragem entre fases.


### [2026-10-10] — Novo teste do fundador no iPhone (lista de pedidos, por planear)
- Recebido com 9 capturas. Nada implementado ainda; registado para não se perder (REGRA 8: pedidos explícitos do fundador).
- Verificado no código antes de planear: não existe página de auditoria para o dono; `DemandCapture` exige `product_id` (não aceita produto fora do catálogo nem quantidade/preço); o admin só ACRESCENTA ao catálogo-mestre (`POST /api/master_catalogs`), não edita; "Imprimir / PDF" dos relatórios usa `window.print()` (não funciona na app do ecrã principal do iPhone); recibo usa Web Serial (não existe no iPhone).
- Pedidos:
  1. Admin: editar produtos do catálogo-mestre (nome, custo, preço).
  2. Auditoria do dono: página nova com tudo (stock, edições, PINs…), filtros hoje/semana/mês e por tipo, abrir cada registo; retenção (fica o mês corrente + o anterior, o resto apaga-se) — modelo exacto por decidir.
  3. Vendas perdidas no terminal: o caixista regista também produtos fora do catálogo (texto livre, quantidade, preço unitário opcional); "algo semelhante no super admin" — por esclarecer.
  4. Formulário de produto: escolher o ícone (relâmpago, gota…); validade registada ali mesmo; o mesmo no "Novo produto"; ver o stock actual; botão "Stock" que guarda e abre o Stock com o produto escolhido.
  5. Stock: "Entrada de stock" passa a ser só para produtos NOVOS (nome, custo, preço, validade com vários lotes — ex.: 50 un. a 17, 50 un. a 20 —, fornecedor opcional); "Ajuste manual" com botões Adicionar/Retirar e quantidade positiva (sem escrever −50).
  6. 🔴 iPhone (app no ecrã principal): "Imprimir / PDF" dos relatórios não funciona; o recibo abre sem botão de voltar e prende o utilizador.
  7. Definições: dia da semana do relatório semanal e hora dos relatórios diário/semanal/mensal (envio por WhatsApp — o envio em si ainda não existe, exige Twilio).
  8. Leitor de código de barras e impressora: opção de ligar visível (formulário de produto, POS); ao entrar no perfil, perguntar pelos dispositivos com "Não tenho" para saltar.
  9. 🔴 Relatório: "mais vendidos" e "mais rentáveis" mostram todos os produtos vendidos (teste com 5 produtos → os 5 nas duas listas). Causa confirmada: `services/reports.js:110-112` ordena e corta em 10, sem limiar. Pedido: ranking por níveis (ex.: 10, 9, 8 → top 3; vendas de 2 e de 1 → só os de 2) — regra exacta por confirmar.
- Segue-se: o fundador confirma a ordem e responde às dúvidas; uma fase de cada vez.

### [2026-10-10] — Pedido adicional do fundador: leitura de código de barras pela câmara + códigos por unidade (por planear, entra na 8.8)
- Nada implementado; registado para não se perder (REGRA 8: pedido explícito do fundador).
- Pedido:
  1. No telemóvel, ler o código de barras com a câmara; ao apontar, se o código estiver registado num produto, o produto entra logo no carrinho (rápido e automático).
  2. Código não registado → mensagem "Produto não cadastrado".
  3. Stock desce sempre, com ou sem leitura; cada linha da venda regista se o código foi lido ou não.
  4. Em Stock: registar códigos por unidade (ex.: recebeu 3 águas → regista 3 códigos); na venda sai a unidade cujo código foi lido; vender sem ler conta como uma das unidades por ler (registou 3, vendeu 1 sem ler → espera só 2 leituras); vender todo o stock sem leituras apaga os códigos guardados desse produto.
- Dúvida a decidir antes de implementar o ponto 4: o código do fabricante (EAN) é igual em todas as unidades do mesmo produto (as 3 Águas Namaacha 1,5L têm o mesmo número), por isso o controlo unidade a unidade só funciona com etiquetas próprias com código único impressas pelo Genesis. Proposta: um código por produto (EAN) + câmara + marca "lido/não lido" por linha; etiquetas únicas só se o fundador quiser esse controlo em produtos específicos.
- Nota técnica: o Safari do iPhone não tem `BarcodeDetector`; a leitura pela câmara precisa de uma biblioteca (ex.: ZXing).
- Segue-se: o fundador decide o ponto 4; implementação na Fase 8.8 (dispositivos), depois das fases anteriores.

### [2026-10-10] — Fase 8.1: PDF dos relatórios e recibo no iPhone + ranking por níveis
- Decisões do fundador (10/10): ordem "defeitos primeiro"; ranking "top 3 níveis, sem o último"; auditoria "dono escolhe, mínimo 2 meses"; vendas perdidas no admin "pedidos fora do catálogo" (sem dizer a loja).
- Ficheiros: novos `backend/src/services/ranking.js`, `backend/tests/ranking.test.js`, `frontend/src/utils/pdf/{deliver,text,receiptPdf,reportPdf}.js`, `frontend/src/utils/timelineText.js`, `frontend/src/components/{PdfButton,PdfReadyDialog}.jsx`, `frontend/tests/e2e/fase8_1.mjs`; alterados `backend/src/services/reports.js`, `frontend/src/utils/receiptPrinter.js`, `pages/pos/PosDialogs.jsx`, `components/SaleDrawer.jsx`, `pages/owner/{Reports,Home,Products,Settings,Onboarding}.jsx`, `vite.config.js`, `package.json` (+ `jspdf@4.2.1`, `jspdf-autotable@5.0.8`).
- Causas: (1) `window.print()` não faz nada na app do ecrã principal do iPhone; (2) o recibo abria `window.open` → janela sem botão de voltar; (3) achado na prova: os Relatórios tinham 426 px num ecrã de 390 (grelha sem `grid-cols-1`), o telefone afastava o zoom e o rodapé da gaveta do recibo ficava fora do ecrã visível — pode ter contribuído para o "sem botão de voltar"; (4) ranking cortava em 10 sem limiar.
- Erros meus apanhados na prova: `manualChunks` para o jsPDF fez o `index.html` pré-carregar 422 KB em todas as páginas → revertido. No teste: contava a página inicial como "janela nova"; reutilizava a loja de teste (quantidades a dobrar); a captura de página inteira do Playwright desfaz por momentos a emulação de toque (o recibo seguia o caminho do computador) → no telemóvel só se captura o ecrã visível. As minhas sondas repetidas esgotaram o limite de logins do backend de teste (4100) → reiniciei só esse processo.
- Prova: `ranking.test.js` 6/6; restantes unitários backend (monthlyDeductions 8, paymentMethods 4, fefo 7, restock 7, shoppingList 5, monthClose 6) e frontend (search + offline_queue 12) a passar; `vite build` OK; `fase8_1.mjs` **32/32**, 0 erros JS (2×: antes e depois do último retoque); `reports.mjs` passou, 0 erros JS; `flows.mjs` todos os fluxos passaram, 0 erros JS (lojas de teste novas em cada um, apagadas); PDF diário (2 páginas) e talão desenhados com pdf.js e revistos (acentos certos, sem caracteres partidos, ranking certo).
- Não feito: iPhone real (só o fundador); publicar; `window.open('')` do WhatsApp (mesmo padrão, registado em Parte A).
- Segue-se: paragem — o fundador testa; depois 8.2 (formulário do produto: ícone, validade, stock, botão Stock).
