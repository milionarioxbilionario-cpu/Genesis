# Plano de 31/10/2026: corrigir tudo o que o fundador viu, o painel geral a sério e a experiência premium

Fonte: as palavras do fundador em `Mapa Mental/Pedidos do fundador/2026-10-31 - pedido completo (palavras do fundador).txt`. O ficheiro tem a mensagem de 31/10 e o texto longo de 27-29/10. Este plano substitui a ordem das etapas do plano anterior (`kind-sleeping-squid.md`, etapas A a N). O que lá está feito continua feito.

Regra deste plano: **nada é dado como feito sem prova** (teste automático contra a base de dados real, teste no browser real, capturas a 390/768/1440 px e teste no site publicado). Cada funcionalidade passa pela lista «E se…?» da secção 1 antes de ser escrita.

---

## 0. O que correu mal e porquê

A Etapa D (vários estabelecimentos) foi testada só no caminho feliz. Os testes corriam quase todos no estabelecimento de casa. No 2.º estabelecimento a conta do dono «desaparecia»: a linha dele vive no estabelecimento de casa e a protecção entre estabelecimentos (RLS) escondia-a. Daí:

| O que o fundador viu ou ia ver | Causa | Estado |
|---|---|---|
| «Painel bloqueado… Ainda não criou o PIN do painel», sem saída | O servidor procurava o PIN no 2.º estabelecimento | ✅ corrigido, secção 46 (20/20) |
| Não havia «esqueci o PIN» | Não existia | ✅ «Esqueci o PIN» com a senha da conta |
| Mudar a língua, o perfil e o PIN de autorização falhavam no 2.º | A mesma causa | ✅ secção 46 |
| Rastreio, histórico de custos e lista de vendas do 2.º com erro (500) depois de o dono mexer no stock | Nome do dono invisível no 2.º | ✅ secção 47 |
| Com o teste acabado num estabelecimento, não conseguia trocar para outro | A troca contava como «escrever» | ✅ secção 47 |
| Estabelecimento de casa suspenso fechava todos os outros (mesmo pagos) | O login olhava só para o de casa | ✅ secção 47 |
| Dois separadores: trocar num fazia o outro gravar no estabelecimento errado, sem aviso | O estabelecimento activo vivia só no cookie | ✅ secção 47 (409 e a página recarrega) |
| «Concluir» outra vez no onboarding duplicava renda, custos e equipa | 6 pedidos seguidos, sem «tudo ou nada» | ✅ secção 48 (uma só operação) |
| O onboarding do 2.º não tinha saída e ignorava o tipo escolhido | Faltava | ✅ botão «Voltar ao principal», tipo pré-marcado, rascunho guardado |
| A rede a cair entre «criar» e «abrir» criava estabelecimentos repetidos | Sem identificador do aparelho | ✅ secção 47 |
| O 2.º nascia «pago até» à mesma data da conta, sem ninguém pagar | Copiava o estado da conta | ✅ 30 dias de teste, o fundador activa quando receber |
| O mapa não mostrava perdas, txenekas, despesas nem turnos | Só vendas e cancelamentos | ✅ secção 48 |

**A lição:** perguntar «funciona?» não chega. A pergunta certa é «o que é que a pessoa pode fazer aqui que parta isto?». Daí a lista seguinte, obrigatória.

---

## 1. A lista «E se…?» (obrigatória antes de escrever e antes de dar por feito)

1. **A rede cai a meio, ou a resposta perde-se.** Repetir não pode duplicar nada: um identificador gerado no aparelho, ou «tudo ou nada» numa transacção.
2. **Duplo clique, dois aparelhos ou dois separadores ao mesmo tempo.** Só um grava; o outro recebe uma resposta clara.
3. **A sessão expira, ou o painel bloqueia a meio do que está a fazer.** Volta ao mesmo sítio sem perder o que escreveu.
4. **A pessoa sai a meio** (fecha a app, volta ao estabelecimento principal, o telemóvel desliga). Fica um rascunho no aparelho.
5. **O estabelecimento está suspenso, em teste acabado, em atraso ou encerrado.** Pode consultar, não pode criar valor e nunca fica preso.
6. **Vários estabelecimentos.** A conta (senha, PIN, língua, Face ID) é da pessoa. Os dados (produtos, vendas, caixistas) são do estabelecimento. Cada rota testada também dentro do 2.º estabelecimento.
7. **Papéis.** Dono, gerente, caixista, guarda e suporte: cada um vê só o que lhe cabe, cortado no servidor e não só escondido no ecrã.
8. **Sem rede.** O balcão continua a vender (fila), e nada se perde ao voltar a rede.
9. **Horário real:** aberto 24h, fecha depois da meia-noite, fechado num dia, pausa ao almoço, feriados.
10. **Dinheiro em centavos inteiros e peso/medida em milésimos.** Nunca casas decimais soltas.
11. **Inglês.** Cada texto novo tem tradução (os testes `i18n` falham se faltar).
12. **Telemóvel 390, tablet 768 e PC 1440, em modo claro e escuro.**
13. **Contas que já existem.** Mudar sem estragar o que já está gravado (migrações só a acrescentar).
14. **Segurança.** Filtro por estabelecimento e RLS, também em caches, filas e canais ao vivo.
15. **Lei.** Registos de vendas e documentos fiscais guardados; dados pessoais só a quem precisa.
16. **Mensagens.** Dizer o que aconteceu e o que fazer a seguir, sem termos técnicos.

---

## 2. Estado de cada pedido (verificado ou por verificar)

Legenda:
- ✅ feito e provado;
- 🟡 feito em 30/10 (commit `4a8a610`), por rever no browser nesta etapa;
- ⏳ por fazer, com a etapa onde entra.

| Pedido | Estado | Etapa |
|---|---|---|
| R1 Importar o catálogo de outro estabelecimento | ⏳ | E1 |
| R2 PIN que «não existe», esqueci o PIN | ✅ | E1 |
| R3 Vermelhos no mapa (perdas, txenekas, despesas, cancelamentos, turnos) | ✅ servidor e mapa; ⏳ revisão visual | E1 |
| R4/L21 Site: guarda e burlas com recibos | 🟡 diz o commit `7a51fe6`; o fundador não viu | E1 (rever e tornar visível) |
| R5 Onde se configura o guarda | ⏳ (existe, mas não se encontra) | E1 |
| R6 Satélite bugado | ⏳ | E1 |
| R7 Realismo fotográfico 3D | ⏳ precisa da chave Google (ver secção 6) | E7 |
| R8/L5 Códigos de barras verdadeiros no catálogo-mestre | ⏳ | E4 |
| R9 Horário 24h, por dia, depois da meia-noite | ⏳ | E1 |
| R10 Apagar ou encerrar um estabelecimento | ⏳ | E1 |
| R11/L13/L14 Painel geral dedicado, hub, gerentes | ⏳ (o actual é só uma tabela) | E2 |
| R15 Modo escuro | ⏳ | E5 |
| R16 Movimento fluido, sem parecer IA | ⏳ | E5 |
| L2 Admin com o design novo e comparações | 🟡 parcial | E6 |
| L3 Barra lateral recolhível | 🟡 | revisão em E5 |
| L4 Onboarding com textos claros e caixas abertas | 🟡 | revisão em E1 |
| L6 Sugestões para várias categorias | 🟡 | revisão em E4 |
| L7 Localização na criação da conta, com lembrete | ⏳ parcial (só nas Definições) | E1 |
| L8 «Loja» → «estabelecimento» em todo o lado | ⏳ (cerca de 63 textos e as chaves EN) | E1 |
| L9 Assistência e feedback com capturas | ⏳ | E6 |
| L10 Vários estabelecimentos no próprio pedido de conta | ⏳ | E2 |
| L12 Acrescentar estabelecimento depois | ✅ (com as correcções acima) | — |
| L15/L16 Mapa do dono e mapa ao vivo completo (filtros, contador, sons, mensalidades) | ⏳ | E7 |
| L17 Avisos de venda e centro de notificações | ✅ avisos; ⏳ tocar abre o detalhe da venda | E2 |
| L18/L19/L20 Imagem da conta, WhatsApp, «activa até», fim automático | 🟡 | revisão em E6 |
| L22/L24 Caixistas (horas, rankings), fecho falhado com o valor escrito | 🟡 | revisão em E2 |
| L23 Site: fecho de turno explicado | 🟡 | revisão em E6 |
| L25 Ícone do Genesis no Google | ⏳ | E6 |
| L26/L34 Capturas novas (184 mil, mapa, hub) e telemóvel ao centro | ⏳ | E6 |
| L27/L32 Mapa mental 3D refeito, modos futuros como bolas grandes | ⏳ | E6 |
| L28 IVA e INSS editáveis | 🟡 | — |
| L29 Terminais: não deslogar, mesmo terminal, perfis por terminal | 🟡 | revisão em E1 |
| L30 Tipos de negócio + «Brevemente» + «Avise-me» | 🟡 | — |
| L31 Catálogo pesquisado de verdade por tipo | ⏳ | E4 |
| L33 Pedido personalizado no balcão | 🟡 | — |
| L35 «Txeneka» em todo o lado | 🟡 (commit `cabc28a`) | — |
| L36 Página 404 animada | 🟡 (`frontend/public/404.html`) | revisão em E6 |
| L32/L37 Modos restaurante, hotel, clínica, combustível, nhonguista, arrendamento | ⏳ só depois de tudo isto | depois |

---

## 3. Etapas (cada uma inteira: código, testes, publicação, teste em produção, Mapa Mental, Diário)

### E1. Correcções do que o fundador viu (em curso)

**Já feito e provado:** os 11 pontos da tabela da secção 0 (verify_system 46: 20/20, 47: 22/22, 48: 14/14).

**Falta nesta etapa:**

#### E1.1 Copiar o catálogo de outro estabelecimento (R1)
- **Onde:**
  - no onboarding, passo «Catálogo», botão «Copiar de outro estabelecimento»;
  - em Produtos, «Copiar de outro estabelecimento».
- **O dono escolhe:**
  - o estabelecimento de origem;
  - as categorias (todas por omissão);
  - se leva os preços de venda e os custos (por omissão sim).
- **O que se copia:**
  - nome, categoria, preço, custo;
  - código de barras, IVA do produto, unidade (un/kg/l/m);
  - stock mínimo, «tem validade», ícone e imagem.
- **O que não se copia:**
  - o stock, porque é físico (mover stock é uma transferência, que fica para a E2);
  - os lotes e as vendas.
- **Repetidos:** um produto com o mesmo código ou o mesmo nome no destino é saltado e mostrado na lista «Já existiam: …».
- **Servidor:** `POST /api/establishments/copy-catalog` com `{ from, categories, with_prices, op_id }`.
  - a origem tem de ser do mesmo dono (`ownerTenantIds`);
  - lê a origem dentro do contexto da origem e grava dentro do contexto do destino, sempre com a RLS de cada um;
  - uma transacção só; o `op_id` impede a cópia dupla;
  - registo no rastreio dos dois;
  - não gera «sugestões» ao admin.
- **E se…?**
  - a origem tiver mais de 1 000 produtos: copia em lotes, com progresso;
  - a rede cair: repete com o mesmo `op_id`, sem duplicar;
  - for um talho a copiar de uma bottle store: escolhe as categorias;
  - a origem estiver encerrada: pode copiar na mesma, porque é só ler.
- **Prova:** verify_system 49 (copiar, repetir, repetidos, outro dono recusado, RLS) e e2e no browser.

#### E1.2 Apagar ou encerrar um estabelecimento (R10)
- **«Apagar»: só se nunca vendeu** (sem vendas, txenekas nem turnos).
  - pede o nome escrito e a senha;
  - apaga de vez (é o caso «criei mal»).
- **«Encerrar»: se já tem histórico.**
  - fica só de leitura, com os relatórios e o rastreio guardados;
  - sai da lista activa (secção «Encerrados») e do painel geral, do mapa e da cobrança;
  - os terminais ficam revogados e os caixistas e guardas desactivados, com as sessões terminadas;
  - pode reabrir durante 30 dias;
  - os registos fiscais ficam guardados pelo prazo legal. Os 10 anos estão por confirmar com o contabilista do fundador; nunca se apagam antes.
- **Antes de encerrar, o Genesis avisa:**
  - «há X vendas por enviar num terminal sem rede»;
  - «há um turno aberto»;
  - «há txenekas por cobrar (X MT)»;
  - «há stock no valor de X».
  - As vendas feitas sem rede antes do encerramento continuam a ser aceites durante 7 dias. O dinheiro já foi cobrado e não se pode perder.
- **O estabelecimento de casa** não se apaga nem encerra sem escolher outro como principal («Mudar o principal»), porque a conta da pessoa vive nele.
- **Admin:**
  - «Eliminar» deixa de desactivar o dono quando ele tem outros estabelecimentos;
  - o admin vê os encerrados à parte.
- **Prova:** verify_system 50 (apagar sem vendas, encerrar com vendas, reabrir, fila offline aceite, casa protegida, sessões terminadas).

#### E1.3 Horário a sério (R9)
- **Modelo:** `Tenant.hours_json`, uma coluna nova (migração só a acrescentar). As colunas antigas `opening_time`/`closing_time` continuam a existir, calculadas a partir do horário novo.
  ```json
  { "v": 1, "mode": "same|24h|custom",
    "days": { "1": [["08:00","20:00"]], "5": [["00:00","24:00"]], "0": [["08:00","12:00"]], "6": [] },
    "day_end": "00:00", "exceptions": [{ "date": "2026-12-25", "closed": true }] }
  ```
  - cada dia tem uma lista de intervalos (a pausa ao almoço são dois intervalos);
  - `[]` quer dizer fechado;
  - `["18:00","04:00"]` passa a meia-noite;
  - `["00:00","24:00"]` é aberto 24h.
- **Ecrã** (onboarding e Definições):
  - três escolhas: «Todos os dias igual», «Aberto 24 horas» e «Horário por dia»;
  - no «Horário por dia», 7 linhas, cada uma com «Fechado / 24h / horas» e «+ pausa», e um botão «Copiar para todos os dias»;
  - hora sempre em 24h, com um campo próprio (o do browser mostrava «01:00 AM»);
  - «Feriados e dias especiais» numa lista simples.
- **Dia de negócio** (`day_end`): um bar que abre às 18h e fecha às 4h vende à 1h e essa venda conta para o dia anterior. Por omissão é a meia-noite, como hoje: ninguém vê diferença se não mudar.
  - Quando o horário passa a meia-noite, o Genesis sugere o fim do dia na hora do último fecho, com esta explicação: «As vendas depois da meia-noite contam para o dia em que abriu».
- **Onde se usa:**
  - relatórios diário, semanal e mensal;
  - «Hoje» no Início;
  - aviso «fecho do dia»;
  - hora do relatório por WhatsApp;
  - «aberto agora» no painel geral e no mapa;
  - turnos.
  - O balcão nunca fica bloqueado fora de horas: vender é sempre possível.
- **Prova:** testes unitários do horário (24h, depois da meia-noite, pausa, fechado, feriado, mudança de dia) e verify_system 51.

#### E1.4 Mapa: satélite (R6)
- Hoje troca o estilo inteiro (`setStyle`) e, à noite, a luz «noite» escurece a imagem de satélite quase toda.
- **Correcção:**
  - o satélite passa a ser uma camada por baixo dos nomes das ruas, sem trocar o estilo, e por isso nunca perde os pinos;
  - a luz continua a seguir a hora de Maputo, mas no satélite nunca fica mais escura do que o anoitecer;
  - a câmara ajusta-se ao mudar.
- **E se…?** A rede for lenta: os pinos e as bolhas continuam lá enquanto a imagem carrega.
- **Prova:** e2e no browser com capturas de dia e de noite (a hora é forçada no teste).

#### E1.5 Guarda fácil de encontrar (R5) e no site (R4)
- **Equipa:**
  - secção própria «Guardas (conferem os recibos à saída)», com uma explicação de uma linha;
  - botão «Acrescentar guarda».
- **Terminais:** ao gerar o código aparece «Para que é este terminal?», com 2 escolhas:
  - Balcão (caixistas);
  - Saída (guarda). Este terminal fica logo só com os perfis de guarda.
- **Site:** confirmar no site publicado que a secção dos recibos fala do guarda e das burlas (recibo reimpresso, editado, fotografia). Se estiver escondida em «Ver mais detalhes», sobe para o resumo.

#### E1.6 Localização (L7)
- **GPS:**
  - mostra a precisão («± 12 m») e pede confirmação no mapa antes de gravar;
  - avisa se a precisão for pior do que 100 m («parece a localização da rede, não do sítio»).
- **Fora de Moçambique:** pergunta «tem a certeza?».
- **Morada legível:** campo «Rua ou avenida, cruzamento, ponto de referência».
- **No onboarding:** passo «Onde fica?». Pode ficar para depois, com este texto: «É muito importante… se ainda não sabe, configure mais tarde nas Definições, mas não se esqueça».
- **Lembrete** no sino enquanto não houver ponto.

#### E1.7 «Loja» → «estabelecimento» (L8)
- Os cerca de 63 textos visíveis, nas 3 partes do sistema, com as chaves em inglês a acompanhar.
- O endereço `/lojas` do admin passa a `/estabelecimentos`, com redireccionamento.
- «Loja de bebidas» fica, porque é o nome de um tipo de negócio.

#### E1.8 Admin
- **Modo suporte também nos estabelecimentos extra:** abre aquele estabelecimento, só de leitura.
- **Pedido de conta com um e-mail que já existe:** «juntar à conta existente como novo estabelecimento», em vez de dar erro na aprovação.

#### E1.9 Terminais (rever L29 no browser)
- Confirmar no browser que:
  - o terminal fica emparelhado durante meses;
  - «pedir novo código» reemparelha o mesmo terminal;
  - os perfis por terminal funcionam;
  - reactivar e eliminar funcionam.
- Pedir ao browser armazenamento persistente (`navigator.storage.persist()`) no terminal.
- Explicar no ecrã por que razão um terminal pode perder o emparelhamento (limpar dados do browser, modo privado, Brave) e como voltar sem criar outro.

**Prova da E1:**
- verify_system 46 a 51;
- regressão 2, 6, 10 a 13, 29, 31 a 33, 39, 42 a 45;
- e2e no browser: `correcoes_3110.mjs`, com o 2.º estabelecimento, o bloqueio, esqueci o PIN, dois separadores, onboarding a meio, copiar catálogo, encerrar, horário 24h e satélite;
- capturas a 390, 768 e 1440 px;
- publicar e repetir em genesismz.com.

### E2. Painel geral dedicado e gerentes (R11, L10, L13, L14, L17)
- **Quando aparece:** quando o dono tem 2 ou mais estabelecimentos. Ao criar o 2.º, uma mensagem: «Parabéns: activou o Painel geral e o Hub. Daqui vê todos os seus estabelecimentos juntos, entra em cada um e cria os gerentes».
- **Ao entrar** (dono com 2 ou mais): o **hub**, «Em qual estabelecimento deseja entrar?», no estilo do ecrã de perfis do terminal. Cada cartão mostra:
  - o nome, o ícone do tipo e a cidade;
  - as vendas de hoje;
  - a bolinha aberto ou fechado (do horário da E1.3).
  - Há ainda um cartão «Painel geral». O hub lembra-se da última escolha, mas mostra-se sempre ao entrar.
- **Painel geral, com barra lateral própria:**
  - **Visão geral:**
    - hoje, 7 dias e mês, com o lucro bruto e o lucro líquido do mês;
    - comparação com o dia, a semana e o mês anteriores;
    - um cartão por estabelecimento;
    - lista ao vivo «de onde veio cada valor»: estabelecimento, terminal, perfil e o que se vendeu.
  - **Estabelecimentos:**
    - lista com o estado e os números de hoje;
    - acções «Entrar», «Acrescentar», «Copiar catálogo», «Encerrar» e «Mudar o principal».
  - **Relatórios:** diário, semanal e mensal de todos juntos e por estabelecimento, com comparações; exportar PDF e Excel.
  - **Rastreio geral:** a linha do tempo de todos, com a coluna «Estabelecimento».
  - **Stock geral:** produtos a acabar e a expirar em todos, somados pelo mesmo produto (código de barras ou nome). Exemplo: «Coca-Cola 300 ml: 12 em A, 0 em B».
  - **Mapa:** os estabelecimentos do dono em 3D ao vivo, com o contador do lucro do dia (E7).
  - **Gerentes:** criar, mudar a senha e desactivar.
  - **Definições do grupo:** nome do grupo e WhatsApp do relatório consolidado.
- **Segurança:**
  - cada número é lido dentro do contexto do estabelecimento respectivo, só depois de confirmar que o dono tem acesso;
  - as somas fazem-se na memória do servidor;
  - nunca há uma consulta que atravesse estabelecimentos com o cliente da aplicação.
- **Gerente** (existe mesmo com um só estabelecimento):
  - **Entra** com e-mail e senha criados pelo dono e vai direito ao seu estabelecimento. Não vê o hub, o painel geral nem os outros estabelecimentos.
  - **Vê:**
    - o Início, sem lucro;
    - as vendas e os recibos, com reimpressão;
    - os produtos, sem custos;
    - o stock, sem custos;
    - os fornecedores, as txenekas e as metas;
    - a equipa: caixistas e guardas, com criar, PIN e desbloquear;
    - os relatórios, só de vendas e quantidades;
    - as definições operacionais: horário e mensagem do recibo.
  - **Não vê nem muda:**
    - custos, margens, lucro bruto e lucro líquido;
    - salários, renda e despesas fixas;
    - plano e subscrição;
    - senha, e-mail e WhatsApp do dono;
    - o PIN de autorização do dono;
    - apagar ou encerrar o estabelecimento;
    - exportar tudo;
    - o rastreio da conta do dono.
  - **Cancelamentos e descontos acima do limite:** com o PIN de autorização do próprio gerente, gravado no rastreio com o nome dele. O dono pode desligar isto.
  - **Corte no servidor**, rota a rota e campo a campo, como se faz hoje para o caixista. verify_system com cada rota do dono chamada como gerente: 403 onde deve, e nenhum campo de custo ou lucro nas respostas.
- **Vários estabelecimentos no pedido de conta (L10):**
  - «Quantos estabelecimentos tem?» e, para cada um, nome, tipo e localização;
  - escolher «o mesmo catálogo para todos» (copiado do primeiro, E1.1) ou «cada um o seu»;
  - a aprovação do admin cria todos.
- **Avisos (L17):** tocar num aviso de venda abre a própria venda (detalhe e rastreio), não só a lista.

### E3. (reservada: transferências de stock entre estabelecimentos, se o fundador quiser)

### E4. Catálogo com códigos de barras verdadeiros (R8, L5, L6, L31)
- **Nunca inventar códigos.** Fontes, por esta ordem:
  - Open Food Facts (produtos com Moçambique, África do Sul e Portugal);
  - sites dos fabricantes e de supermercados online;
  - GS1 (verificação do prefixo).
- Cada código guarda a sua fonte e é validado pelo dígito de controlo EAN-13/EAN-8.
- **Aprender com os estabelecimentos:**
  - quando várias lojas lêem o mesmo código para o mesmo produto do catálogo-mestre, o admin vê «3 estabelecimentos usam 600… para Água Namaacha 1,5 L. Aprovar?»;
  - ao aprovar, todos os tipos que têm esse produto recebem o código.
- **Sugestões (L6):** confirmar no browser «acrescentar a várias categorias» e «usar o código que a loja pôs».
- **Catálogo por tipo (L31):** produtos e preços pesquisados com a fonte, para os tipos POS puro: mercearia, supermercado, bottle store, loja de bebidas, padaria, pastelaria, cafetaria, talho, farmácia e salão.

### E5. Modo escuro e movimento de qualidade (R15, R16, L3)
- **Modo escuro:**
  - tokens em `tokens.css` com `[data-theme="dark"]`: superfícies em pedra escura, não preto puro, e o verde da marca ajustado ao contraste;
  - em Definições › Aparência: «Claro / Escuro / Automático»;
  - sem piscar ao abrir (script no `<head>`);
  - os gráficos, o mapa (estilo noite) e os logótipos ficam certos;
  - o recibo impresso fica sempre claro;
  - revisão de todas as cores escritas à mão fora dos tokens.
- **Movimento:**
  - tokens de duração (120, 200 e 320 ms) e curvas suaves;
  - só `transform`/`opacity`, para correr a 120 Hz;
  - gavetas, diálogos, avisos e mudança de página com transições curtas, com a View Transitions API onde existir;
  - os números continuam a «revelar-se» como hoje;
  - `prefers-reduced-motion` respeitado.
- **Tirar o que «parece feito por IA»** (skill `frontend-design`):
  - textos de dados colados com «·»;
  - rótulos em MAIÚSCULAS;
  - «→» nos botões;
  - cartões todos iguais;
  - sombras repetidas.
  - Cada ecrã revisto à vista a 390, 768 e 1440 px, claro e escuro.

### E6. Site, admin e ferramentas (L2, L9, L18-L20, L23, L25, L26, L27, L32, L34, L36)
- **Site:**
  - guarda e recibos, e fecho de turno, revistos;
  - capturas novas com valores reais grandes (184 000 MT), o hub e o mapa, mas não tudo, para proteger o desenho;
  - telemóvel ao centro;
  - página 404 revista em telemóvel, tablet e PC.
- **Google (L25):**
  - favicon 48×48 e múltiplos, `<link rel="icon">` na página inicial e JSON-LD `logo`;
  - pedir nova indexação na Search Console, pelo Chrome do fundador.
- **Admin:**
  - cartões e comparações como no dono;
  - auditoria em PT, legível;
  - assistência e feedback com captura de ecrã, tipo conversa (L9);
  - confirmar a imagem da conta, o WhatsApp e o «activa até» com o fim automático.
- **Mapa mental 3D:**
  - estilo Genesis;
  - modos constelação, «saltitante» (arrastar com física) e rede neural;
  - os modos futuros como bolas grandes.

### E7. Mapa ao vivo completo (L8, L15, L16, R7)
- **Filtros:** por cidade (Maputo, Matola, Beira, Tete…) e por conta (todos os estabelecimentos da conta X).
- **Ao tocar no pino:** dados do estabelecimento (nome, dono, contactos, morada, hoje).
- **Admin:**
  - modo «só mensalidades»: «X renovou: +8 000 MT · total do mês»;
  - sem lucros dos estabelecimentos.
- **Dono:**
  - o mapa no painel geral, só com os seus;
  - contador do lucro do dia a subir.
- **Luz:** manhã, tarde alaranjada e noite com as luzes a acender, em transição lenta.
- **Sons ambientes:** baixos, gerados no browser, desligados por omissão e com um botão.
- **Realismo fotográfico (R7):** com a chave do Google Maps Platform (Map Tiles API), usar os Photorealistic 3D Tiles nas cidades onde o Google os tem. Onde não tem, fica o Mapbox (terreno, prédios e satélite). Testar a cobertura de Maputo com a chave antes de prometer.

### Depois: modos novos (restaurante, fast food, hotelaria, arrendamento, clínica, farmácia, combustível, nhonguista/importador)
Só depois de todas as etapas acima e do Prompt Mestre, quando o fundador escolher. Ficam no site como «Brevemente + Avise-me» e no Mapa Mental como bolas grandes «futuro».

---

## 4. Como cada etapa é provada

1. Testes unitários: backend `node --test tests/*.test.js` e frontend `node --test tests/*.test.mjs`.
2. verify_system com a secção nova, contra o servidor local e a base real. Sempre também **dentro de um 2.º estabelecimento**.
3. e2e no Chromium real (`frontend/tests/e2e/`): o fluxo inteiro, os casos «e se…?» e as capturas.
4. Capturas revistas à vista: 390, 768/1024 e 1440 px, claro e escuro.
5. Publicar (`deploy/publicar.sh`) e repetir os e2e contra genesismz.com, apagando os estabelecimentos de teste.
6. Mapa Mental (Partes A e B), Diário, `mapa_mental_status.json` e `gen_mindmap_data.js`, `backup_claude.mjs` e o commit.

---

## 5. O que fica decidido por omissão (o fundador pode mudar)

- **Estabelecimento novo numa conta paga:** 30 dias de teste. O fundador activa-o quando receber o pagamento.
- **Encerrar** guarda tudo (só leitura) e pode reabrir em 30 dias; **apagar** só quando nunca vendeu.
- **Copiar o catálogo** não leva o stock.
- **O gerente** usa o seu próprio PIN para autorizar cancelamentos e descontos, gravado com o nome dele.
- **O dia de negócio** acaba à meia-noite, salvo se o horário passar a meia-noite.

## 6. O que precisa do fundador

- **Realismo fotográfico do mapa (R7):** uma chave do Google Maps Platform com a «Map Tiles API» activa e faturação ligada, restrita a genesismz.com e admin.genesismz.com. Antes de prometer, o Genesis testa se o Google tem 3D fotográfico em Maputo, porque a cobertura em África é limitada.
- **Prazo legal para guardar os registos de vendas** (o contabilista confirma); até lá, 10 anos.
- As pendências do PDF de 30/10 continuam:
  - conteúdo do Premium;
  - chave Mapbox restrita;
  - nome legal e NUIT;
  - WhatsApp oficial;
  - Brevo;
  - números de pagamento.
