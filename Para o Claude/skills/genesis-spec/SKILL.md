---
name: genesis-spec
description: Especificação funcional completa do Genesis (Secção 6 do Prompt Mestre) — onboarding/wizard de 5 passos, POS, cancelamento com PIN, caixa cego, relatórios diário/semanal/mensal (fórmula do lucro líquido), stock e alertas, chenecas, fornecedores, trabalhadores/payroll, metas, hardware (impressora ESC/POS, QR, leitor de barras), UI. Usar antes de implementar ou alterar qualquer funcionalidade de produto, ou para confirmar se uma funcionalidade está especificada (REGRA 8 — nada fora disto sem perguntar).
---

# Genesis — Especificação funcional (Secção 6 do Prompt Mestre)

Extraído literalmente de `Prompt_Mestre.txt` (versão Setembro 2026). As
referências "SECÇÃO N" apontam para esse ficheiro. Se o código actual divergir
desta spec, a spec define o comportamento pretendido; o código define o estado
real — confirmar no `Mapa Mental/Mapa_Mental.md` antes de assumir.

--------------------------------------------------------------------------------
SECÇÃO 6 — FUNCIONALIDADES COMPLETAS DO PRODUTO (ESPECIFICAÇÃO FUNCIONAL
COMPLETA, do plano de produto original)
--------------------------------------------------------------------------------

Esta secção é a especificação funcional integral do que o produto deve
fazer. Nada aqui deve ser inventado ou alterado sem confirmação — se falta
algo aqui, NÃO IMPLEMENTAR sem perguntar primeiro (ver REGRA 8, SECÇÃO 8).

### 6.1 — Onboarding e gestão de clientes (fluxo completo)

**Passo 1 — Pedido de conta pelo comerciante**
- O comerciante acede ao site e clica em "Solicitar Conta".
- Preenche formulário com: nome completo, nome do negócio, localização
  (bairro/zona), contacto telefónico (WhatsApp), e-mail (opcional), tipo de
  negócio, NUIT (opcional, botão "Não tenho"), número de BI ou passaporte
  (opcional, botão "Não tenho").
- Após submissão: ecrã de confirmação — "O teu pedido foi recebido.
  Entraremos em contacto em até 48 horas."
- O parceiro comercial pode já ter visitado o estabelecimento antes do
  pedido — campo "Visitado pelo parceiro" no painel admin associa essa
  visita ao pedido.

**Passo 2 — Avaliação pelo Super Admin**
- Notificação de novo pedido no painel do Super Admin.
- Painel mostra: dados submetidos, data/hora do pedido, status da visita do
  parceiro, campo de notas internas.
- Super Admin pode: Aprovar (conta criada automaticamente), Rejeitar (com
  mensagem enviada por WhatsApp/e-mail), Marcar como "pendente de visita".

**Passo 3 — Onboarding self-service pelo dono (Wizard de 5 etapas)**
- Após aprovação, o dono recebe credenciais por WhatsApp/e-mail.
- No primeiro login: wizard de configuração obrigatório em 5 etapas:
  1. Seleccionar categoria PRINCIPAL do negócio: bottle_store, mercearia,
     padaria, talho, supermercado, restaurante, boutique, outro.
     (bottle_store é o público-alvo número 1 e TEM de estar disponível
     desde o primeiro passo — não pode faltar.)
  2. Seleccionar categorias ADICIONAIS se aplicável (ex: Bottle Store +
     Churrasqueira).
  3. Catálogo pré-definido carregado automaticamente com base na categoria
     escolhida (tabela `master_catalogs`). O dono revê a lista, remove
     produtos que não vende, e pode adicionar produtos manualmente ou por
     código de barras.
  4. Configurar custos fixos mensais: renda do local (valor mensal),
     trabalhadores (nome, função, salário fixo), fornecedores/estoquistas
     (nome, contacto, custo de entrega).
  5. Configurar horário de funcionamento e horário de fecho de caixa.
- Após o wizard, o dono entra directamente no painel operacional.
- REGRA DE MOEDA CRÍTICA NESTE PASSO: o wizard recebe os valores em MZN do
  utilizador (é o que é intuitivo escrever) e tem de MULTIPLICAR POR 100
  antes de enviar ao backend, que trabalha sempre em centavos. Este bug já
  aconteceu neste projecto — ver SECÇÃO 13, Falha Crítica 2.

### 6.2 — Módulo de Ponto de Venda (POS)

Interface usada pelos caixistas durante o dia. Deve ser rápida, simples, e
funcionar offline.

- Pesquisa de produto por: nome, código de barras (escanear), categoria.
- Adicionar ao carrinho com quantidade; preço de venda já definido; total
  calculado automaticamente.
- Campo de valor recebido → cálculo automático do troco.
- Método de pagamento: Dinheiro / M-Pesa / E-Mola / POS bancário — o método
  fica registado para reconciliação no fecho do dia.
- Botão "Finalizar Venda" → gera recibo e regista a transacção.
- Cada transacção é imediatamente escrita no IndexedDB (offline) e
  sincronizada com o servidor quando há rede.
- Demand Capture: botão "Cliente pediu produto em falta" → seleccionar
  produto → registo automático para análise de oportunidade perdida.
- Registo de Quebra/Consumo Interno: botão específico para registar
  produtos partidos, vencidos ou consumidos internamente — evita
  divergências de stock falsas.

**Cancelamento de venda (anti-fraude):**
- Cancelar uma venda após impressão do recibo exige PIN de 6 dígitos do
  Dono ou Gerente.
- Todo o cancelamento fica registado com: data, hora, utilizador que
  cancelou, PIN utilizado, motivo (campo obrigatório).
- O Dono vê lista completa de cancelamentos no seu painel.

**Fecho de turno com caixa cego:**
- Quando um turno termina, o caixista insere o valor físico que conta no
  caixa ANTES de ver o que o sistema calcula.
- Só depois de inserir o valor contado é que o sistema revela o valor
  esperado.
- Divergência é registada automaticamente e notificada ao Dono.

### 6.3 — Módulo de Relatórios

**Relatório Diário (Fecho do Dia)** — accionado pelo horário de fecho
configurado, com pergunta "Deseja fechar agora ou em mais 30 minutos?"; o
dono também pode fechar manualmente a qualquer momento. Conteúdo:
- Total de vendas do dia (número de transacções).
- Receita bruta total.
- Detalhamento por método de pagamento: dinheiro vivo, M-Pesa, E-Mola, POS.
- Produtos mais vendidos (ranking por quantidade).
- Produto mais rentável do dia (maior margem × quantidade vendida).
- Análise por categoria (bebidas, alimentícios, etc.).
- Custo de restock dos produtos vendidos.
- Lucro bruto do dia (receita − custo dos produtos vendidos).
- Oportunidades perdidas (demand captures não satisfeitas).
- Cancelamentos do dia (se houver).
- Relatório de fecho de turno de cada caixista com divergências (se houver).
- Botão: Exportar PDF / Imprimir.

**Relatório Semanal** — accionado automaticamente ao fim do último dia
operacional da semana. Conteúdo:
- Total de vendas da semana, gráfico de barras por dia.
- Produto mais vendido da semana (consistência diária).
- Produto mais rentável da semana.
- Produtos com maior número de rupturas de stock (demanda não satisfeita).
- Recomendação de restock: com base no histórico semanal, o sistema calcula
  a quantidade recomendada de cada produto a comprar, estimando o valor
  total de investimento em stock.
- Gráfico de evolução da receita ao longo da semana.
- Botão: Exportar PDF / Imprimir.

**Relatório Mensal (Relatório Financeiro Real) — O DIFERENCIADOR PRINCIPAL
DO PRODUTO.** Mostra o lucro líquido real após todas as deduções:
- Receita bruta total do mês.
- (−) Custo de restock (soma dos custos de compra de todos os produtos
  vendidos).
- (−) Custo de stock de reserva recomendado (calculado com base em rupturas
  e tendências).
- (−) Salários dos trabalhadores (automático, com base nos valores
  configurados).
- (−) Renda do local (valor mensal configurado).
- (−) Custo de transporte/fornecedores (total do mês).
- = LUCRO LÍQUIDO REAL DO MÊS.
- Gráfico comparativo mês a mês (histórico acumulado).
- Ranking de produtos mais rentáveis do mês.
- Análise de tendências: produtos em crescimento vs declínio.
- Botão: Exportar PDF / Imprimir.
- FÓRMULA EXACTA A IMPLEMENTAR (ver código completo na SECÇÃO 18.6):
  `net_profit = gross_revenue - cost_of_goods - total_salaries - total_rent
  - total_other_fixed_costs - total_supplier_delivery_cost`
  onde `total_rent` vem de `fixedCosts` filtrado por `type === 'rent'`
  (NÃO pode estar hardcoded a 0 — este é um bug já confirmado, ver SECÇÃO
  13, Falha Grave 3), e `total_supplier_delivery` é calculado a partir das
  `stockEntries` reais do período multiplicadas pelo custo de entrega por
  visita de cada fornecedor (NÃO simplesmente "1 entrega por fornecedor
  activo", que é outro bug já confirmado).

**Histórico Total (desde abertura da conta):**
- Acumulador total de receita desde o primeiro dia na plataforma.
- Pesquisa de transacção específica por: data, hora, produto, caixista,
  método de pagamento.
- Descarregar histórico completo em CSV/PDF.

### 6.4 — Módulo de Stock

- Registo de entrada de stock (compra de restock): produto, quantidade,
  preço unitário de compra, fornecedor, data.
- Saída automática de stock a cada venda registada.
- Alerta de stock mínimo configurável por produto: 3 níveis — normal
  (<100), severa (≤20), crítica (≤10) — notificação no painel e por
  WhatsApp quando atingido.
- Histórico de preços de custo por produto: rastrear quando o preço de
  compra subiu, com data — permite ver impacto da inflação na margem.
- Registo de validades (produtos perecíveis): alerta X dias antes da
  validade.

### 6.5 — Módulo de Cheneca (gestão de fiados/dívidas)

Funcionalidade EXCLUSIVA com integração WhatsApp. Resolve a maior dor não
digital do comércio informal moçambicano.
- Registar nova cheneca: nome do cliente, contacto WhatsApp, produtos
  fornecidos a crédito, valor total, data limite de pagamento.
- Registo de pagamentos parciais: saldo actualizado automaticamente.
- Lembretes automáticos via WhatsApp:
  - 7 dias antes da data limite: aviso preventivo.
  - 1 dia antes: aviso urgente.
  - No dia da data limite: notificação final.
  - Para o Dono (não o devedor): lista diária de chenecas vencidas ou a
    vencer.
- Dashboard de chenecas: total em dívida, clientes com dívida activa,
  dívidas vencidas, histórico de pagamentos.

### 6.6 — Módulo de Fornecedores

- Registo de fornecedores/estoquistas: nome, contacto, produtos que
  fornece, custo de entrega por visita.
- Histórico de compras por fornecedor: quando comprou, o quê, quanto pagou.
- Comparação de preços entre fornecedores para o mesmo produto.
- Custo de transporte incluído automaticamente no relatório mensal.

### 6.7 — Módulo de Trabalhadores e Payroll

- Registo de cada trabalhador: nome, função, contacto, data de início,
  salário fixo mensal.
- No relatório mensal, salários deduzidos automaticamente do lucro bruto.
- Registo de ausências e faltas (opcional, para cálculo proporcional).
- Relatório de desempenho por atendente: número de vendas, valor total
  processado, divergências de fecho de turno.

### 6.8 — Módulo de Metas de Vendas

- O dono define uma meta mensal de receita.
- Dashboard mostra barra de progresso em tempo real, com as cores
  progressivas já descritas na SECÇÃO 4.2 (vermelho/laranja/amarelo/
  verde/azul de bónus acima de 100%).
- Projecção: "Com base no ritmo actual, vais atingir a meta no dia X."
- Notificação quando a meta é atingida.

### 6.9 — Hardware — Integração com dispositivos físicos

**Impressora térmica (recibos):**
- Protocolo ESC/POS (58mm e 80mm).
- Comunicação via Web Serial API (USB) ou Bluetooth Web API.
- Conteúdo do recibo: nome da loja, data e hora, lista de produtos (nome ×
  quantidade = valor), total, método de pagamento, troco (se aplicável),
  QR code REAL (não um placeholder de texto "QR") de autenticidade da
  transacção, apontando para `https://genesis.co.mz/verify/[sale_id]`.
- Design do recibo estruturado e legível, não apenas texto bruto.

**Leitor de código de barras:**
- Leitores USB que emulam teclado — compatibilidade nativa.
- Cursor sempre no campo de pesquisa de produto no POS.
- Produtos sem código de barras: registo manual por nome ou código interno.

### 6.10 — Interface e design

- Idiomas: Português (padrão) e Inglês, alternável no menu.
- Ícones universais em todos os botões e funções principais.
- Paleta de cores: tons sólidos e suaves, agradáveis à vista, sem poluição
  visual.
- Animações suaves e lentas (60-120fps percebidos), nunca agressivas.
- Design responsivo: computador, tablet, smartphone.
- PWA instalável no smartphone como app nativa, sem App Store.
- Botão de Feedback sempre visível — reporta problemas ou sugestões
  directamente ao Super Admin, tanto na interface do Owner como do
  Caixista.
- QR Code nos recibos, escaneável para verificar autenticidade.
- Resumo diário por WhatsApp ao fecho do dia: receita total, produto mais
  vendido, lucro estimado.

