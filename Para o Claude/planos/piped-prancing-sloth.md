# Genesis 2.0 — sistema confiável e com aspecto premium

## Contexto

As correcções de segurança de 03/10 (pontos 2–7) estão feitas e provadas, mas ficaram 4 coisas em aberto:
- **(A)** validar o Hub/POS num browser real;
- **(B)** política de descontos;
- **(C)** experiência quando a sessão cai (toda a gente vai ter de voltar a entrar);
- **(D)** o resto da análise crítica: RLS decorativo, renda nunca deduzida, caixista vê custos e vendas de outros, painel admin que derruba o servidor e outros.

Além disso, o fundador quer que o produto **pareça** profissional. Hoje parece um jogo:
- tema vermelho e preto "Netflix" com modo claro "água de piscina";
- impressora 3D animada, brilhos, `AmbientLayer`, contadores animados;
- 34 blocos `style={{}}` só no Hub e cores espalhadas.

Isso tira credibilidade a um produto que se quer cobrar a 3.000 MZN por mês.

**Decisões do fundador (respondidas):**
1. Tema único claro **grafite + verde-esmeralda**: fundo `#FAFAF9`, texto `#1C1917`, acento `#047857`, perigo `#B91C1C`, aviso `#B45309`. Sem modo escuro.
2. **Terminal emparelhado + PIN do caixista** em vez do dono em modo quiosque.
3. **Descontos até X% livres**, acima disso exigem o PIN do dono. X é configurável e por omissão é 10%.
4. **Admin-frontend** redesenhado com o mesmo sistema visual.

**Fica de fora (só o fundador pode fazer):** rodar as 3 senhas expostas (`gerir-contas.bat`) e decidir se se reescreve o histórico do git. Deve ser feito antes de publicar.

Modo de execução: contínuo, com checkpoint curto e prova no fim de cada fase, como o fundador pediu. Nada é dado como feito sem teste a passar.

---

## Fase 1 — Base de dados e fundações do backend

**Esquema (só adições).** Alterar `backend/prisma/schema.prisma` e o espelho `schema.sqlite.prisma`:
- `User.pin_hash String?` — PIN de 4 a 6 dígitos do caixista, guardado em bcrypt.
- `Tenant.discount_free_pct Int @default(10)`, `Tenant.opening_time String?`, `Tenant.closing_time String?`. Isto substitui o `Map` em memória de `owner.js:14`.
- Novo modelo `PosTerminal { id, tenant_id, name, secret_hash, created_by, created_at, last_seen_at, revoked_at }`, com chave primária. Substitui o `device_keys`, que não tem PK.
- Aplicação, por causa do drift entre o esquema e as migrações:
  1. gerar o SQL com `prisma migrate diff --from-schema-datasource … --to-schema-datamodel … --script`;
  2. **ler o SQL e abortar se tiver algum DROP ou ALTER destrutivo**;
  3. aplicar com `prisma db execute` e guardar o SQL em `prisma/migrations/20261003_genesis2/`.

**Correcções do ponto (D) no backend:**
- **Renda.** Novo `routes/settings.js` com zod: CRUD de `FixedCost`, horário e limite de desconto. Hoje não existe nenhum `fixedCost.create`. O onboarding passa a gravar os custos fixos.
- **Caixista não vê custos.**
  - `GET /api/products` passa a omitir `cost_price` quando o papel é cashier.
  - `/api/dashboard/*` e `GET /api/inventory/stock` ficam só para owner.
  - `GET /api/sales` devolve ao caixista só as vendas dele, sem `unit_cost_price`.
- **Histórico de vendas para o dono.** `GET /api/owner/sales?from&to&cashier&method&page`, paginado, com cancelamentos e reimpressão (a especificação 4.2 exige-o).
- **Vendas canceladas fora dos totais.** Filtrar `status:'completed'` no dashboard e em `goals/current`. `reports/total` passa a usar `aggregate` em vez de carregar todas as vendas para a memória.
- **Relatório diário completo (especificação 6.3).** Totais por método de pagamento, top de produtos, descontos, cancelamentos, fechos de turno com divergências e pedidos de reposição.
- **Histórico de preços.** `ProductPriceHistory` passa a ser gravado quando o `cost_price` muda (em `inventory.js POST /stock` e em `products.js PATCH`).
- **Número diário.** `pg_advisory_xact_lock` por loja dentro da transacção de venda, para não haver números repetidos. Não faz nada em SQLite.
- **Painel admin.** `try/catch` em todas as rotas de `admin.js`, `process.on('unhandledRejection')` só com log e um `asyncHandler` partilhado. Também:
  - aprovar e rejeitar exige que a loja esteja em estado `pending`;
  - `unsuspend` repõe o estado anterior em vez de pôr `active`;
  - a impersonação passa a só leitura, com `scope:'support'` e uma lista de rotas permitidas de leitura, como a do quiosque.
- **Trial.** Passa a ser aplicado em `utils/tenantStatus.js`: trial expirado deixa ler e não deixa criar.
- **Endurecimento:**
  - `app.set('trust proxy', 1)`;
  - CORS com lista de origens vinda de `CORS_ORIGINS`;
  - `helmet`;
  - rate limit em `/auth/google`, `/auth/request-account` e `/refresh`;
  - o enum de tipos de negócio no pedido de conta passa a incluir `restaurante` e `boutique`.
- **WhatsApp.** `/whatsapp/test` e `/alerts/send` só enviam para o telefone da própria loja e têm rate limit.
- **Auditoria.** Nunca gravar `'system'`/`'unknown'` em `user_id`, que é FK: passa a ser obrigatório um id real. O `new_value` deixa de ser serializado duas vezes no fecho cego.

**Ponto (B) — descontos, com regra aplicada no servidor em `routes/sales.js`.** Se `discount_amount` for maior que `subtotal * discount_free_pct / 100`, o pedido tem de trazer `authorization_pin`. O PIN é verificado contra `tenant.cancel_pin_hash`, com os mesmos contadores de bloqueio do cancelamento. Fica auditado como `DISCOUNT_AUTHORIZED`, e o código de erro é `DISCOUNT_NEEDS_PIN` (403).

## Fase 2 — Terminal emparelhado e PIN do caixista (substitui o Hub e o quiosque)

Fluxo (o padrão do Square, Loyverse e Lightspeed):
1. O dono, em **Definições → Terminais**, gera um **código de emparelhamento** de 6 dígitos válido 10 minutos: `POST /api/owner/terminals/pairing-code`.
2. No PC do balcão abre-se `/terminal`, introduz-se o código (`POST /api/pos/pair`) e o servidor grava um cookie httpOnly `terminal` válido 1 ano, com o segredo guardado em hash.
3. O ecrã do terminal mostra os perfis dos caixistas (`GET /api/pos/terminal`). O caixista toca no seu perfil e digita o PIN (`POST /api/pos/login`). O servidor emite uma sessão de caixista com `scope:'pos'` e `terminalId`, válida 12 h.
4. Para trocar de caixista: `POST /api/pos/lock` apaga a sessão e o terminal fica emparelhado.
5. **O fecho cego passa a ser feito pelo próprio caixista:** `GET /api/pos/shift` e `POST /api/pos/shift/close` reaproveitam a lógica de `owner.js close-shift-blind` e `utils/shiftLock.js`. **Desbloquear um perfil é feito pelo dono no painel dele** (Equipa → Desbloquear), por isso a senha do dono nunca é escrita no balcão.
6. Fila offline: `POST /api/sales`, `/demand_captures` e `/shrinkage_records` aceitam a sessão do caixista **ou** o cookie do terminal. Com o cookie do terminal, o `seller_user_id` tem de ser um caixista activo da loja. Isto permite sincronizar depois de a sessão de 12 h expirar.

Outras mudanças desta fase:
- **Defesa em profundidade.** `utils/kioskScope.js` passa a `utils/posScope.js`, com a lista de rotas permitidas para `scope:'pos'`.
- **Login.** `/api/auth/login` passa a recusar o papel cashier com "Use o terminal da loja".
- **Código que sai.** Removem-se o modo quiosque, `Hub.jsx`, `hubSession.js`, `PosGate`, `useIsolatedScreen`, `owner/kiosk/*`, `operate`, `verify-password`, `DeviceKeys.jsx` e o código de device keys no frontend. As rotas `device-keys` deixam de estar montadas.
- **Reutilizar o que existe:** `utils/tokens.js` (`setSessionCookies` com `scope`), `utils/sessionUser.js` (validação de `pv`, conta activa) e `passwordCheckLimiter`.

## Fase 3 — RLS a sério (ponto D: "isolamento decorativo")

- **SQL em `prisma/rls_v2.sql`**, que substitui `rls.sql` e `rls_policies.sql` (os dois são apagados):
  - criar o papel `genesis_app` com `NOBYPASSRLS`, LOGIN e grants DML;
  - as políticas passam a usar `current_setting('app.tenant_id', true)`;
  - `Tenant` e `User` ficam limitados ao próprio tenant;
  - políticas para `PosTerminal`.
- **`utils/prisma.js`:**
  - `AsyncLocalStorage` com o tenant do pedido, preenchido pelo `authMiddleware` e pelo middleware do terminal;
  - um `$extends` que envolve cada operação em `$transaction([set_config('app.tenant_id', t, true), op])`;
  - transacções interactivas recebem o `set_config` no início, através de `applyTenantRls`, que já existe.
- **Cliente privilegiado** (`prisma.system`, ligado com o `postgres` actual) **só** para login, refresh, `sessionUser`, admin, terminal/pair e scripts. Fica numa lista explícita e documentada no CLAUDE.md.
- **Variáveis de ambiente.** `DATABASE_URL` passa a `genesis_app`, e `SYSTEM_DATABASE_URL` é o actual. Se o classificador de permissões bloquear a criação do papel ou a alteração das credenciais, entrego o SQL e os passos ao fundador e o resto continua.
- **Antes de mudar, medir a latência.** Recomendar alojar o backend em `eu-central-1` (os ~1,2 s por query são da rede de Maputo).

## Fase 4 — Design system (fonte única, sem redundância)

**Remover:**
- `ui/theme-light.css`, `ui/theme-toggle.css`, `ui/animations.css`;
- `theme/` inteiro (ThemeProvider, ThemeToggle, PoolWater);
- `Printer3D`;
- de `components/ui`: `AmbientLayer`, `GlowCard`, `usePointerGlow`, `SheenBar`, `CountUp`, `Reveal`, `Sparkline` decorativa;
- os 32+ blocos `style={{}}` e qualquer hex escrito à mão fora dos tokens.

**Novo `ui/tokens.css`:**
- **Cor.** Neutros "stone" (bg `#FAFAF9`, surface `#FFF`, subtle `#F5F5F4`, border `#E7E5E4`, text `#1C1917`, muted `#78716C`), acento `#047857` (hover `#065F46`, fundo suave `#ECFDF5`), danger `#B91C1C`, warning `#B45309`, info `#1D4ED8`. As cores semânticas só aparecem em estados com significado.
- **Tipografia.** Inter self-hosted com `@fontsource-variable/inter` (funciona offline no PWA) e números tabulares em todo o dinheiro. Escala 12/13/14/16/20/24/30.
- **Forma e movimento.** Raio 6/8/12, espaçamento em base 4, uma única sombra subtil para popovers e modais. Movimento só de 120–160 ms em hover/foco/abrir modal, com `prefers-reduced-motion` respeitado.
- **Tailwind.** `tailwind.config.js` mapeado 1:1 aos tokens e utilizado como forma principal de estilizar. O `index.css` fica com o reset e a base.

**`components/ui` reescrito, cada peça com um só propósito:**
- `Button` (primary/secondary/ghost/danger; sm/md/lg), `IconButton`;
- `Input`, `Select`, `Field`, `MoneyInput` (escreve em MZN e devolve centavos via `utils/money.js`), `PinPad`;
- `Card`, `Stat` (KPI com variação vs período anterior, sem animação);
- `Table` densa (cabeçalho fixo, números à direita, ordenação, paginação);
- `Badge` de estado, `Tabs`, `Dialog`, `Drawer` (formulários de edição em painel lateral), `ConfirmDialog` (substitui `window.prompt`/`confirm`), `Toast`, `EmptyState`, `Skeleton`, `PageHeader`, `Toolbar` (pesquisa e filtros).

**Gráficos.** Recharts com o tema dos tokens: série principal no acento, comparação em cinza, sem gradientes.

## Fase 5 — Reconstruir os ecrãs

**Arquitectura de informação do dono** (sem duplicados; cada função da especificação fica coberta). Shell: barra lateral branca de 240 px com o nome da loja, barra superior com o título, o indicador online/pendentes e o menu do utilizador; conteúdo com largura máxima de 1200 px; em mobile a barra lateral vira gaveta.

| Item | Conteúdo |
|---|---|
| **Início** | KPIs de hoje e do mês (receita, lucro bruto, vendas, ticket médio), meta do mês (barra com as cores da especificação; o bónus fica em azul `info`), alertas de stock (3 níveis), chenecas a vencer, últimas vendas |
| **Vendas** | Histórico filtrável, detalhe em drawer, cancelamentos, fechos de turno e divergências, reimpressão |
| **Produtos** | Tabs Catálogo / Stock (entradas, ajustes, validades) / Histórico de preços |
| **Fornecedores** | Lista + drawer + compras |
| **Chenecas** | Resumo, lista com estados, nova cheneca, pagamento parcial (hoje só existe a listagem) |
| **Equipa** | Caixistas (criar, definir PIN, desactivar, desbloquear, desempenho) + Trabalhadores (salários) |
| **Relatórios** | Tabs Diário / Semanal / Mensal (cascata receita → … → lucro líquido real) + exportar PDF |
| **Definições** | Loja, Horário, Custos fixos (renda), Descontos e PIN de autorização, Terminais, Auditoria |

O onboarding sai do menu: só aparece no primeiro login, em 5 passos com indicador de progresso, e grava os custos fixos.

**Terminal POS (ecrã inteiro):**
- **Barra superior:** loja, caixista, estado offline/pendentes/recusados, botão Bloquear.
- **Esquerda:** pesquisa sempre focada (o leitor de código de barras faz Enter → adiciona o produto exacto), chips de categoria, grelha de produtos.
- **Direita:** carrinho com stepper de quantidade, desconto (pede PIN acima do limite), método de pagamento em controlo segmentado, valor recebido e troco, e o botão principal "Cobrar".
- **Recibo:** pré-visualização simples com QR.
- **Removido:** os atalhos de dígitos e o Enter global, que causavam vendas acidentais com o leitor.
- **Também:** se a API de produtos falhar, sai o catálogo de demonstração; a lista de produtos passa a ficar guardada no Dexie, o que dá offline-first real.

**Restantes ecrãs:** Login (cartão único, sem efeitos), Pedir conta, Recuperar senha, Emparelhar terminal, Grelha de perfis + PinPad.

**Ponto (C) — sessão.** Um interceptor axios em `utils/api.js` trata `PASSWORD_CHANGED`, `ACCOUNT_INACTIVE` e `TENANT_*`: redirige com a mensagem certa e preserva a fila offline.

**Admin-frontend.** O mesmo design system (tokens, Inter, componentes), com o `baseURL` vindo de `VITE_API_URL` em vez de `localhost` fixo. Visão: Pedidos, Lojas (estado, trial, actividade), Detalhe da loja em modo suporte só de leitura, Catálogos-mestre, Auditoria.

## Fase 6 — Verificação (ponto A) e documentação

- **Testes de backend.** `backend/scripts/verify_security_fixes.js` passa a `verify_system.js`, com secções:
  - terminal: emparelhar, PIN, bloqueio por PIN errado, `scope:'pos'` não chega ao dono, sincronizar com o cookie do terminal;
  - descontos: limite e PIN;
  - custos fixos → renda no relatório mensal;
  - caixista sem custos nem vendas alheias;
  - admin: erro não derruba o servidor;
  - **RLS:** o cliente `genesis_app` sem tenant devolve 0 linhas e com o tenant A não vê o B;
  - mais as regressões 3–7 que já existem.
- **Teste do frontend.** `frontend/tests/offline_queue.test.mjs` é actualizado.
- **Browser real.** `npx playwright install chromium` e testes e2e em `frontend/tests/e2e/`:
  - login do dono → Início;
  - emparelhar o terminal → PIN → vender → recibo;
  - `context.setOffline(true)` → vender → indicador de pendentes → online → sincronizado, confirmado na BD;
  - desconto acima do limite pede PIN;
  - `/owner` com sessão pos → volta ao terminal.
  - **Capturas de ecrã de todos os ecrãs principais a 1440 px e 390 px, revistas por mim** para coerência visual: nenhuma cor fora dos tokens, alinhamentos certos, sem redundância.
- **Limpeza.** `git rm` dos dumps versionados (`_p4000.txt`, `_p4010.txt`, `_proc.txt`, `backend/_c*.txt`, `frontend/_*.txt`, `frontend/bl.txt`, etc.) e dos scripts `tmp_*` / `(copy 1)` em `backend/scripts`. A lista é mostrada antes de remover.
- **Documentação.** Mapa Mental (Parte A e B), "Oque ja fiz…" e CLAUDE.md: comandos, regra do cliente privilegiado, `posScope`, design tokens.

## Ficheiros principais

- **backend:**
  - `prisma/schema.prisma` + `schema.sqlite.prisma`;
  - `src/utils/{prisma,tokens,sessionUser,posScope,tenantStatus}.js`;
  - `src/middleware/{auth,terminalAuth}.js`;
  - `src/routes/{pos,settings,sales,owner,admin,products,inventory,dashboard,auth}.js`;
  - `src/index.js`;
  - `prisma/rls_v2.sql`.
- **frontend:**
  - `src/ui/tokens.css`, `tailwind.config.js`, `src/components/ui/*`;
  - `src/layouts/AppShell.jsx` (substitui `CRMLayout`), `src/App.jsx`, `src/utils/api.js`;
  - `src/pages/**`: Terminal, PosScreen, Owner/*;
  - `src/db/localDb.js` (v7: cache de produtos).
- **admin-frontend:** `src/App.jsx` partido em páginas, com os tokens partilhados.

## Riscos e mitigação

- **Migração com drift:** aplicar só SQL aditivo revisto, e fazer cópia das tabelas tocadas antes (`CREATE TABLE … AS`).
- **RLS pode partir rotas esquecidas:** o teste de RLS corre contra **todas** as rotas do `verify_system.js`, e qualquer 500 bloqueia a fase.
- **Logout geral:** tokens com `pv` já obrigam a novo login. Os terminais são emparelhados uma vez por loja; documentar no "Oque ja fiz".
- **Classificador de permissões:** criar o papel na BD e alterar o `.env` pode ser bloqueado. Nesse caso entrego o SQL e os passos ao fundador e o resto continua.
