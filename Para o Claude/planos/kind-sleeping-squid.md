# Plano — Genesis depois da Fase 16: etapas completas, uma de cada vez

## Contexto
O fundador testou o genesismz.com (tablet, telemóvel e PC) e mandou uma lista longa de pedidos. Esses pedidos substituem a ordem antiga das Fases 17–20:
- correcções;
- terminal do guarda;
- mapa 3D ao vivo;
- painel de admin com o design novo;
- vários estabelecimentos e gerente;
- modos de negócio separados (nhonguista/importador, restaurante, fast food, churrascaria, hotelaria, arrendamento, farmácia, clínica, posto de combustível);
- venda personalizada (artigo fora do catálogo, com a opção de o acrescentar);
- catálogo-mestre com dados reais;
- mapa mental 3D refeito.

**Modo de trabalho novo (pedido explícito):**
- Faço uma **etapa inteira**, com todas as partes, testes, commits e publicação em genesismz.com, e **só paro no fim da etapa**.
- No fim da etapa aviso e **pergunto qual é a próxima**, com opções numeradas.
- Se a sessão cair, retomo pelo registo: Mapa Mental, Parte B, mais a memória.
- Isto substitui o «seguir sem parar até ao fim do plano» de 25/10.
- Fica guardado na memória `autonomous-phase-runs`, que actualizo logo ao começar.

**Decisões do fundador nesta conversa:**
- Mapa = **Mapbox**. Precisa da conta e da chave do fundador; peço-as quando chegarmos à etapa do mapa. Até lá nada depende disso.
- Primeira etapa = **A. Correcções rápidas**.

**Antes da etapa A:** correr `fase16.mjs`, `flows.mjs` e `admin_flows.mjs` contra genesismz.com. Faltou fazê-lo quando o limite de uso acabou.

## Regras que valem para todas as etapas
Seguem o CLAUDE.md:
- dinheiro em centavos inteiros;
- RLS em todas as tabelas novas com `tenant_id`;
- migrações só aditivas, com `backup_db.js` antes e aplicadas com `apply_sql.js`;
- textos em PT e EN (`i18n.test.mjs` e `serverLang.test.js` têm de passar);
- `verify_system` com uma secção nova por etapa;
- um e2e novo em `frontend/tests/e2e/`;
- capturas revistas a 390, 768 e 1440 px;
- Mapa Mental (Partes A e B), `Diario do Genesis…txt`, `backup_claude.mjs`, commit em `main` sem linhas Claude, `deploy/publicar.sh`, e2e contra produção.

**Textos para o cliente:**
- nunca falar de «base de dados», «servidor», «camadas» e afins;
- «loja» passa a **«estabelecimento»** (ou «negócio») em todo o lado.

---

## Etapa A — Correcções rápidas (próxima a fazer)
1. **Site (landing):**
   - **«Falta dinheiro na caixa»:** resumo mais claro e «Ver mais detalhes» com o exemplo do fundador:
     - conta-se só o dinheiro vivo; M-Pesa, e-Mola e cartão não entram;
     - exemplo de 17 000 MT esperados contra 16 000 MT escritos;
     - avisos das tentativas que restam;
     - bloqueio à 3.ª tentativa;
     - «onde estão os 17 000 que contaste?».
   - **Recibos com QR:** acrescentar o terminal do guarda e a fraude de reimprimir ou editar o recibo. Só entra no site quando a etapa B existir; até lá não se anuncia.
   - **Para quem:** lista separada sem «A / B»:
     - padaria, pastelaria, cafetaria, loja de bebidas;
     - restaurante, churrascaria, fast food;
     - salão/barbearia, nhonguista, importador.
     - Só se anunciam os tipos que já funcionarem; os outros ficam para quando os modos existirem.
   - **Imagens:**
     - telemóvel mais ao centro, para não tapar o cesto;
     - valores maiores na loja de demonstração, cerca de 184 000 MT («Hoje até agora»);
     - capturas refeitas sem «cheneca».
   - **Favicon no Google:**
     - confirmar `/favicon.ico` 48×48 servido com o tipo certo;
     - JSON-LD `logo`;
     - pedir nova indexação na Search Console (pelo Chrome do fundador).
2. **«Txeneka» em tudo:**
   - grep de `chenec|cheneca|chineca` no código, nos textos do servidor (`utils/lang.js`, alertas, sino — a captura mostra «Cheneca vencida»), nas capturas e nos dados de demonstração;
   - os dados antigos da loja do Kleyton só no texto mostrado.
3. **Registo (pedido de conta + onboarding):**
   - **Tipos de negócio separados,** com ícones:
     - bottle store, loja de bebidas, mercearia/contentor, supermercado;
     - padaria, pastelaria, cafetaria, talho;
     - restaurante, churrascaria, fast food, boutique, salão/barbearia;
     - farmácia, clínica, posto de combustível;
     - nhonguista, importador, hotelaria, arrendamento;
     - «outro».
   - Os tipos sem modo próprio ainda usam o modo comércio; o modo deles chega nas etapas E–H.
   - **Passo «Custos fixos e equipa»:**
     - texto novo com o exemplo do fundador («quanto vai realmente para o seu bolso», combustível do carro);
     - as linhas de renda, outros custos, trabalhador e fornecedor já **abertas** com exemplos, em vez de só o botão «+».
4. **Barra lateral recolhível** (tablet/PC) no painel do dono, no admin e no futuro painel geral:
   - botão «‹» / «›»;
   - fica recolhida só com os ícones;
   - lembrada no aparelho.
5. **IVA e INSS editáveis:**
   - IVA: taxa normal por omissão de 16% (editável, por exemplo 15%) e isenção por produto;
   - INSS: 4% por omissão, editável (por exemplo 2%);
   - novas colunas `Tenant.vat_rate_std` e `Tenant.inss_employer_pct` livres (0–30, inteiros);
   - `services/tax.js` passa a receber a taxa; testes actualizados.
6. **Terminais:**
   - **Diagnóstico:** o cookie dura 365 dias. Cada browser ou app instalada tem os seus cookies, e o Brave limpa-os, por isso cada emparelhamento cria um terminal novo.
   - **«Pedir novo código» num terminal existente:** reemparelha o mesmo terminal; o PIN do dono é pedido no painel.
   - **Revogado:** «Reactivar» ou «Eliminar».
   - **Cada terminal tem a sua lista de perfis:**
     - nova tabela `PosTerminalMember` (terminal ↔ utilizador, com RLS);
     - «Balcão geral» = todos;
     - um terminal sem lista mostra todos, para não partir os que já existem.
7. **Caixistas** (Relatórios/Equipa):
   - por dia, semana e mês: horas de turno (abertura → fecho), quem mais vendeu (n.º de vendas e quantidade) e quem mais rendeu (MT);
   - rastreio por caixista.
8. **Fecho falhado com detalhe:**
   - a auditoria `SHIFT_CLOSE_FAIL` passa a guardar o valor escrito e o esperado;
   - rastreio e sino mostram «escreveu 16 000 MT, esperado 17 000 MT, tentativa 1/3» só ao dono;
   - o caixista continua sem ver o esperado.
9. **Admin:**
   - **«Activa até …»:** `Tenant.subscription_until`, preenchida ao activar (+1 mês ou +12 meses);
   - **fim automático:** tarefa diária. Teste acabado → só leitura (402, já existe). Subscrição vencida → mesma regra, «em atraso».
   - **Conta criada:** imagem PNG (e PDF) bonita com a marca: dados, senha temporária, teste até…
   - **Botão WhatsApp** para o número do pedido com a mensagem de boas-vindas.
   - **No pedido de conta,** o campo WhatsApp passa a explicar que «é o número que recebe os relatórios».
10. **Sugestões do catálogo-mestre:**
    - acrescentar a **várias categorias de uma vez** (caixas a marcar);
    - o **código de barras** da loja que o criou vem preenchido e pode ser corrigido.

11. **Venda personalizada no terminal** (pedido de 27/10: farmácias, restaurantes, lanchonetes, hotéis…):
    - botão «Pedido personalizado»: descrição livre (ex.: «antibiótico avulso — 3 comprimidos», «xarope meia dose»), quantidade e preço;
    - entra no cesto e no recibo como os outros artigos; não mexe no stock;
    - marca opcional «Acrescentar ao catálogo», que cria o produto (nome, preço, categoria) para a próxima vez;
    - no servidor: `SaleItem.product_id` passa a opcional e entra `SaleItem.custom = true`;
    - o preço é o escrito, sem o 409 do catálogo, mas sempre auditado: `CUSTOM_ITEM_SOLD`, com quem e quanto;
    - acima do limite de desconto não há atalho;
    - relatórios: aparece como «Personalizado: …»;
    - o dono pode desligar a função nas Definições.

**Prova da etapa A:**
- unitários (tax, terminais, auditoria do fecho);
- `verify_system` secção 40, com terminais, membros e RLS, taxas livres, `subscription_until` e expiração, fecho com detalhe;
- `etapaA.mjs` + `flows`, `site`, `fase15`, `fase16`, `admin_flows`, `onboarding`, `pedir_conta`;
- capturas no tablet com a barra recolhida.

---

## Menu das etapas seguintes (o fundador escolhe no fim de cada uma)

**B. Terminal do guarda**
- Novo papel `guard`, com PIN no terminal e terminal próprio (com a lista de perfis da A6).
- Ecrã de leitura por câmara (`BarcodeScanner` existente), leitor USB/pistola ou QR.
- Fluxo:
  - mostra a venda (estabelecimento, hora, artigos);
  - «Marcar como conferido» grava `ReceiptCheck` (venda, guarda, hora; único por venda);
  - lido outra vez → ecrã **vermelho** «Já conferido a … por …»;
  - o dono vê no rastreio.
- A página pública `/verify` continua igual (só diz «autêntico»).
- Texto no site, secção dos recibos.

**C. Painel do super admin novo + mapa 3D ao vivo (Mapbox)**
- **Admin com o kit novo:**
  - cartão verde com as subscrições («a sua receita»), comparações dia, semana e mês;
  - gráficos;
  - auditoria bonita em PT/EN (reaproveitar `auditLabels.js` e `AuditLogPage` do dono);
  - barra recolhível;
  - «Lojas» → «Estabelecimentos».
- **Localização:** `Tenant.lat` / `lng` / `address`:
  - marcar no mapa, usar o GPS ou colar um link do Google Maps (extrair coordenadas);
  - no registo e nas Definições: «importante; pode configurar mais tarde» (não diz «opcional»).
- **Mapa ao vivo** (Mapbox GL, globo 3D, terreno e prédios):
  - luz conforme a hora de Maputo (manhã / tarde alaranjada / noite com luzes);
  - relógio e filtros por cidade e por conta;
  - pinos por tipo de negócio;
  - bolhas sobre o pino: +MT a verde; cancelamentos/perdas −MT a vermelho; abertura, fecho e falha de turno;
  - som ambiente baixinho gerado no browser (Web Audio: pássaros de manhã, trânsito ao fim da tarde, silêncio à noite), com botão de som.
  - **Super admin:** vê todos os estabelecimentos, ou só a sua receita de subscrições a entrar.
  - **Dono:** vê só os seus estabelecimentos, no painel geral (etapa D).
- **Tempo real:** Server-Sent Events `/api/live` (por tenant; o admin vê todos), sem serviços novos.
- **Notificações pop-up de venda para o dono:** resumo «Venda de X MT · lucro Y»; tocar abre o detalhe/rastreio; também noutras páginas do painel.
- **Assistência:** botão de feedback do dono, com mensagem e captura, numa conversa com o admin; o pedido de assistência equivale a autorização.
- **Precisa do fundador:** conta Mapbox e chave pública (token `pk.`) restrita ao domínio.

**D. Vários estabelecimentos + gerente + painel geral**
- `Organization` + `Membership` (dono / gerente por estabelecimento); cada estabelecimento continua a ser um tenant (RLS intacto).
- Registo: «Quantos estabelecimentos?», nome, tipo, localização e catálogo de cada um (igual para todos ou um por estabelecimento).
- «Adicionar estabelecimento» depois.
- Com 2 ou mais: parabéns, «painel geral» e hub estilo Netflix.
- Painel geral:
  - somas diário/semanal/mensal com comparações;
  - rastreio de todos (de que estabelecimento, terminal e caixista veio cada venda);
  - stock geral a acabar ou a expirar;
  - mapa (C).
- **Gerente:**
  - e-mail e senha criados pelo dono;
  - entra directamente no seu estabelecimento;
  - sem lucro líquido, custos, contactos do dono, senha, plano nem outros estabelecimentos — cortado no servidor;
  - existe também com 1 só estabelecimento.
- `POST /api/auth/switch-tenant` só com membership de dono; `verify_system` com isolamento A/B.

**E. Modo nhonguista / importador** (sem POS)
- Painel próprio estilo marketplace: anúncios/produtos com foto e preço.
- Estados: disponível, esgotado, vendido.
- Venda sem stock (custo pedido na venda), artigo único que sai ao vender, encomendas com sinal e prestações (antiga Fase 19).
- Lucro por venda/encomenda.
- Sem terminais nem caixistas, a não ser que os active.

**F. Modo restaurante / fast food** (churrascaria = modo comércio com catálogo próprio)
- Mesas, reservas, servente com PIN, pedidos abertos, ecrã/terminal da cozinha.
- Cancelar antes e depois de sair da cozinha (motivo; motivo + PIN do dono).
- Conta enviada ao caixista e confirmada.
- Recibo com mesa, servente e tempo à mesa; limite de horas sem consumo.
- Offline idempotente (antiga Fase 18).

**G. Modo hotelaria**
- Recepção: quartos e reservas por hora, dia ou mês, avisos de chegada.
- Pedidos de refeição para o quarto, com hora de entrega.
- Inclui os módulos de cafetaria e restaurante (F).
- Plano/preço próprio.

**H. Modo arrendamento**
- Imóveis/quartos/flats, contratos por dia, semana ou mês, pagamentos e atrasos.
- Painel por mês.

**I. Catálogo-mestre com dados reais**
- Códigos de barras reais só de fontes verificadas (Open Food Facts, fabricantes); nunca inventados.
- Menus pesquisados de restaurantes, churrascarias e fast food de Moçambique, com as fontes.
- Produtos comuns comprovados para cada tipo de negócio.

**J. Extras** (antiga Fase 20)
- Etiquetas PDF com código de barras.
- Clientes e fidelidade.
- Venda em espera + ecrã «Sincronização».
- Salão/barbearia (marcações e comissões).

**L. Farmácia** (modo comércio com regras próprias)
- Tipo de negócio «Farmácia» com catálogo de medicamentos comuns de fontes verificadas (etapa I).
- Validade obrigatória, campo «precisa de receita» (o caixista confirma ao vender) e venda personalizada (A11) para avulsos e meias doses.

**M. Modo clínica** (sistema à parte, complexo)
- **POS normal** para vendas rápidas (medicamentos, xaropes) com venda personalizada.
- **Ficha do paciente:**
  - nome, contacto, data de nascimento, grupo sanguíneo;
  - consultas: queixa, estado, diagnóstico, o que foi feito, observações e recomendações, exames e resultados;
  - serviços prestados com preço;
  - refeições/consumos durante o internamento, com custo.
- **Atendimento personalizado:** o médico ou atendente escolhe os serviços e os consumos, que geram a conta a pagar (fica no caixa e nos relatórios como venda).
- **Documentos:**
  - recibo (o que se pagou);
  - **relatório clínico em Word (.docx)**, com as secções que o médico escolhe enquanto preenche (estado, diagnóstico, grupo sanguíneo se quiser, exames, recomendações, consumos), com logótipo e dados da clínica. Gerado com a biblioteca `docx` no browser.
- **Privacidade:**
  - dados de saúde só para os papéis da clínica (médico/atendente/dono);
  - caixista e gerente sem acesso ao conteúdo clínico;
  - tudo auditado;
  - RLS por tenant.
- Papéis novos: médico/atendente com PIN.

**N. Modo posto de combustível**
- **Balcão:** POS normal (loja de conveniência, óleos).
- **Terminal do frentista:**
  - escolhe o combustível (gasolina, diesel… com o preço por litro definido pelo dono, ex.: 89,32 e 93,65 MT/l, e histórico de preços);
  - escreve **litros** (ex.: 112,08) → o Genesis calcula os MT como a bomba;
  - ou escreve **MT** → calcula os litros;
  - regista a venda com a forma de pagamento.
- **Contas:**
  - reaproveita a venda ao peso (15.5): unidade «l» em mililitros inteiros;
  - valor = `lineAmount`;
  - litros a partir de MT = arredondamento de `MT × 1000 / preço`, com teste igual nos dois sentidos;
  - stock por tanque em litros (opcional: leitura do tanque).
- **Fecho do frentista:**
  - dinheiro vivo como o fecho cego;
  - litros vendidos por bomba/combustível no relatório.

**K. Mapa mental 3D refeito** (ferramenta interna)
- Estilo Genesis minimalista (fundo e cores da marca, sem ícones de vassoura).
- Três modos:
  - **constelação:** fundo e brilho novos;
  - **saltitante:** arrastar um nó puxa os ligados com física de molas;
  - **rede neural.**
- Mantém `gen_mindmap_data.js` e `mapa_mental_status.json`.

**Só registar como futuro (Mapa Mental):**
- leitura 3D dos quartos/hotel com o iPhone, para ver quartos ocupados num modelo 3D (também para arrendamento);
- apps nativas com notificações push;
- envio automático por e-mail/WhatsApp;
- confirmação automática de pagamentos.

## Ficheiros principais da etapa A
- **Site:** `frontend/site/textos.pt.js`, `textos.en.js`, `template.js`, `scripts/capturas_site.mjs` (+ e2e_fixture `demo`), `public/site/shots/*`.
- **Registo:** `frontend/src/pages/auth/RequestAccount.jsx`, `pages/owner/Onboarding.jsx`, `backend/src/routes/catalogs.js`, `data/master_catalogs.json` (tipos).
- **Barra:** `frontend/src/layouts/AppShell.jsx`, `admin-frontend/src/App.jsx`.
- **Taxas:** `backend/src/services/tax.js`, `routes/settings.js`, `routes/sales.js`, `services/reports.js`, `Settings.jsx`, `ProductDrawer.jsx`.
- **Terminais:** `backend/src/utils/terminals.js`, `routes/pos.js`, `routes/owner.js` (terminals), `Settings.jsx` (separador Terminais), `pages/pos/Terminal.jsx`.
- **Caixistas e fecho:** `backend/src/utils/shift.js`, `utils/shiftLock.js`, `services/reports.js` (timeline), `services/tenantAlerts.js`, `pages/owner/Reports.jsx`, `pages/owner/Team.jsx`.
- **Admin:** `backend/src/routes/admin.js`, `middleware/auth.js` + `utils/tenantStatus.js` (vencida = só leitura), novo `services/subscriptionJob.js`, `admin-frontend/src/App.jsx` (imagem da conta: reaproveitar o desenho em canvas de `frontend/src/utils/receiptImage.js`).
- **Reutilizar:** `utils/units.js`, `utils/salePayments.js`, `components/BarcodeScanner.jsx`, `utils/pdf/deliver.js` (partilha), `auditLabels.js`, `CountUp`, `Home.jsx` (cartão verde).

## Verificação (em cada etapa)
1. `node --test backend/tests/*.test.js` e `frontend/tests/*.test.mjs`.
2. `verify_system` com a secção nova, contra o backend local na 4100 e o Supabase (as 32–33 corridas à parte por causa do limite de logins).
3. E2E novos e os de regressão no build local; depois publicar e repetir contra genesismz.com, apagando as lojas de teste.
4. Capturas revistas à vista: telemóvel 390, tablet 768/1024, PC 1440.
5. Registos: Mapa Mental, `Diario do Genesis…txt` e `mapa_mental_status.json` + `gen_mindmap_data.js`.
6. Aviso ao fundador com a prova e a pergunta «qual é a próxima etapa?».
