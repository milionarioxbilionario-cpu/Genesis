---
name: genesis-historico-auditoria
description: Histórico de auditoria e bugs do Genesis (Secções 12-13 do Prompt Mestre, auditoria até 13/09/2026) — o que estava confirmado correcto, bugs confirmados por prioridade (dois App.jsx, bug de moeda ×100 repetido, fórmula do relatório mensal, admin no bundle, etc.), itens por verificar, inventário funcional e análise crítica das 18 falhas. Usar ao investigar uma regressão, ao re-verificar algo que "já foi corrigido", ou antes de marcar um item como ✅ no Mapa Mental.
---

# Genesis — Histórico de auditoria (Secções 12-13 do Prompt Mestre)

Extraído literalmente de `Prompt_Mestre.txt`. É um RETRATO de 13/09/2026, não o
estado actual: vários itens já foram tratados depois (ver Parte A e Parte B do
`Mapa Mental/Mapa_Mental.md`, que é a fonte de verdade do estado real). Usar
isto para saber ONDE os bugs já apareceram e que padrões procurar (REGRA 6:
grep do mesmo padrão em todo o repositório), nunca como prova de que algo
está partido ou corrigido hoje.

--------------------------------------------------------------------------------
SECÇÃO 12 — ESTADO REAL VERIFICADO DO PROJECTO (auditoria até 13 de
Setembro de 2026, ficheiro a ficheiro, conteúdo real inspeccionado)
--------------------------------------------------------------------------------

Usar isto como ponto de partida para a Parte A do Mapa_Mental.md, e como
base para as cores do mapa 3D (SECÇÃO 11) até nova verificação.

### 12.1 — Confirmado como correcto ✅

| Item | Ficheiro | Prova |
|---|---|---|
| Conversão de centavos no Onboarding Wizard | `OnboardingWizard.jsx` | `sell_price: Math.round(Number(p.price_mzn \|\| 0) * 100)` — confirmado no código |
| `ProtectedRoute.jsx` | `frontend/src/components/ProtectedRoute.jsx` | Verifica `/api/auth/me`, trata loading/unauthorized/wrong-role, redirecciona por role |
| Protecção real das rotas de Super Admin | `backend/src/index.js` | `app.use('/api/admin', adminOriginCheck, authMiddleware, requireRole('super_admin'), adminRoutes)` — cadeia de middleware correcta na montagem |
| Isolamento de tenant nas rotas do Owner | `backend/src/routes/owner.js` | `router.use(auth); router.use(requireRole('owner'));` no topo, mais `ensureTenantScope(req)` usado consistentemente em todas as queries |
| `App.jsx` correcto (com ProtectedRoute em todas as rotas) | `frontend/src/App.jsx` | Todas as rotas `/owner/*` e `/pos` envolvidas em `<ProtectedRoute requiredRole=...>` |

### 12.2 — Confirmado como problema 🔴 (por resolver, por ordem de
prioridade)

1. **[CRÍTICO] Dois ficheiros `App.jsx` coexistem com comportamentos
   opostos.**
   - `frontend/src/App.jsx` — versão correcta, com ProtectedRoute em tudo.
   - `frontend/src/pages/App.jsx` — versão antiga, ZERO protecção de rotas,
     `/admin`, `/owner`, `/pos` todos acessíveis sem login.
   - Acção obrigatória: confirmar em `frontend/src/main.jsx` qual está a
     ser importado. Apagar por completo o outro. Nunca deixar os dois
     coexistirem.

2. **[CRÍTICO] Bug de moeda (×100) confirmado repetido em
   `Employees.jsx`, risco sistémico noutros formulários.**
   - `Employees.jsx`: `monthly_salary: Number(form.monthly_salary || 0)` —
     enviado SEM multiplicar por 100. O valor por defeito do formulário
     (`250000`) só faz sentido como centavos, o que sugere que quem
     escreveu sabia da regra mas esqueceu de aplicar a conversão no envio.
   - Acção obrigatória: fazer grep por todos os formulários que enviam
     valores monetários (`Debts.jsx`, `Goals.jsx`, `Suppliers.jsx`,
     qualquer form de custos fixos) e confirmar, um por um, que multiplicam
     por 100 antes de chamar a API. Não assumir que só o wizard tinha este
     bug.

3. **[GRAVE] Cálculo do relatório mensal (lucro líquido real) tem erros de
   fórmula.**
   - Em `backend/src/routes/owner.js`, `router.get('/reports/monthly', ...)`:
     - `total_rent` está SEMPRE hardcoded a `0`, nunca lê `fixedCosts` com
       `type === 'rent'`. A renda nunca é deduzida, seja qual for o valor
       configurado pelo Owner.
     - `total_supplier_delivery` soma o custo de entrega de cada
       fornecedor ACTIVO UMA VEZ, independentemente de quantas entregas
       houve no mês — devia ser calculado a partir das `stockEntries`
       reais do período.
   - Acção obrigatória: reescrever a função para separar `fixedCosts` por
     `type` (rent vs other) e calcular o custo de fornecedores a partir de
     entradas de stock reais no período, não do número de fornecedores
     activos.

4. **[GRAVE] Separação do Super Admin fisicamente incompleta.**
   - `admin-frontend/` existe como projecto separado (correcto).
   - Mas `frontend/src/pages/SuperAdmin/Dashboard.jsx` e
     `frontend/src/pages/AdminLogin.jsx` continuam DENTRO do bundle do
     frontend principal. Mesmo com as rotas desactivadas no `App.jsx`
     correcto, o código continua a ser compilado e servido ao browser de
     qualquer Owner/Cashier — inspeccionável no JS da app.
   - Acção obrigatória: remover fisicamente estes ficheiros do
     `frontend/`, mantê-los apenas dentro de `admin-frontend/`.

5. **[GRAVE] Confusão de responsabilidades na UI, confirmada pelo próprio
   fundador em teste real.**
   - `pages/Owner/POS.jsx` existe dentro da pasta do Owner — o Owner NÃO
     deve ter interface de vendas, deve ter gestão/visualização de
     caixistas.
   - O fundador reportou directamente: botões que não abrem nada, o painel
     do Owner a mostrar "Painel Super Admin" como opção, e formulários
     (ex: "cadastrar nova empresa") em HTML cru sem qualquer UI/UX
     cuidada.
   - Acção obrigatória: rever `App.jsx` e a navegação lateral do Owner
     para garantir que nenhuma rota de POS ou de Super Admin é alcançável
     a partir do painel do Owner. Investigar e corrigir botões/links que
     não navegam para lado nenhum.

6. **[MODERADO] Arquitectura backend inconsistente com o que o próprio
   plano do projecto prescreve.**
   - `backend/src/controllers/` está VAZIA. Toda a lógica de negócio vive
     directamente dentro dos ficheiros de `routes/*.js`.
   - `backend/src/validators/` está VAZIA. Zero validação de inputs com
     Zod, apesar de ser stack obrigatório definido desde o início.
   - Não existe `report.service.js` dedicado — a lógica de relatórios vive
     ad-hoc dentro de `routes/owner.js`.
   - Decisão a tomar (não assumir): ou se adopta definitivamente o padrão
     routes-fazem-tudo (mais simples, menos testável) e documenta-se essa
     decisão, ou migra-se a lógica para controllers/services como estava
     planeado. Não deixar as duas abordagens misturadas sem decisão
     explícita.

7. **[MODERADO] CORS globalmente aberto.**
   - `app.use(cors({ origin: true, credentials: true }))` aceita cookies
     de qualquer origem para toda a API, excepto `/api/admin` que tem
     `adminOriginCheck` a compensar. Antes de produção, restringir a lista
     real de domínios do frontend.

8. **[MENOR] Repositório com ficheiros residuais.**
   - `backend_server.log`, `tree.txt.save`, `Genesis - SaaS` (nome com
     espaço, sem extensão), múltiplos `run-*.sh` soltos na raiz. Limpar e
     configurar `.gitignore` correctamente.

9. **[RESOLVIDO/ESCLARECIDO] Rotas de debts/employees/goals/cashiers "em
   falta".**
   - Uma auditoria anterior assumiu que estas faltavam por não existirem
     ficheiros `routes/debts.js` etc. Isto está esclarecido: a lógica
     existe, mas dentro de `routes/owner.js` como rotas adicionais
     (`router.get('/debts', ...)`, `router.post('/employees', ...)`,
     etc.), não em ficheiros separados. Não é um bug — é só uma escolha de
     organização (ver ponto 6 acima sobre decidir se isto é aceitável).

### 12.3 — Por verificar / desconhecido ⚠️

- Se os scripts E2E (`e2e_test2.js`, `shift_closing_e2e.js`,
  `rls_validation.js`) foram de facto corridos recentemente com output
  real visível, ou se essa afirmação vem só de um resumo de outro agente
  sem prova anexada.
- Se `Debts.jsx` e `Goals.jsx` sofrem do mesmo bug de moeda de
  `Employees.jsx` (ver 12.2.2) — ainda não inspeccionados directamente.
- Se o middleware `adminOriginCheck.js` cobre correctamente todos os
  ambientes de produção (a lista de origens permitidas parece assumir só
  `localhost` em dev — confirmar variável de ambiente `ADMIN_ORIGINS` em
  produção).
- Estado real de fecho de turno, cancelamento de venda com PIN, e
  sincronização offline em produção (só documentado, nunca visto código
  directamente nesta auditoria).

### 12.4 — Inventário funcional completo (checklist de estado, gerado após
leitura de todo o repositório numa auditoria anterior — cruzar/confirmar
contra 12.1-12.3 acima antes de confiar cegamente)

| Módulo | Estado reportado | Qualidade reportada |
|---|---|---|
| Login (página única com redirect por role) | ✅ Feito | Razoável |
| JWT + httpOnly cookie | ✅ Feito | Bom |
| RLS no Supabase | ✅ Feito | Bom |
| Dexie.js (localDb.js) | ✅ Feito | Bom |
| Sync offline worker | ✅ Feito (useOfflineSync) | Razoável |
| POS básico (CashierDashboard) | ✅ Feito | Razoável |
| Impressão de recibo (Web Serial + fallback browser) | ✅ Feito | Razoável |
| Owner Dashboard (produtos, stock, fornecedores, relatórios básicos) | ✅ Feito mas monolítico | Fraco |
| PIN de cancelamento | ✅ Feito | Bom |
| Fecho de turno (shift closing) | ✅ Feito (E2E testado) | Bom |
| Super Admin Dashboard | ✅ Feito (no mesmo frontend — ERRADO) | Crítico |
| OnboardingWizard | ✅ Parcialmente feito | Crítico |
| PWA (vite-plugin-pwa) | ✅ Feito | Bom |
| Prisma schema completo | ✅ Feito | Bom |
| Scripts E2E (e2e_test2.js, shift_closing_e2e.js, rls_validation.js) | ✅ Feito | Bom |
| Módulo Chenecas (UI) | ❌ Em falta | — |
| WhatsApp / Twilio | ❌ Em falta | — |
| Relatórios Diário/Semanal/Mensal completos | ❌ Em falta | — |
| Módulo de Metas (barra de progresso) | ❌ Em falta | — |
| Módulo de Trabalhadores / Payroll | ❌ Em falta | — |
| Alertas de stock mínimo (UI + WhatsApp) | ❌ Em falta | — |
| Histórico de preços de custo | ❌ Em falta | — |
| Alertas de validade | ❌ Em falta | — |
| QR Code real nos recibos | ❌ Em falta (placeholder "QR" apenas) | — |
| Gestão de caixistas pelo Owner (UI) | ❌ Em falta | — |
| Painel Super Admin separado (URL diferente) | ❌ Em falta (está no mesmo frontend) | — |
| Wizard de onboarding em 5 passos completos | ❌ Em falta (wizard incompleto) | — |
| Route guards / Protected Routes | ⚠️ Ver 12.2.1 — dois `App.jsx` conflituantes | — |
| Audit Log viewer no frontend | ❌ Em falta | — |
| Demand Capture UI completa | ❌ Em falta | — |
| Relatório de desempenho por caixista | ❌ Em falta | — |
| Verificação de token expirado no carregamento | ⚠️ Ver useAuth hook — confirmar se implementado após correcções | — |

NOTA IMPORTANTE: as notas de progresso do fundador (SECÇÃO 21) afirmam
que várias destas correcções ("Em falta"/"❌") já foram tentadas e
aplicadas — mas o próprio fundador NÃO garante que resolveram o problema.
Por isso este inventário mantém o estado da auditoria original e a Parte A
do Mapa Mental deve ser re-verificada linha a linha, não copiada às cegas
(ver REGRA 3 e SECÇÃO 9 — protocolo anti-alucinação).

### 12.5 — Avaliação honesta do progresso (na altura da auditoria)

O projecto estava em Fase 2-3 de 9 do roadmap reprioritizado (SECÇÃO 16). A
fundação (Fase 0) feita mas com problemas. A autenticação (Fase 1) quase
completa. O onboarding (Fase 2) incompleto. O POS (Fase 3) básico mas
funcional. As fases seguintes (relatórios completos, chenecas, WhatsApp,
metas, polimento, super admin avançado) quase todas por fazer.

--------------------------------------------------------------------------------
SECÇÃO 13 — ANÁLISE CRÍTICA DETALHADA (todas as falhas encontradas na
auditoria, ordenadas por gravidade — "só apontar falhas, sem elogios, o
que é bom já está na SECÇÃO 12")
--------------------------------------------------------------------------------

**FALHA CRÍTICA 1 — Super Admin no mesmo frontend é um desastre de
segurança.**
O super admin é acessível em `/admin` no mesmo frontend React
(`<Route path="/admin" element={<AdminDashboard />} />`). Qualquer pessoa
que saiba o URL pode tentar brute force nessa rota. Por que é grave: expõe
a existência de um painel administrativo global a qualquer visitante; um
atacante com acesso ao JWT de um super_admin tem acesso a TODOS os
tenants; a separação no plano não é estética, é decisão de segurança
arquitectural; qualquer bot de scanning de rotas comuns encontra `/admin`
de imediato. O que o plano diz: `admin.genesis.co.mz` — subdomínio
separado ou URL completamente diferente. O que fazer: build React separada
ou subdomínio com middleware que rejeita qualquer pedido fora do domínio
correcto — não é uma mudança de uma linha, é separar fisicamente as duas
aplicações. (Ver estado em SECÇÃO 12.2, item 4 — parcialmente feito.)

**FALHA CRÍTICA 2 — Bug de moeda no OnboardingWizard (100x errado).**
`OnboardingWizard.jsx` usava `price_mzn`/`cost_mzn` directamente em MZN e
enviava assim para a API. A REGRA 6 (SECÇÃO 8) diz: dinheiro é inteiro,
nunca float, 150.50 MZN = 15050 centavos. Se o utilizador escreve 150.00
no campo de preço, o wizard envia 150 (não 15000) para o backend, que
espera centavos — 150 centavos = 1.50 MZN. O produto fica com preço de
1,50 MZN em vez de 150,00 MZN. Este bug apareceria logo no primeiro
onboarding de um cliente real: preços 100x menores, o proprietário vende a
1.50 MZN o que custa 150 MZN e tem prejuízo sem saber porquê. Correcção:
multiplicar por 100 antes de enviar (`Math.round(Number(p.price_mzn) *
100)`). (Estado: corrigido no wizard segundo SECÇÃO 12.1, mas confirmado
REPETIDO noutro ficheiro — SECÇÃO 12.2 item 2 — grep obrigatório em todo o
repositório.)

**FALHA CRÍTICA 3 — OnboardingWizard não era um wizard.**
Era uma página única com uma tabela de produtos, sem os 5 passos definidos
no plano (tipo de negócio → categorias adicionais → catálogo → custos
fixos/equipa → horário). Tipos de negócio disponíveis eram apenas
mercearia/restaurante/boutique — faltava justamente bottle_store, o
público-alvo número 1. Impacto: um novo cliente de bottle store não
encontra a sua categoria, escolhe "mercearia" por falta de opção, e recebe
um catálogo com arroz e açúcar em vez de cervejas e sumos — péssima
primeira impressão. (Estado: SECÇÃO 12.4 mostra como "parcialmente feito",
ver reescrita completa e lista de tipos correcta na SECÇÃO 6.1 e SECÇÃO
18.5.)

**FALHA CRÍTICA 4 — Owner Dashboard é um "Deus Componente" ingerível.**
`Owner/Dashboard.jsx` era um ficheiro monolítico com produtos,
fornecedores, stock, relatórios, PIN, tudo misturado — facilmente mais de
600 linhas num único componente React. Consequências: impossível
encontrar onde está o código de qualquer feature; cada nova feature torna
o ficheiro mais ilegível; bugs numa secção afectam as outras; testes
unitários impossíveis; qualquer IA (incluindo o próprio agente) tem
dificuldade em editar uma parte sem destruir outra. Correcção: dividir em
componentes separados conforme a árvore da SECÇÃO 5.4
(Products.jsx, Stock.jsx, Suppliers.jsx, Employees.jsx, Reports/*.jsx,
Debts.jsx, Cashiers.jsx, Goals.jsx, Settings.jsx).

**FALHA GRAVE 5 — Sem Route Guards (qualquer um acede a qualquer rota).**
`App.jsx` definia rotas mas não tinha `ProtectedRoute`. Qualquer pessoa
podia navegar directamente para `/owner`, `/admin`, `/pos` sem estar
autenticada. Um caixista podia escrever `/owner` na barra de endereços; o
backend rejeitaria as chamadas de API (JWT com role=cashier), mas o
frontend carregaria a página na mesma, mostrando erros e formulários que o
caixista não devia ver. (Estado: código do `ProtectedRoute.jsx` correcto
JÁ EXISTE — SECÇÃO 12.1 — mas coexiste com um `App.jsx` antigo sem
protecção nenhuma — SECÇÃO 12.2 item 1, CRÍTICO, resolver primeiro.)

**FALHA GRAVE 6 — Sem verificação de token expirado no carregamento.**
O login guardava o JWT num cookie httpOnly, mas ao carregar a app (ex:
utilizador abre o browser 25 horas depois) não havia lógica a verificar se
o token ainda era válido — o utilizador tentaria aceder a um endpoint,
receberia 401, e ficaria preso numa página com erro. Solução: hook
`useAuth` que, ao montar, chama `GET /api/auth/me` para validar o token;
se 401, limpar cookie e redirect para `/login`; se 200, injectar dados do
utilizador no estado global. (Código completo na SECÇÃO 18.3.)

**FALHA GRAVE 7 — QR Code nos recibos era um placeholder falso.**
`<div class="qr-box">QR</div>` — literalmente uma caixa com o texto "QR",
não um QR code real. Se escaneado, não funciona. Correcção: biblioteca
`qrcode` a gerar QR real com URL
`https://genesis.co.mz/verify/[sale_id]`. (Código completo na SECÇÃO
18.4.)

**FALHA GRAVE 8 — Nomes "LucroCerto" ainda podiam existir no código.**
O projecto foi renomeado para "Genesis" mas referências antigas ao
"LucroCerto" podiam persistir em comentários, variáveis, strings, ou nos
nomes de PDFs exportados (`LucroCerto_[tipo]_[data]_[nome-loja].pdf`).
Correcção: grep global por "LucroCerto"/"lucrocerto" em todo o
repositório e substituir por "Genesis"/"genesis".

**FALHA MODERADA 9 — Módulo de Chenecas completamente ausente no
frontend.** Schema da BD tem `debts` e `debt_payments`, backend
provavelmente tem endpoints, mas não havia interface no Owner Dashboard.
Esta é uma das funcionalidades mais diferenciadoras do produto.

**FALHA MODERADA 10 — Sem WhatsApp/Twilio em lado nenhum.** Zero código de
integração visível, nem backend nem frontend. O produto promete resumo
diário, alertas de chenecas (7/1/0 dias), alertas de stock mínimo, alertas
de validade — sem isto, perde um dos seus maiores diferenciais.

**FALHA MODERADA 11 — Sem módulo de metas (SaleGoals).** Schema tem
`sale_goals`, UI não tinha nenhuma barra de progresso.

**FALHA MODERADA 12 — Sem gestão de trabalhadores/payroll.** Schema tem
`employees`, UI do Owner Dashboard não mostrava este módulo.

**FALHA MODERADA 13 — Sem relatórios diário/semanal/mensal completos.**
Faltava tudo o descrito na SECÇÃO 6.3 — sobretudo o relatório mensal com
lucro líquido real, que é a principal proposta de valor do produto.

**FALHA MODERADA 14 — Owner não conseguia criar/gerir caixistas.** Sem
interface para criar, ver, ou desactivar caixistas no Owner Dashboard.

**FALHA MENOR 15 — Demand Capture UI incompleta.** Sem visualização no
Owner Dashboard dos produtos pedidos mas em falta.

**FALHA MENOR 16 — Histórico de preços de custo ausente no frontend.**

**FALHA MENOR 17 — Alertas de stock mínimo sem UI** (3 níveis:
normal/severa/crítica).

**FALHA MENOR 18 — Audit Log Viewer ausente.**

