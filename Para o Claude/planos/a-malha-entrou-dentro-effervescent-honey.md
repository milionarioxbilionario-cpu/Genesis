# Genesis 2.1 — pedidos do fundador que a outra IA não fez (acrescento ao plano 2.0)

## Contexto

O fundador ditou uma lista longa de problemas e pedidos a outra IA, sobre uma versão **anterior** ao Genesis 2.0. Comparei-a com o código actual (`Onboarding.jsx`, `PosScreen.jsx`, `Reports.jsx`, `Debts.jsx`, `Team.jsx`, `Home.jsx`, `services/reports.js`, `catalogs.js`, `schema.prisma`) e com a especificação (`genesis-spec` 6.1–6.10).

Regras deste acrescento:
- **não desfaz nada** do plano 2.0 (`piped-prancing-sloth.md`);
- só acrescenta;
- trabalha uma mini-meta de cada vez, com prova curta no fim de cada uma;
- tem uma paragem real, com confirmação, entre fases.

**Decisões do fundador (respondidas agora):**
1. **Imagens:** do Open Food Facts quando existem (licença livre) ou foto própria do dono. Sem imagem, aparece o ícone da categoria.
2. **Atalhos:** teclas F.
3. **Validades:** por lote, com alerta e perda automática.
4. **Despesas:** custos fixos + despesas avulsas.

**Pedidos que NÃO se fazem, porque desfazem decisões do plano 2.0:**
- **Modo escuro.** O tema é único e claro por decisão tua. O onboarding fica no mesmo tema que o resto da app, e é isso que se verifica.
- **Abrir primeiro a Visão Geral em vez do onboarding.** A especificação 6.1 exige o assistente no primeiro login, e tu disseste "está bem". Fica igual, só se explica melhor cada passo.

**Já existem no 2.0** (o relato era da versão antiga), mas vão ser re-verificados no browser na Fase 0:
- botão "Nova cheneca", com data de vencimento, totais e vencidas (`Debts.jsx`);
- campos de código de barras, imagem e validade nos produtos;
- fonte Inter igual em todo o lado;
- o "servidor indisponível" ao vender. A causa era o timeout de 5 s das transacções, que já passou a 45 s, e foi isso que deixou o fecho de turno a dizer "turno já fechado": as vendas nunca chegavam ao servidor.

---

## Fase 0 — Base segura e reprodução dos bugs relatados

1. Commit do Genesis 2.0 na `main` (trabalho ainda por guardar).
2. Percorrer no browser, com Playwright e o `e2e_fixture`:
   - onboarding completo, incluindo carregar em "categorias adicionais" e o "importar catálogo" que dava "Dados inválidos";
   - venda real (tem de dar 201, não ir para a fila offline);
   - fecho de turno com valor abaixo do esperado (tem de contar a tentativa e não dizer "turno fechado").

   Cada bug que ainda se reproduza é corrigido aqui, com a causa e a prova.
3. Fecha com `verify_system.js` + e2e verdes.

## Fase 1 — Onboarding e catálogo moçambicano

**Catálogo-mestre.**
- Novo ficheiro `backend/prisma/seed/master_catalog.json` com pelo menos 25 produtos por tipo: bottle store, restaurante/churrasqueira, mercearia, padaria, talho e supermercado.
- Cada produto traz nome, marca, embalagem, categoria, preço de venda e custo sugeridos em centavos, código de barras EAN (quando é conhecido) e o URL da imagem no Open Food Facts.
- Os preços saem de pesquisa actual (2M, Manica, Txilar, Laurentina, Impala, Savanna, Namaacha…). Ficam marcados como "sugeridos, editáveis".
- Script `scripts/seed_master_catalog.js`, idempotente, escrito com o cliente de sistema.
- Esquema (só adições): `MasterCatalog.barcode String?` e `MasterCatalog.image_url String?`, nos dois schemas, com a migração aditiva guardada em `prisma/migrations/<data>_catalogo_mz/`.

**`catalogs.js`.**
- O import passa a aceitar `barcode` e `image_url`.
- Um erro de validação devolve 400 com `code` e o campo que falhou (deixa de haver o "Dados inválidos" mudo).
- O template de reserva em código é removido; o catálogo-mestre da BD passa a ser a única fonte.

**`Onboarding.jsx`.**
- O passo do catálogo ganha uma coluna "Código de barras". O leitor USB escreve ali e o Enter salta para a linha seguinte.
- A miniatura da imagem aparece em cada linha.
- Cada passo explica para que serve:
  - custos → entram no lucro real do mês;
  - horário → dispara o fecho do dia.
- O passo 4 ganha "Fornecedores" (nome, WhatsApp, custo de entrega), que a especificação 6.1 pede e falta.
- Categorias do POS: hoje vêm dos produtos importados, por isso uma bottle store sem higiene deixa de ver "Higiene". Confirmar no e2e.

## Fase 2 — POS: e-Mola, imagens, leitor, atalhos, acabamento

**Pagamentos.** Passam a ser `cash`, `mpesa`, `emola` e `card` (a especificação 6.2 separa M-Pesa e E-Mola).
- O valor antigo `mobile_money` continua a ser lido nos relatórios, com o rótulo "M-Pesa/e-Mola (antigo)".
- Ficheiros a mudar: validação em `routes/sales.js`, `PAYMENT_METHODS` em `services/reports.js`, `PAYMENT_LABEL` em `utils/format.js` e `PAYMENTS` em `PosScreen.jsx`.

**Imagens.**
- `components/ui/ProductImage.jsx`: imagem com `loading="lazy"`; se não houver ou falhar, mostra o ícone da categoria.
- As imagens ficam em cache do service worker do PWA, para funcionar offline.
- Os botões de produto passam a ser cartões com imagem em cima, nome em duas linhas e preço com `.num`.
- Em Produtos o dono carrega ou fotografa a imagem (`<input type=file accept=image/* capture>`), que é reduzida no cliente a 256 px WebP e guardada em `image_url` (data URL até ~30 KB). Não há armazenamento externo.

**Leitor de código de barras.** Os leitores USB emulam teclado, por isso não há nada para "ligar".
- Um código lido mostra uma faixa animada (150 ms, sem efeitos de jogo) com o código, o produto e "adicionado".
- Um código desconhecido mostra "Código 600123… não existe no catálogo" e um botão "Registar produto em falta", que chama o `DemandDialog`.

**Atalhos** (legenda visível no rodapé do cesto e em "?"):

| Tecla | Acção |
|---|---|
| F2 | Desconto |
| F3 | Valor recebido |
| F4 | Alterna Dinheiro → M-Pesa → e-Mola → Cartão |
| Ctrl+Enter | Cobrar |
| Alt+1..9 | Categoria |
| Setas + Enter | Escolher produto na grelha |
| Esc | Voltar à pesquisa |

Nada sem modificador que o leitor possa disparar, o que respeita a regra do 2.0.

**Acabamento.** Revisão visual com capturas a 1440 px e 390 px: grelha, tipografia e alinhamentos, só com tokens.

## Fase 3 — Stock por lotes e validades

**Esquema (só adições).**
- Novo modelo `StockLot { id, tenant_id, product_id, stock_entry_id?, quantity_remaining, expiry_date?, created_at }`, com a política RLS em `rls_v2.sql` e índices `(tenant_id, product_id, expiry_date)`.
- `Tenant.expiry_alert_days Int @default(7)`.
- Migração do stock actual: um lote sem data por produto.

**Saída de stock.**
- `inventory.js POST /stock` cria o lote com a validade.
- A venda e a quebra descontam por **FEFO** (primeiro o que expira primeiro), com a função pura nova `utils/fefo.js` e os seus testes.
- O código de barras identifica o produto, não a unidade. Por isso o leitor e a escolha manual descontam da mesma forma, sempre pelo FEFO, o que é o correcto.

**Perda automática.**
- `services/expiryJob.js` corre no arranque e de hora a hora. Percorre as lojas com o cliente de sistema e executa cada uma dentro de `runWithTenant`.
- Lotes vencidos com quantidade passam a `ShrinkageRecord` com `reason:'expired'`, e o valor fica no custo do lote.
- O `recorded_by` é o dono da loja (é preciso um id real) e fica a auditoria `AUTO_EXPIRY_LOSS`.
- O job é idempotente: um lote é zerado uma só vez.

**Alertas.** "Expira em ≤ X dias", por lote ("5 de 10 expiram a 12/10"), no Início e em Produtos → Stock.

## Fase 4 — Relatórios com rastreio completo e metas com histórico

**`services/reports.js` ganha:**
- **`timeline`:** todos os eventos do período por ordem.
  - vendas: hora ao segundo, nº diário, caixista, produtos, desconto, pagamento, total;
  - cancelamentos: quem, motivo e PIN usado;
  - quebras e validades: produto, código, lote, razão e valor;
  - entradas de stock, chenecas criadas e pagas, e despesas.

  Cada evento traz `amount` com sinal, e a query é paginada.
- **`goal_progress`:** a % da meta do mês que entrou no dia e o acumulado ("hoje +5%, acumulado 17%").
- **Na semana:** melhor e pior dia, o resumo de cada dia (expansível dentro do Semanal), o mais vendido (quantidade) vs o mais rentável (lucro) e o ranking de rupturas.
- **No mês:** comparação com o mês anterior; melhor e pior semana; tendências por produto (crescimento ou declínio vs mês anterior); chenecas (novas, recebidas e em aberto por cliente); despesas linha a linha; perdas por validade e quebra.
- **Recomendação de restock** (especificação 6.3), na função pura `services/restock.js` com testes:
  - média diária das últimas 4 semanas × dias a cobrir, + procura perdida − stock actual;
  - produtos com rotação baixa saem marcados "não reforçar";
  - estimativa do investimento + custo de entrega do fornecedor.
  - São regras, sem IA; a IA fica para mais tarde, por decisão tua.

**`Reports.jsx`.**
- Cada separador mostra os KPIs, depois o resumo e depois o "Rastreio" (tabela da timeline com filtros: vendas, perdas, cancelamentos…).
- Clicar numa venda abre o recibo completo num Drawer, reutilizando o `ReceiptDialog` de `PosDialogs.jsx`.

**Metas.** `GET /api/owner/goals/history` devolve os últimos 12 meses (meta, atingido, %), e o Início mostra um mini-gráfico com a comparação com o mês anterior.

## Fase 5 — Despesas, lista de compras e fecho do mês

**Esquema (só adições, com RLS).**
- `Expense { id, tenant_id, date, category, description, amount, created_by }`;
- `ShoppingList { id, tenant_id, name, status (draft|sent|received), supplier_id?, created_at }` + `ShoppingListItem { list_id, product_id, quantity, unit_cost }`;
- `Tenant.month_close_day Int @default(1)`.

**Despesas** (Definições → Custos e despesas):
- categorias pré-definidas e editáveis: Limpeza, Transporte do stock, Software, Luz, Água, Manutenção, Outros;
- entram em `computeMonthlyDeductions` como uma linha nova `total_expenses`, que passa a fazer parte da fórmula do lucro líquido;
- os testes de `monthlyDeductions.test.js` são estendidos.

**Lista de compras** (Produtos → Lista de compras):
- "Gerar a partir da recomendação" ou adicionar produtos manualmente;
- total do investimento + entrega do fornecedor escolhido;
- listas guardadas;
- "Contactar fornecedor" abre `https://wa.me/<telefone>?text=<lista>`. É grátis, não precisa do Twilio.

**Fecho do mês.**
- No dia `month_close_day` (ou depois), o primeiro acesso do dono abre um diálogo com o relatório do mês anterior e a lista de compras sugerida, com a pergunta "Contactar fornecedor agora?".
- Se responder Não, a lista fica guardada como rascunho.
- O "já visto" é registado por mês na auditoria (`MONTH_CLOSE_SEEN`).
- O envio automático do relatório para o WhatsApp do dono fica para quando o Twilio estiver configurado. Fica registado como pendente e não é inventado agora.

---

## Ficheiros principais

- **backend:**
  - `prisma/schema.prisma` + `schema.sqlite.prisma`, `prisma/rls_v2.sql`, migrações novas e `prisma/seed/master_catalog.json`;
  - `routes/{catalogs,sales,inventory,products,owner,settings}.js`;
  - `services/{reports,monthlyDeductions,restock,expiryJob}.js`, `utils/fefo.js`;
  - `scripts/{seed_master_catalog,verify_system}.js`.
- **frontend:**
  - `pages/owner/{Onboarding,Reports,Home,Products,Settings}.jsx`, `pages/pos/{PosScreen,PosDialogs}.jsx`;
  - `components/ui/ProductImage.jsx`, `utils/format.js`.

**Reutilizar:**
- `MoneyInput`/`mznToCents` (`utils/money.js`);
- `ReceiptDialog`;
- `httpError`/`asyncHandler` (`utils/http.js`);
- `writeAudit` (`utils/audit.js`);
- `prisma.runWithTenant`;
- `computeMonthlyDeductions`;
- `useApi`;
- `Drawer`, `Table`, `Tabs` do kit.

## Regras transversais

- Dinheiro sempre em centavos inteiros. Antes de declarar qualquer bug de moeda corrigido, faço grep a todo o repo.
- Todas as tabelas novas têm `tenant_id` + filtro na app + política RLS.
- Migrações só aditivas, com `migrate diff` + `db execute`.
- Mapa Mental (Parte A e B), "Oque ja fiz…" e `mapa_mental_status.json` actualizados no fim de cada mini-meta.

## Verificação (em cada fase, antes de dar como feito)

- **Testes unitários** `node:test`, com ficheiros novos:
  - `fefo.test.js`;
  - `restock.test.js`;
  - `expiryJob.test.js`, a lógica pura;
  - `monthlyDeductions.test.js`, estendido.
- **`verify_system.js`**, com secções novas contra o servidor real e o RLS activo:
  - import do catálogo com barcode;
  - pagamentos `mpesa`/`emola`;
  - lote + FEFO;
  - job de validade (cria a perda uma só vez; uma loja não vê o lote da outra);
  - timeline sem fuga entre lojas;
  - despesas no lucro líquido;
  - lista de compras isolada por loja.
- **e2e Playwright** (`frontend/tests/e2e/flows.mjs`), estendido:
  - onboarding completo com categoria adicional;
  - venda com o leitor simulado (escrever + Enter → faixa com o código);
  - atalhos F2/F3/F4/Ctrl+Enter;
  - e-Mola;
  - relatório diário → clicar na venda → recibo;
  - diálogo do fecho do mês.
- Capturas de ecrã a 1440 px e 390 px, revistas por mim.
- `npm run build` dos dois frontends + `prisma validate`.
