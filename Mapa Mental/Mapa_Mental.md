# Mapa Mental — Genesis

Fonte única de verdade do estado real do repositório. Actualizado em cada sessão.

---

## Parte A — ESTADO ACTUAL

Actualizado: 13 de Setembro de 2026 (mini-meta 0.3 — fórmula relatório mensal)

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

### Roadmap — o que falta (não fazer nesta sessão)
- **Fase 0.1** — dois `App.jsx` → feita.
- **Fase 0.2** — conversão ×100 nos forms que enviam dinheiro → feita (ver Parte B).
- **Fase 0.3** — fórmula relatório mensal → feita (ver Parte B).
- **Fase 0.4** — resíduos e `.gitignore`.
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
