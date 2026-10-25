# Plano — Etapa 0 + Fases 12 a 20: corrigir, embelezar e cobrir todos os negócios moçambicanos

## Contexto
O fundador (Kleyton Abelardo Velichane, GitHub **Mente-MiIionaria**) testou genesismz.com no iPhone e comparou o Genesis com a concorrência:
- SIGEM, SmartChoice, SmartConta, PharmaSys/MozAbility;
- a app da Alibaba que trabalha offline;
- o DartPOS e o recibo do SPAR VIP;
- uma conversa com a IA do Google, que disse que o Genesis não serve para encomendas tipo Shein e perde no visual e na restauração.

**Objectivo:** corrigir os defeitos vistos, melhorar o visual (painel, terminal, site) e acrescentar os módulos que faltam para cobrir os negócios reais do país:
- vários estabelecimentos do mesmo dono;
- restaurante;
- revenda sem stock, artigos únicos e encomendas com sinal;
- IVA, multas, venda ao peso.

**Modo de trabalho pedido:** sem interrupções. No fim de cada etapa faço testes, commit, push e publicação em genesismz.com, deixo um aviso curto e sigo para a etapa seguinte. Isto é uma excepção à regra 1 autorizada pelo fundador, e fica registada na memória. Só paro se algo for irreversível e não estiver coberto por este plano.

## Decisões do fundador (25/10/2026)
| Tema | Decisão |
|---|---|
| Ordem | Defeitos primeiro: Etapa 0 → 12 → 20 |
| Autoria | Todos os commits (antigos e novos) em nome de **Mente-MiIionaria**, sem linhas Claude/Copilot |
| Repositório | Passa a **privado** (eu faço pelo Chrome dele, com a sessão do GitHub já aberta) |
| Ficheiros do Claude | No GitHub, dentro de `Para o Claude/`, com a memória e as instruções para mudar de PC |
| BD de produção | Posso aplicar migrações **só aditivas**, sempre com cópia de segurança antes |
| Bloqueio do painel | PIN pessoal do dono + Face ID/impressão digital; bloqueia ao reabrir e após 5 min parado; 5 erros → senha |
| Cores do turno | verde = abriu, cinzento = fechou, laranja = ainda não abriu, vermelho = só problemas |
| Servente | Tira pedidos, gere mesas, ecrã da cozinha, cancelar com PIN do dono; **não fecha a venda** (detalhes na Fase 18) |
| Desconto por estabelecimentos | **Decisão minha:** 1–2 = sem desconto; 3–9 = 10%; 10 ou mais = 15%. Ex.: 3 = 8 100 MT, 10 = 25 500 MT. Uma só constante, para mudar facilmente |
| Premium | Faço já o mecanismo (Básico 3 000 / Premium 8 000). O conteúdo do Premium fica "conteúdos premium e personalizados" até ele decidir; nada é bloqueado no Básico por agora |
| Gerente | Não vê: os outros estabelecimentos, a subscrição/pagamentos/aniversário, o PIN de autorização, o lucro (bruto e líquido) nem os custos (salários, renda, custo dos produtos). Nos relatórios vê só quanto se vendeu: receita, n.º de vendas, mais vendidos, formas de pagamento |
| Extras | Todos: etiquetas com código de barras, clientes e fidelidade, venda em espera + ecrã de sincronização, farmácia, salão |
| Só registar no Mapa Mental | Apps Android/iOS/computador; modo escuro; chat com IA no Premium (ex.: "quanto fez hoje o estabelecimento 2 da Av. Eduardo Mondlane?"); confirmação automática de pagamentos |

## Protocolo no fim de CADA etapa (sempre igual)
1. **Testes:**
   - unitários `node --test`;
   - `verify_system.js` com o backend real;
   - Playwright `flows.mjs`, `pwa_offline.mjs` (Chromium + WebKit), `site.mjs`, `reports.mjs`, mais os testes novos da etapa;
   - capturas a 390 / 768 / 1440 px revistas por mim;
   - grep do mesmo padrão de bug.
2. **Documentação:**
   - Mapa Mental Parte A + B;
   - `Oque ja fiz para corrigir estes erros.txt`;
   - `mapa_mental_status.json` + `node scripts/gen_mindmap_data.js`;
   - textos do site actualizados com o que passou a existir (só o que foi verificado, para as IAs e o Google deixarem de dizer que "não serve").
3. `node scripts/backup_claude.mjs`, que copia CLAUDE.md, skills, memória e planos para `Para o Claude/`.
4. **Commit e push:** commit (autor Mente-MiIionaria, sem atribuições) + `git push`.
5. **Base de dados de produção** (se houver migração):
   - cópia com `pg_dump` no servidor;
   - `prisma db execute` com o SQL aditivo em `prisma/migrations/<data>_<nome>/`;
   - schema.prisma e schema.sqlite.prisma iguais.
6. **Publicação e prova:**
   - `APP_HOST=genesismz.com ADMIN_HOST=admin.genesismz.com bash deploy/publicar.sh 139.162.186.49`;
   - repetir site.mjs, flows.mjs e pwa_offline.mjs contra https://genesismz.com, com a loja de teste apagada no fim.
7. **Aviso ao fundador:** curto, em linguagem simples, com o que ele deve testar no iPhone. Depois sigo para a etapa seguinte.

---

## Etapa 0 — Repositório em nome do fundador, privado, com "Para o Claude"
Estado verificado:
- 62 commits com autor `unknown <CMM@CMM_GDEI_02.cmcm.local>` (o PC não tem `user.name`/`user.email`);
- 57 com `Co-Authored-By: Claude…` + `Claude-Session:`;
- 0 de Copilot;
- o repositório `milionarioxbilionario-cpu/Genesis` é **público**.

Passos:
1. **Cópia de segurança:** `git bundle create <scratchpad>/genesis-antes-reescrita.bundle --all` + tag local `antes-reescrita`.
2. **Identidade:** `git config user.name "Mente-MiIionaria"` e `user.email "218531686+Mente-MiIionaria@users.noreply.github.com"`. É o e-mail privado do GitHub da conta confirmada pelo README "KLEYTON ABELARDO…"; liga os commits a essa conta sem expor o Gmail.
3. **Pasta `Para o Claude/`:**
   - `CLAUDE.md` e `skills/` (as 3 guias);
   - `memoria/` (cópia de `~/.claude/projects/C--Users-CMM-Desktop-Genesis/memory/`);
   - `planos/`;
   - `restaurar.mjs`, que repõe `CLAUDE.md` na raiz, `.claude/skills/` e a memória no caminho certo do PC novo, calculado a partir da pasta onde se clonou;
   - `COMO MUDAR DE PC.txt`, em linguagem simples.
   - Na raiz, `CLAUDE.md` e `.claude/` passam para o `.gitignore`: o Claude Code só os lê ali, por isso ficam no PC e a cópia versionada fica na pasta.
   - Os `.jsonl` das conversas não vão: são enormes e contêm IPs, e-mails e capturas.
4. **Reescrever o histórico com `git filter-branch`:**
   - `--env-filter`: autor e committer = Mente-MiIionaria;
   - `--msg-filter`: apaga as linhas Co-Authored-By/Claude-Session e qualquer menção a Claude/Copilot/Anthropic;
   - `--index-filter`: tira `CLAUDE.md` e `.claude/` da raiz nos commits antigos.
5. **Verificar:**
   - `git log --format='%an %ae%n%B' | grep -ic 'claude\|copilot\|anthropic'` → 0 (excepto o nome da pasta);
   - `git diff antes-reescrita HEAD --stat` só com as mudanças de sítio dos ficheiros.
6. **Publicar:** `git push --force-with-lease origin main`. O deploy não usa o GitHub, por isso não é afectado.
7. **Pelo Chrome do fundador:** GitHub → Settings → Change visibility → Private. Confirmar na API que o repositório deixa de ser público e que o contribuidor é Mente-MiIionaria.
8. **Regras daqui em diante:**
   - os commits deixam de levar as linhas de atribuição (CLAUDE.md + memória `git-authorship`);
   - limpar as menções a "Claude" do Mapa Mental que não sejam o nome da pasta.

## Fase 12 — Defeitos que o fundador viu
Causas confirmadas no código:
- `Login.jsx:67-86`: `renderButton` corre outra vez no mesmo div;
- `Terminal.jsx:23-33` e `session.jsx:13-26`: o arranque depende sempre da API;
- `tokens.js` + `refresh.js:44`: sessão de 30 dias renovada sozinha e sem bloqueio;
- `PosScreen.jsx:249,359,383-412`: `h-screen` no iOS, carrinho a 55vh e pagamento fixo.

**12.1 Botão Google:**
- `initialize` corre uma só vez, com `afterLogin` num `useRef`;
- na troca de língua desenha-se num contentor novo escondido, que só substitui o antigo quando o iframe carrega;
- altura fixa reservada.
- Teste: PT↔EN 5 vezes, nunca mais de 1 iframe visível.

**12.2 Terminal arranca sem rede:**
- Dexie (`db.version` nova) guarda a última resposta de `/api/pos/terminal`, por tenant.
- PIN do caixista validado no aparelho: o servidor envia ao terminal emparelhado um verificador PBKDF2 com sal por caixista, nunca o PIN; muda quando o `pv` muda e é apagado ao desemparelhar.
- Limite de 5 erros em 15 min, guardado localmente.
- Uma sessão offline só vende para a fila; o `posWriteAuth` + `seller_user_id` aceitam essas vendas quando a rede volta.

**12.3 Painel do dono sem rede = leitura:**
- Se `/api/auth/me` falhar por falta de rede (não por 401), usa-se o último utilizador guardado e aparece uma faixa "Sem ligação — a mostrar dados de HH:MM".
- SW com `runtimeCaching` NetworkFirst para os GET do dono; o cache é limpo no logout e na troca de conta.
- As acções que gravam ficam desactivadas, com explicação.
- `globPatterns` passa a incluir `woff2,svg,png,webp`; o SW passa a ser registado também no site.

**12.4 Bloqueio do painel:**
- Novo `User.lock_pin_hash` (migração aditiva) e tabela `WebAuthnCredential` (Face ID/impressão digital como passkey: `@simplewebauthn/server` + `/browser`).
- Rotas `PUT /api/profile/lock-pin` (pede a senha), `POST /api/auth/unlock` (PIN ou WebAuthn) e registo/remoção da passkey.
- **Imposto no servidor:**
  - o cookie `genesis_unlock` é de sessão (morre ao fechar o browser ou a app) e assinado, com validade deslizante de 5 min;
  - o middleware `auth.js` devolve 423 `PANEL_LOCKED` às rotas do dono sem ele;
  - um relógio no cliente mostra o `LockScreen` (`PinPad` + botão Face ID) ao fim de 5 min sem toque.
- 5 erros → termina a sessão e pede a senha. A contagem é própria, à parte da do PIN de cancelamento.
- Na 1.ª entrada sem PIN, obriga a criá-lo.
- Teste: autenticador virtual do Playwright para a passkey; reabrir o contexto → bloqueado; a API sem desbloqueio → 423.

**12.5 Telemóvel, tablet e PC:**
- **PosScreen:**
  - `100dvh` + `viewport-fit=cover` + safe-area;
  - telemóvel: a grelha ocupa o ecrã, com uma barra fixa em baixo ("3 itens · 450 MT · Cobrar") que abre um `Drawer` com o carrinho e o pagamento a rolar;
  - tablet (≥768): 2 colunas, carrinho de 340 px;
  - PC: como hoje;
  - sem foco automático na pesquisa em ecrãs de toque.
- **AppShell e tabelas:** no telemóvel, as tabelas passam a cartões e o menu fica com tamanhos de toque certos.
- **"Site para computador" no Safari:** é o comportamento normal; explicar ao fundador e não forçar nada.

## Fase 13 — Visão geral nova + modo privado + animação
- **Antes de desenhar:** extrair imagens dos 3 vídeos com ffmpeg para estudar o dashboard animado.
- **`GET /api/owner/overview`** num só pedido, com dia de Maputo:
  - hoje: receita, vendas, lucro bruto;
  - meta do mês: barra, quanto falta, projecção;
  - caixistas: estado do turno com as cores decididas e as vendas de hoje (`firstActivityAt` exportado de `utils/shift.js`);
  - as últimas 5 vendas;
  - 1 linha de alertas.
- **Sem repetições:** stock baixo, chenecas e o gráfico de 7 dias vivem só nas suas páginas. Retirar de `dashboard.js` o que deixa de ser usado.
- **Animação sóbria** (hook `useCountUp` com `requestAnimationFrame`, sem biblioteca):
  - números que sobem em ~600 ms;
  - barras e meta que crescem ao entrar;
  - entrada em cascata dos cartões;
  - tudo desligado com `prefers-reduced-motion`.
  - Actualizar a regra do CLAUDE.md sobre animação.
- **Modo privado** (botão de olho no cabeçalho, para todos os donos e gerentes):
  - `money()` e os eixos dos gráficos mostram `•••• MT`;
  - opção "começar sempre escondido";
  - não mexe nos recibos nem no terminal.
  - Teste: nenhum valor em MT visível no DOM.

## Fase 14 — Site novo
- **Topo:**
  - cabeçalho com Entrar / Terminal / Experimentar grátis sempre visíveis, também no telemóvel;
  - hero com as 3 acções.
- **Cor e texto:**
  - faixas com a paleta da marca (verde #0B4D3B, verde suave, dourado nos destaques), sem ar de IA;
  - cada funcionalidade com resumo + "Ver mais detalhes" (`<details>`; funciona sem JS e o Google lê);
  - textos reescritos como soluções: validades ("o Genesis avisa antes de expirar e vende primeiro o lote mais antigo") e os relatórios explicados um a um.
- **Layout diferente por ecrã** (lista no telemóvel, 2 colunas no tablet, grelha no PC), com capturas reais do telemóvel geradas por `capturas_site.mjs`.
- **Scroll animado profissional:** fade + 8 px com IntersectionObserver e reduced-motion; sem JS fica tudo visível.
- **Sem fotos de stock nem pessoas inventadas:** capturas reais + ilustrações próprias. Comparação factual sem nomes de concorrentes.
- **/planos:**
  - calculadora de estabelecimentos com o total animado em tempo real (regra de desconto acima);
  - Básico vs Premium ("conteúdos premium e personalizados");
  - IndexNow de novo.

## Fase 15 — Recibo profissional, impostos, multas, peso, pagamento misto
- **Logótipo do estabelecimento:**
  - upload pelo dono, com aviso claro "não é a sua foto pessoal — aparece nos recibos";
  - guardado no servidor, redimensionado e convertido para preto e branco para a térmica (raster ESC/POS);
  - sem logótipo, o espaço é ocupado pela restante informação.
- **Recibo redesenhado nos 3 formatos** (HTML, PDF 80 mm, ESC/POS): logo, nome, NUIT, telefone, morada, n.º, caixista, linhas, IVA (se activo), formas de pagamento, troco, QR de verificação, código de barras do documento e mensagem final configurável. Também uma versão-imagem bonita para enviar por WhatsApp.
- **Abrir a gaveta de dinheiro** pela impressora ESC/POS (pulso), que é um ponto forte do DartPOS.
- **IVA opcional por loja:**
  - `Tenant.vat_mode` (none | iva | ispc) e `Product.vat_rate`;
  - o IVA fica guardado na venda em centavos, com arredondamento testado;
  - relatório mensal com o IVA cobrado.
  - Taxas do IVA, do ISPC, do INSS e das taxas municipais confirmadas em fontes oficiais (AT e INSS de Moçambique), citadas no Mapa Mental.
- **INSS:** percentagem do patrão sobre os salários, como termo `total_taxes` em `monthlyDeductions.js`.
- **Multas:** categoria própria (motivo, entidade, valor, data), que desconta no lucro real. As taxas anuais do município ficam como custo fixo repartido por mês.
- **Pagamento misto + transferência:** tabela `SalePayment` (N pagamentos em centavos); `transfer` separado de `card`. O fecho cego continua a contar só o dinheiro.
- **Venda ao peso/medida:**
  - `Product.unit` (un/kg/l/m) e quantidades em milésimos inteiros (`quantity_milli`), também no stock; nada de floats;
  - teclado de peso no POS;
  - grep de todas as contas com quantidades.

## Fase 16 — Perfil do dono, planos e aniversário
- **Página Perfil:**
  - mudar a senha (actual + nova + confirmar);
  - logótipo do estabelecimento (o mesmo da Fase 15);
  - número do WhatsApp dos alertas;
  - mudar de e-mail, com código no e-mail actual **e** no novo (reutilizar o serviço de e-mail do `/forgot-password`);
  - passkey e PIN de bloqueio.
- **Planos:** `Tenant`/organização com `plan` (basic | premium), `plan_period` (monthly | annual) e `premium_until`. O admin passa a ver o plano.
- **Data de aniversário do dono:**
  - só pode ser definida uma vez e fica bloqueada no servidor;
  - antes de a pôr não se fala do presente; depois aparece a explicação e o ícone 🎁 no Perfil.
- **No dia do aniversário:**
  - ao entrar aparece uma janela de parabéns com o estilo da marca, a dizer que o presente está no Perfil;
  - ao recolher, ganha 1 mês de Premium.
  - **Regras:** mensal com a subscrição em dia → o Premium começa no próximo ciclo; anual Básico → sobe já nesse dia e volta ao Básico no mesmo dia do mês seguinte.
  - O ícone fica transparente depois de recolhido; o botão "i" explica para que serve.
  - Tudo auditado; uma vez por ano, verificado no servidor.

## Fase 17 — Vários estabelecimentos, gerente e mapa
- **Modelo:**
  - cada estabelecimento continua a ser um tenant (o RLS fica intacto);
  - `Organization` (a conta do dono) + `TenantMembership` (utilizador ↔ N tenants, papel `owner` ou `manager`).
- **Painel supremo do dono:**
  - visão geral de todos (soma de um `dailyReport` por tenant, cada um com `runWithTenant`; nunca uma query sem filtro);
  - meta geral;
  - lista de estabelecimentos → "Entrar" abre o painel daquele local; "Voltar à visão geral";
  - perfil, aniversário e subscrição;
  - **mapa** (Leaflet + OpenStreetMap) com os estabelecimentos marcados à mão no perfil de cada um.
- **Gerente:**
  - papel novo, criado pelo dono para um estabelecimento;
  - vê só o painel daquele local e não sabe que existe mais nada;
  - fica-lhe escondido o que foi decidido acima: o backend corta os campos de lucro e custos (não é só o ecrã), e os relatórios dele mostram só o que se vendeu.
- `POST /api/auth/switch-tenant` só com membership de dono.
- **Onboarding:** "Quantos estabelecimentos tem?" e o tipo de cada um.
- **Preço:** a calculadora animada com o desconto, no Perfil e em /planos.
- **Prova:** secção nova no `verify_system`:
  - o dono A não vê a organização de B;
  - o gerente da loja 1 recebe 403 na loja 2 e não recebe campos de lucro;
  - RLS com o cliente app.

## Fase 18 — Restaurante, hamburgueria, churrasco
- **Visual por nicho:** o tipo de negócio liga módulos, ícones e palavras (o restaurante tem Mesas, Pedidos e Cozinha). A marca fica a mesma.
- **Mesas:** "Quantas mesas tem?" no onboarding, editável depois. **Reservas** com data, hora, mesa, nome e telefone.
- **Novo perfil Servente** (PIN no terminal, como o caixista). Abre a mesa: nome do cliente, hora a que se sentou, servente responsável.
- **Pedido aberto** (`OpenOrder`/`OpenOrderItem`):
  - os pratos acumulam ao longo da refeição;
  - antes de sair da cozinha, cancelar pede só o motivo; depois de sair pede o motivo + PIN do dono;
  - tudo vai para um só recibo no fim.
- **Ecrã da cozinha:** pedidos por ordem, "a preparar" → "pronto", e o aviso chega ao servente.
- **Limite de tempo sem consumo** (configurável, ex.: 3 h): conta a partir do último pedido; avisa o servente perto do limite, com o número da mesa.
- **Fecho da conta:**
  - o servente envia a conta ao caixista, com a forma de pagamento;
  - dinheiro: o servente recebe e entrega ao caixista;
  - POS/cartão: o servente pode cobrar, mas envia os dados;
  - estados: "Enviado — por confirmar" → o caixista confirma quando tem o dinheiro → "Confirmado", e só então o servente leva o recibo;
  - a `Sale` só nasce confirmada, ligada ao servente responsável e ao caixista que confirmou.
- **Recibo do restaurante:** logótipo, mesa, servente, hora de entrada e de saída, tempo à mesa, pratos.
- **Offline:** pedidos em Dexie com ids do cliente; a sincronização é idempotente.

## Fase 19 — Revendedores, artigos únicos, encomendas e prestações
- **Venda sem stock (revenda imediata):** o produto marcado "sem stock" pede o custo no momento da venda (comprou na loja, revende já). Lucro = preço − custo; não há alertas de stock.
- **Artigo único** (ex.: um iPhone):
  - quantidade 1, sem reposição;
  - ao vender sai da lista do POS e do catálogo activo e fica no histórico;
  - sem alerta de stock baixo.
- **Encomendas com sinal** (`CustomerOrder` + `OrderPayment`):
  - cliente, artigos (catálogo ou texto com link/foto), custo, frete/desembarque, preço cobrado, sinais;
  - estados: Encomendado → A caminho → Chegou → Entregue → Pago;
  - comissão/lucro real por encomenda;
  - lembrete do que falta cobrar (reutiliza a lógica das chenecas).
- **Prestações** para valores altos (carro, terreno): plano de pagamentos sobre o mesmo modelo.
- **Relatório mensal:** lucro das encomendas entregues + sinais recebidos ainda por entregar.
- **No site:** "Para revendedores e importação" (só depois de verificado).

## Fase 20 — Extras vistos na concorrência
- **Etiquetas PDF** (A4 para recortar ou rolo térmico) com nome, preço, código de barras gerado para quem não o tem, e validade.
- **Clientes e fidelidade:** ficha (nome, telefone, histórico), cliente opcional na venda, pontos ou desconto para clientes habituais configurável pelo dono, sem passar o limite de desconto sem PIN.
- **Venda em espera:** guardar o carrinho, atender outro cliente e retomar. **Ecrã "Sincronização"** com o pendente por tipo (vendas, quebras, procura) e o botão "Sincronizar agora".
- **Farmácia:** tipo de negócio com catálogo, validade obrigatória e campo "precisa de receita" (o caixista confirma).
- **Salão/barbearia:** serviços (corte, trança), marcações com data e hora e o profissional que atendeu (comissão opcional).

## Riscos e limites (ditos com honestidade)
- **Não tenho iPhone:** uso o WebKit do Playwright e a emulação do iPhone. O teste final no aparelho é do fundador, pedido no aviso de cada etapa.
- **Sem aparelhos reais para testar:** a térmica, a gaveta e o Face ID ficam testados com emulação (autenticador virtual, bytes ESC/POS).
- **E-mail:** a mudança de e-mail depende do serviço de e-mail já configurado em produção; se não existir, digo-o no aviso.
- **Reescrita do histórico:** os hashes de todos os commits mudam. Fica a cópia em bundle e a tag `antes-reescrita` no PC.

## Ficheiros principais
- **Backend:** `backend/prisma/schema.prisma` + `schema.sqlite.prisma` + `prisma/migrations/*` + `prisma/rls_v2.sql`, `src/middleware/auth.js`, `src/utils/tokens.js`, `src/utils/shift.js`, `src/services/reports.js`, `src/services/monthlyDeductions.js`, `src/routes/{auth,pos,owner,settings,dashboard,sales}.js`, mais rotas novas (`profile`, `org`, `orders`, `restaurant`).
- **Frontend:**
  - `frontend/src/pages/auth/Login.jsx`, `pages/pos/{Terminal,PosScreen,PosDialogs}.jsx`, `pages/owner/Home.jsx`;
  - `utils/{session.jsx,api.js,format.js,receiptPrinter.js,escpos.js}`, `utils/pdf/receiptPdf.js`, `db/localDb.js`;
  - `components/ui/*`, `vite.config.js`;
  - `site/{textos.pt,textos.en,template,site}.js`, `site/site.css`.
- **Repositório:** `.gitignore`, `Para o Claude/*`, `scripts/backup_claude.mjs`.
