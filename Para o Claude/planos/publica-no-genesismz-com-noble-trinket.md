# Plano — publicar 8.3-B e fazer o resto da Fase 8 (8.4 → 8.8) sem paragens

## Contexto

Pedido do fundador (11/10): «publica no genesismz.com, faz push e avança para todas as fases restantes». Não é preciso parar para confirmar; só se houver uma decisão importante.

- A 8.3-B está no commit local `f7f2576`, ainda sem push e sem publicação.
- Falta o resto da lista de 10/10: 8.4 vendas perdidas, 8.5 auditoria, 8.6 catálogo-mestre no admin, 8.7 horários dos relatórios, 8.8 dispositivos.

**Regra 1 do CLAUDE.md:** quando o fundador pede «tudo sem parar», aplica-se o meio-termo combinado. As 8.4 a 8.8 contam como **mini-metas da Fase 8**. Cada uma leva:

- prova, documentação, commit, push e publicação;
- um checkpoint de 2–3 linhas.

A paragem a sério é no fim da Fase 8, com a regressão completa. Isto fica dito ao fundador no 1.º checkpoint.

**Decisões do fundador (11/10):**

- **8.7:** o Genesis guarda as preferências e tem o envio programado construído, mas **desligado** (`REPORTS_WHATSAPP=true` no servidor para ligar, depois de haver número WhatsApp Business aprovado). Nada é enviado aos donos sem ordem.
- **8.8:** impressora **USB (Web Serial) + Bluetooth (Web Bluetooth)**. O recibo é **sempre** guardado em PDF no aparelho (Android, iPhone e computador), haja ou não impressora.

**Ciclo de cada mini-meta:**

1. Implementar e provar:
   - unitários `node:test`;
   - secção nova do `verify_system.js` contra o backend 4100;
   - E2E Playwright;
   - capturas revistas.
2. Actualizar a documentação:
   - Mapa_Mental Parte A + B;
   - «Oque ja fiz…»;
   - `mapa_mental_status.json` + `node scripts/gen_mindmap_data.js`.
3. Commit em `main`, `git push origin main`, depois `APP_HOST=genesismz.com ADMIN_HOST=admin.genesismz.com bash deploy/publicar.sh 139.162.186.49`.
4. Prova de fora: `curl` + o E2E da mini-meta contra genesismz.com, com uma loja de teste apagada no fim.
5. Checkpoint curto ao fundador.

**Cuidados do ambiente (já aprendidos):**

- Reiniciar o backend 4100 entre testes de browser (limite de 5 logins por 15 min).
- Arrancar com `ADMIN_ORIGINS=http://localhost:5175,http://localhost:5185`.
- Nunca correr duas regressões em paralelo (partilham fixtures).
- A BD é partilhada entre produção e desenvolvimento: as migrações são só aditivas, via `prisma migrate diff` + `db execute`; os dois schemas ficam iguais.
- Para horas, usar a hora da BD (o relógio do PC está ~63 min atrasado).
- No fim de cada mini-meta, confirmar a BD limpa: 2 lojas reais, 1 super admin, catálogo 209 (mais o que a 8.6 mudar de propósito: nada).

---

## Passo 0 — Publicar 8.3-B + push
- `git push origin main` (`992e14d..f7f2576`).
- `publicar.sh` → «PUBLICADO f7f2576».
- De fora:
  - `/`, `/entrar` e admin respondem 200;
  - `/api/auth/me` responde 401;
  - `stock.mjs` contra https://genesismz.com com fixture temporária, apagada no fim.

## 8.4 — Vendas perdidas (caixista + agregado no admin)

**Hoje:**

- `DemandCapture` exige `product_id` e não tem nome livre, quantidade nem preço.
- `DemandDialog` (`frontend/src/pages/pos/PosDialogs.jsx:295`) só deixa escolher produtos do catálogo.
- O botão «Produto em falta» está escondido no telemóvel (`PosScreen.jsx:243`, `hidden md:inline-flex`).
- Há 2 bugs encontrados:
  - os registos de vendas perdidas e de quebras não enviam `seller_user_id` (`PosDialogs.jsx:271,300`), por isso o caminho offline com o cookie do terminal dá 401;
  - `demand_captures.js:43,54` grava `null` em colunas obrigatórias.

**Backend**

- **Migração `20261011_vendas_perdidas`:**
  - `product_id` deixa de ser `NOT NULL`;
  - colunas novas `product_name TEXT`, `name_key TEXT`, `quantity INT NOT NULL DEFAULT 1` e `unit_price INT` (centavos, opcional);
  - `CHECK (product_id IS NOT NULL OR product_name IS NOT NULL)`;
  - índice `(name_key)`.
  - Nos dois schemas: `product_id String?` e relação opcional.
- **`routes/demand_captures.js`:**
  - Zod: `product_id` **ou** `product_name` (2–80 caracteres).
  - `quantity` inteiro 1–1000 (por defeito 1); `unit_price` inteiro ≥ 0 opcional.
  - `name_key` vem de `nameKey()` (`utils/catalogSuggestions.js`).
  - Se o nome livre coincidir com um produto da loja (`nameKey`), grava-se como esse produto.
  - O utilizador é sempre real: `req.user.userId`, ou o `seller_user_id` validado por `posWriteAuth`. Isto corrige o `|| null`.
- **`services/reports.js`:**
  - `lost_demand` passa a incluir os pedidos fora do catálogo, agrupados por `name_key`, com `outside:true`, unidades e valor estimado (unidades × preço indicado).
  - A recomendação de compra (`restockFor`) usa a soma de `quantity`. Os registos antigos ficam com 1, por isso o comportamento não muda.
  - A cronologia mostra «Cliente pediu: X ×N (fora do catálogo)».
- **`routes/admin.js`:**
  - `GET /api/admin/lost-requests?days=30|90|365` — pedidos fora do catálogo de todas as lojas, agrupados por tipo de negócio e `name_key`:
    - lojas (só a contagem), pedidos, unidades, preço médio indicado, último pedido;
    - **sem nomes de lojas** (decisão de 10/10).
  - A agregação é uma função pura nova `groupLostRequests` em `utils/lostRequests.js`, com testes.
  - A visão geral passa a ter a contagem dos últimos 30 dias.

**Frontend**

- **`DemandDialog`:**
  - `Segmented` com «Do catálogo» (ProductPicker + quantidade) e «Fora do catálogo» (o que o cliente pediu, quantidade, preço unitário opcional em `MoneyInput` → centavos).
  - Envia `seller_user_id`.
  - O `ShrinkageDialog` também passa a enviar `seller_user_id`.
  - A Dexie não precisa de versão nova: os campos novos não são indexados.
- **`PosScreen`:** «Produto em falta» fica visível no telemóvel (botão de ícone com `aria-label`).
- **Relatórios do dono:** o cartão «Oportunidades perdidas» (`Reports.jsx:99`) e o PDF (`utils/pdf/reportPdf.js:122`) mostram quantidade, a marca «fora do catálogo» e o valor estimado.
- **admin-frontend:** página nova «Pedidos de clientes» (NAV + rota, mesmo padrão de `Suggestions()`), com filtro de período e tabela sem nomes de lojas.

**Prova**

- `lostRequests.test.js`.
- Secção 23 do `verify_system`:
  - registos do catálogo e fora dele;
  - 400 sem produto nem nome, para quantidade 0 e para preço negativo;
  - o caminho offline com o cookie do terminal + `seller_user_id` dá 201, e sem ele dá 403;
  - idempotência;
  - RLS;
  - o relatório agrupa;
  - o admin agrega duas lojas sem mostrar nomes; o dono no `/api/admin` leva 403.
- E2E novo `fase8_4.mjs`:
  - terminal no iPhone 13: o botão está visível;
  - registo fora do catálogo com 3 un. a 25 MT;
  - o dono vê o registo nos Relatórios;
  - o admin vê-o na página nova.
- Regressão `pos.mjs`.

## 8.5 — Auditoria do dono (filtros, detalhe, retenção)

**Hoje:**

- Já existe o separador Definições › Auditoria (`Settings.jsx:341-367`) e a rota `GET /api/owner/audit` (`owner.js:62`): últimos 150 registos, sem filtros nem detalhe.
- Não há retenção.
- A auditoria também guia bloqueios:
  - `shiftLock.js` lê o último `CASHIER_UNLOCKED`, sem limite de tempo;
  - `shift.js` lê o último `SHIFT_OPENED`;
  - `owner.js:371` lê `MONTH_CLOSE_SEEN` de meses atrás;
  - os PINs usam janelas de 15 min.

**Decisões minhas:**

- **Página:** continua dentro de **Definições › Auditoria**, porque a barra lateral do dono é fixa pelo CLAUDE.md. Passa a ser uma página completa.
- **Retenção «N meses»:** fica o mês corrente mais os N−1 anteriores, contados em meses de Maputo. Com 2 meses (o mínimo) fica este mês e o anterior.
- **Nunca se apagam** `CASHIER_UNLOCKED`, `SHIFT_OPENED` e `MONTH_CLOSE_SEEN`, porque guiam bloqueios e o fecho do mês.
- **Nunca se tocam** as linhas sem loja (`tenant_id NULL`, acções do admin).

**Backend**

- **Migração `20261011_auditoria_retencao`:** `Tenant.audit_retention_months INT NOT NULL DEFAULT 2`. Confirmar na BD real que o índice `idx_auditlog_tenant_created_at` existe; se não, criá-lo.
- **`utils/auditGroups.js`** (puro, com testes): o mapa grupo → acções.

  | Grupo | Acções |
  |---|---|
  | Vendas | venda, cancelamentos, descontos |
  | Stock | `STOCK_ENTRY`, `STOCK_ADJUSTMENT`, `LOT_EXPIRY_CHANGED`, quebras, `AUTO_EXPIRY_LOSS`, `IMPORT_CATALOG` |
  | Produtos | criar, editar, apagar |
  | Turnos | `SHIFT_*`, `CASHIER_LOCKED`/`UNLOCKED`, `POS_LOGIN` |
  | PINs e segurança | `AUTH_PIN_*`, `RESET_CASHIER_PIN`, `*_PIN_FAIL`, terminais, suporte |
  | Equipa | |
  | Definições e custos | |
  | Chenecas | |
  | Listas de compras | |
  | Outros | o que não cair noutro grupo |

  Também tem `periodStart(period, now)` para hoje / semana desde segunda / mês, à meia-noite de Maputo (reutiliza `dayInMaputo` de `utils/fefo.js`).
- **`GET /api/owner/audit`:**
  - aceita `period=today|week|month|all`, `group=`, `cursor=` (`created_at` + `id`) e `limit` 50;
  - devolve `{items:[{…, user_name, group}], next_cursor, retention_months, kept_since}`;
  - quem fez cada acção é resolvido com um mapa de utilizadores da loja;
  - o filtro por `tenant_id` mantém-se.
- **`GET /api/owner/audit/:id`:** o detalhe, com `old_value` e `new_value` já em objecto.
- **`PUT /api/settings/audit-retention`:** `{months}` ∈ {2, 3, 6, 12, 24}, auditado como `UPDATE_AUDIT_RETENTION` com o valor antigo e o novo.
- **`services/auditRetention.js`:**
  - função pura `retentionCutoff({now, months})`, com testes;
  - `runAuditRetention()` com o cliente de sistema: por loja, `DELETE` em lotes de 5000 onde `tenant_id = loja`, `created_at < corte` e a acção não está na lista protegida;
  - corre ao arrancar (+2 min) e de 6 em 6 horas, com `.unref()`, como o `expiryJob`;
  - desliga-se com `AUDIT_RETENTION_JOB=false`.
- **Antes de ligar** (a BD é partilhada com produção): fazer uma contagem a seco, por loja, do que seria apagado.
  - Se as lojas reais (Kleyton, SPAR) tiverem linhas a apagar, **paro e pergunto**: apagar é irreversível.
  - Se forem 0, ligo.

**Frontend (`Settings.jsx` › Auditoria, componente próprio `pages/owner/AuditLogPage.jsx`)**

- `Segmented` com Hoje / Semana / Mês / Tudo, e `Select` por tipo.
- Lista com etiqueta, quem fez, quando e um resumo, mais «Carregar mais».
- Ao tocar num registo abre uma `Drawer` com o detalhe:
  - campos «antes → depois» com nomes em português;
  - valores em centavos formatados com `money()`;
  - terminal e IP.
- As etiquetas passam para `utils/auditLabels.js`, que cobre todas as acções da lista do Explore; uma acção desconhecida mostra o código.
- A retenção é um `Select` («2 meses — este mês e o anterior»…) com a explicação. Baixar o valor pede confirmação.

**Prova**

- `auditGroups.test.js`.
- `auditRetention.test.js`: o corte a 1/10 e a 31/10 de Maputo, e para 2 e 12 meses.
- Secção 24 do `verify_system`:
  - os filtros de período e de grupo;
  - a paginação sem repetidos;
  - o detalhe;
  - RLS: outra loja dá 404;
  - o caixista leva 403;
  - retenção abaixo de 2 dá 400;
  - a retenção apaga as linhas velhas inseridas de propósito e deixa intactas as protegidas, as de outra loja e as do admin;
  - o bloqueio do turno continua certo depois da limpeza.
- E2E `fase8_5.mjs`:
  - filtros;
  - detalhe de uma entrada de stock (+N, custo) e de uma mudança de PIN;
  - a retenção é guardada;
  - iPhone a 390 px.

## 8.6 — Admin edita o catálogo-mestre

**Hoje:**

- `routes/master_catalogs.js` está montado fora de `/api/admin`, sem `adminOriginCheck` nem `asyncHandler`.
- O GET esconde o `id`, por isso não dá para editar.
- O POST recebe MZN em vírgula flutuante.
- O admin (`Catalogs()` em `App.jsx:327`) só mostra e acrescenta.

**Backend**

- Em `routes/admin.js`:
  - `GET /api/admin/master-catalog?type=&q=` devolve todos os campos e o `id`, em centavos;
  - `POST /api/admin/master-catalog` cria um produto (centavos, ícone, código);
  - `PUT /api/admin/master-catalog/:id` edita nome, categoria, custo, venda (> 0), código e ícone.
- Validação com `iconSchema` e com o regex de código de `catalog-suggestions/accept`.
- Nome repetido no mesmo tipo de negócio dá 409 `ALREADY_IN_CATALOG`, comparado com `nameKey`.
- Auditoria `MASTER_CATALOG_CREATED` / `MASTER_CATALOG_UPDATED` com o valor antigo e o novo.
- **Apagar fica de fora** (não foi pedido).
- Retirar `routes/master_catalogs.js` e a sua montagem (`index.js:230`), depois de `grep` confirmar que o único consumidor é o admin. O onboarding usa `/api/catalogs/:type`.

**admin-frontend**

- A página Catálogos ganha:
  - pesquisa;
  - tabela com ícone, nome, categoria, custo, venda e código;
  - um toque numa linha abre uma Drawer de edição (mesmo padrão do Drawer de `Suggestions()`: `MoneyInput` em centavos, `Select` de ícone);
  - «Novo produto» na mesma Drawer.
- Aviso: «As alterações valem para lojas novas; as lojas existentes mantêm os seus preços.»

**Prova**

- Secção 25 do `verify_system`:
  - editar dá 200 e a mudança aparece em `/api/catalogs/:type`;
  - venda 0, ícone inválido e código inválido dão 400;
  - nome repetido dá 409;
  - sem origem do admin dá 403; o dono leva 403;
  - fica auditado;
  - a rota antiga dá 404;
  - a linha de teste é apagada no `finally`.
- E2E: `admin_flows.mjs` alargado (editar o preço de um produto de teste, ver o novo preço no onboarding via API) e `fase8_2.mjs` em regressão.

## 8.7 — Dia e horas dos relatórios (+ envio programado desligado)

**Hoje:**

- O Tenant tem `opening_time`, `closing_time` e `month_close_day`.
- Não há dia do relatório semanal nem horas de envio.
- O `closing_time` não é usado por nada.
- Bug: `Settings.jsx:98` usa `/D/g` em vez de `/\D/g`.

**Backend**

- **Migração `20261011_horarios_relatorios`:**
  - `daily_report_time TEXT DEFAULT '21:00'`;
  - `weekly_report_day INT DEFAULT 1` (0 = domingo … 6 = sábado);
  - `weekly_report_time TEXT DEFAULT '08:00'`;
  - `monthly_report_time TEXT DEFAULT '08:00'`.
  - O dia do mensal é o `month_close_day`, que já existe.
- `PUT /api/settings/report-schedule` com Zod (`HHMM`, dia 0–6), auditado. `GET /api/settings` passa a devolver estes campos.
- **`services/reportSchedule.js`** (puro, com testes): `dueReports({now, tenant, sentKeys})` decide que relatórios tocam e de que período.
  - **Diário:**
    - se a hora escolhida é antes da hora de abertura (ex.: 00:00), cobre o **dia anterior completo** (o exemplo do fundador);
    - senão cobre o dia de hoje até essa hora.
  - **Semanal:** a semana anterior, de segunda a domingo.
  - **Mensal:** o mês anterior.
  - A chave de idempotência é, por exemplo, `daily:2026-10-11`.
- **`services/reportJob.js`:**
  - corre de 5 em 5 min **só com `REPORTS_WHATSAPP=true`**;
  - gera um texto curto: receita, vendas, lucro (bruto no diário; líquido no mensal), produto mais vendido e o link `https://genesismz.com/app/relatorios`;
  - envia com `sendWhatsAppAlert` para `Tenant.phone`;
  - regista `REPORT_SENT` / `REPORT_SEND_FAILED` com `entity_id` = chave, o que evita repetir depois de um reinício;
  - sem a variável, não faz nada.

**Frontend**

- **Definições › Loja**, cartão novo «Relatórios por WhatsApp»:
  - hora do diário;
  - dia da semana + hora do semanal;
  - hora do mensal (com o dia do «Fecho do mês» já existente);
  - ajuda dinâmica, ex.: «Às 00:00 recebe o relatório de ontem, completo.»;
  - nota «O envio automático ainda não está ligado — as preferências ficam guardadas.» (mostrada enquanto o servidor indicar `reports_whatsapp_enabled:false`).
- Corrigir o regex do dia do fecho.

**Prova**

- `reportSchedule.test.js`:
  - 00:00 → ontem;
  - 19:00 → hoje;
  - sexta 18:00 → semana anterior;
  - dia 1 → mês anterior;
  - já enviado → nada;
  - fronteira de Maputo.
- Secção 26 do `verify_system`:
  - guardar e ler;
  - 400 para hora inválida e dia 7;
  - caixista 403;
  - `runReportJob` com um enviador falso → 1 envio com o texto certo e auditado; 2.ª corrida → 0;
  - sem a variável → 0 envios.
- E2E: o `stock.mjs` cobre Definições (dias de aviso) + `fase8_7.mjs` curto (guardar dia/hora, recarregar e ver os valores, 390 px).

## 8.8 — Dispositivos: leitor, câmara, impressora USB/Bluetooth

**Hoje:**

- O leitor USB já funciona como teclado no campo de pesquisa do POS (`PosScreen.jsx:104-120`), mas nada o explica.
- A impressora usa `navigator.serial.requestPort()` **em cada recibo**, sem ESC/POS e sem Bluetooth.
- Não há câmara nem biblioteca de leitura.
- O código de barras não é único por loja.
- Não há passo de dispositivos no terminal.

**Decisões minhas:**

- **Leitura pela câmara:** `@zxing/browser` + `@zxing/library` (JavaScript puro).
  - Funciona no Safari do iPhone, que não tem `BarcodeDetector`, e no Android.
  - Um só caminho de código, que dá para testar.
  - Carregado à parte com `import()` dinâmico e incluído no precache, para o POS ler offline.
  - Formatos: EAN-13, EAN-8, UPC-A/E, Code 128.
  - Versões exactas confirmadas com `npm view` antes de instalar.
- **Câmara no POS:** leitura contínua.
  - Código conhecido → entra logo no carrinho, com aviso + vibração. O mesmo código não entra outra vez antes de 1,5 s.
  - Código desconhecido → «Produto não cadastrado».
  - O leitor USB passa a usar a mesma mensagem.
- **Pergunta dos dispositivos:** aparece depois do PIN, uma vez por caixista neste aparelho (`localStorage` `genesis_devices:<cashierId>`).
  - **Leitor:** «Leitor USB» com campo de teste («leia um código aqui») / «Câmara do telemóvel» / «Não tenho».
  - **Impressora:** «USB» (só se houver `navigator.serial`) / «Bluetooth» (só se houver `navigator.bluetooth`) / «Não tenho — recibo em PDF».
  - «Saltar» ou «Não tenho» não volta a perguntar.
  - Botão «Dispositivos» no cabeçalho do POS para mudar depois.
- **Recibo guardado sempre no aparelho** (esclarecimento do fundador, 11/10: «havendo ou não impressora, deve baixar a versão do recibo no aparelho», no Android e no iPhone):
  - Cada «Imprimir recibo» gera **sempre** o PDF e entrega-o; se houver impressora, também a envia para ela.
  - **Android:** descarga directa do ficheiro (vai para Transferências).
  - **iPhone:** a folha de partilha com «Guardar em Ficheiros». É o único caminho que não prende a app do ecrã principal (causa da 8.1); fica explicado na Parte A.
  - **Computador:** descarga directa, como hoje.
  - A ordem conta: a entrega do PDF começa **no próprio toque**, porque o iPhone só aceita partilhar no toque; a impressão corre a seguir, em paralelo. Se o iPhone recusar, aparece o diálogo «PDF pronto» da 8.1.
- **Impressão:**
  - **USB:** usa a porta já autorizada (`navigator.serial.getPorts()`), sem perguntar outra vez.
  - **Bluetooth:** `requestDevice` com os serviços habituais das impressoras BLE (`0x18F0`, `e7810a71-…`, `49535343-fe7d-…`, `0xFFE0`, `0xFF00`), característica de escrita em blocos de ≤ 180 bytes.
    - O aparelho fica ligado durante a sessão.
    - Volta a ligar com `getDevices()` quando o browser o tem; senão pede no toque de «Imprimir».
  - **Falha ou «Não tenho»** → PDF (como na 8.1), com aviso.
- **ESC/POS** (`utils/escpos.js`, puro, com testes):
  - inicializar;
  - texto sem acentos («Agua»), o mais seguro para impressoras desconhecidas;
  - negrito e centrado;
  - QR verdadeiro (`GS ( k`) com o link de verificação;
  - avanço + corte.
- Registado na Parte A como «⚠️ NÃO VERIFICADO em impressora real» (USB e Bluetooth) até o fundador testar. Bluetooth «clássico» (SPP) não é acessível por nenhum browser, e isso fica explicado no ecrã.
- **Formulário do produto** (`ProductDrawer.jsx:124`): botão «Ler com a câmara» ao lado de «Código de barras», que preenche o campo.
- **Código único por loja:** `routes/products.js` devolve 409 `DUPLICATE_BARCODE` ao criar ou editar com um código de outro produto activo da loja.
  - Antes, consultar a BD por duplicados já existentes; se houver em lojas reais, aviso no checkpoint sem mexer.

**Prova**

- `escpos.test.js`: bytes de inicialização, dobragem de acentos, QR e corte.
- Secção 27 do `verify_system`: 409 por código duplicado (criar e editar), mesmo código noutra loja OK, editar sem mudar o código OK.
- E2E `fase8_8.mjs`:
  - **Câmara falsa:** script `tests/e2e/make_barcode_y4m.mjs` desenha um EAN-13 da fixture num `.y4m`. O Chromium arranca com `--use-fake-device-for-media-stream --use-file-for-fake-video-capture`. Verifica:
    - a pergunta depois do PIN, e que «Não tenho» não volta a perguntar;
    - a câmara no POS põe o produto no carrinho;
    - um vídeo com um código desconhecido mostra «Produto não cadastrado»;
    - a câmara no formulário do produto preenche o código.
  - **USB e Bluetooth simulados** com `addInitScript` (falsos `navigator.serial` / `navigator.bluetooth`, que guardam os bytes). Verifica:
    - o 2.º recibo não volta a pedir porta;
    - os bytes começam por `ESC @` e trazem o QR;
    - o Bluetooth parte em blocos de ≤ 180 bytes;
    - **com impressora ligada, o PDF do recibo também é descarregado** (computador e Android emulado) ou partilhado (iPhone emulado);
    - sem impressora, só o PDF.
- Todos os E2E que entram no terminal (`pos`, `flows`, `fase8_1`, `fase8_4`…) passam a responder «Não tenho» à pergunta nova.

## Fim da Fase 8 — paragem a sério
- Regressão completa:
  - `verify_system.js` 2–27 numa corrida;
  - todos os unitários;
  - `flows`, `pos`, `stock`, `reports`, `fase8_1`, `fase8_2`, `fase8_4`, `fase8_5`, `fase8_8`, `admin_flows`;
  - backend reiniciado entre testes.
- `flows.mjs` contra genesismz.com.
- Relatório ao fundador:
  - o que mudou e a prova;
  - o que fica por verificar no hardware real (impressora USB e Bluetooth, câmara no iPhone);
  - as pendências antigas: limite de login, relógio do PC, `window.open('')` do WhatsApp, `shiftLock.js` no dia UTC, erro intermitente «Ab» do jsPDF.

## Quando paro e pergunto (decisões importantes)
- A contagem a seco da retenção mostra registos reais a apagar.
- Há códigos de barras duplicados em lojas reais.
- Uma migração não é puramente aditiva na BD real (só se espera o `DROP NOT NULL` da 8.4, que alarga e não apaga).
- Um teste falha por uma causa que exija mudar uma regra combinada.
