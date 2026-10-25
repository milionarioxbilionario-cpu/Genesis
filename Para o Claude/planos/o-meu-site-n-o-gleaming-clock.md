# Fase 11 — Site público do Genesis MZ (landing + planos, PT/EN) e SEO

## Contexto
O fundador pesquisa «Genesis MZ» e o site não aparece; as IAs dizem que não existe.
Causa confirmada hoje (24/10) com `curl` como Googlebot a https://genesismz.com:
- **todas** as URLs (`/`, `/robots.txt`, `/sitemap.xml`, `/entrar`…) devolvem 200 com o MESMO
  `index.html` vazio da app (`<div id="root">`), que por JS salta para `/entrar`;
- não há `robots.txt` nem `sitemap.xml` reais, o título é só «Genesis» (palavra genérica:
  Bíblia, banda, Hyundai…), não há texto, dados estruturados, imagem de partilha nem favicon da marca
  (o favicon actual é um ícone azul antigo).
Objectivo: um site público real, em HTML estático (legível sem JS por Google/Bing/IAs), que
apresenta e vende o produto, com planos, e que encaminha para Entrar / Pedir conta / Terminal —
sem estragar a app, o terminal offline nem o PWA instalado.

Decisões do fundador (24/10): preço **3.000 MT/mês**, «o 1.º mês é grátis só para clientes novos»;
contacto WhatsApp **+258 87 015 0055** (provisório — fica numa constante única para trocar);
**site e app com as cores do logótipo**; **PT e EN já**.

Expectativa honesta (a dizer ao fundador): o Google demora dias a semanas a indexar depois de
pedirmos; «Genesis MZ» / «genesismz» deve aparecer em 1.º; «Genesis» sozinho não é realista.
As IAs com pesquisa (ChatGPT via Bing, Perplexity, Gemini via Google) passam a encontrá-lo quando
os motores o indexarem; o «conhecimento» interno das IAs só muda nos próximos treinos.

## Arquitectura escolhida
- **`frontend/index.html` passa a ser a landing (PT)**; a app (SPA React) passa para
  **`frontend/app.html`** (mesmo conteúdo do index actual, `main.jsx`). Páginas novas:
  `planos.html`, `en/index.html`, `en/pricing.html`. Vite multi-página (`build.rollupOptions.input`).
- **Uma fonte de texto, HTML gerado e commitado**: `frontend/site/textos.pt.js` + `textos.en.js` +
  `site/template.js` → `frontend/scripts/gerar_site.mjs` escreve os 4 HTML (padrão igual ao
  `gen_mindmap_data.js`). Teste unitário garante que o HTML commitado = saída do gerador.
- Sem React na landing: `site/site.css` (Tailwind com os mesmos tokens + Inter self-hosted já
  instalada) e `site/site.js` mínimo (menu móvel, encaminhamento abaixo).
- **Encaminhamento a partir da landing** (`site.js`, nunca afecta o Googlebot, que não tem sessão):
  - app instalada (`display-mode: standalone`, ex.: iPhone com start_url `/`) → `/inicio` logo;
  - sessão de dono/caixista (`GET /api/auth/me`) → `/app` ou `/terminal`; browser emparelhado
    como terminal (`GET /api/pos/terminal` 200) → `/terminal`;
  - botões do cabeçalho: «Entrar» → `/inicio` (rota nova da SPA = componente `Root` actual, que
    usa a sessão com refresh e cai em `/entrar`), «Terminal» → `/terminal`,
    «Experimentar grátis» → `/pedir-conta`, «WhatsApp» → `wa.me/258870150055?text=…`.
  - na versão EN, antes de ir para a app, grava a língua do aparelho em EN (mesma chave que
    `frontend/src/i18n/core.js` já usa).
- **SPA**: `App.jsx` ganha `/inicio` → `Root`; `/` continua a existir na SPA (SW antigo em cache).
  `AuthLayout.jsx` troca `<Link to="/">` por `<a href="/">` (abre a landing de verdade).
- **PWA** (`vite.config.js`): `navigateFallback: '/app.html'` + `navigateFallbackDenylist`
  para `/`, `/planos`, `/en/…`, `*.xml`, `*.txt`; `start_url: '/inicio'`; ícones PNG 192/512 +
  maskable (hoje só SVG). A landing fica pré-cacheada (abre offline e reencaminha).
- **Dev/preview**: plugin pequeno no `vite.config.js` (`configureServer` + `configurePreviewServer`)
  reescreve rotas da SPA para `/app.html` (os testes e2e e o `npm run dev` continuam iguais).
- **nginx** (`deploy/nginx.conf` + ficheiro vivo `/etc/nginx/sites-available/genesis`, que tem
  as linhas do certbot): `location = /` → `index.html`; `= /planos` → `planos.html`;
  `/en/`, `= /en/pricing`; `= /robots.txt`, `= /sitemap.xml` com tipo certo;
  SPA: `try_files $uri /app.html /index.html` (funciona com o build antigo E o novo → pode ir
  antes da publicação) + `X-Robots-Tag: noindex` nas rotas da app.
- **SEO** em cada página: título único («Genesis MZ — Sistema de vendas, stock e caixa para
  lojas em Moçambique»), description, canonical, `hreflang` pt-MZ/en/x-default, Open Graph +
  Twitter (imagem 1200×630), JSON-LD `Organization` (nome «Genesis MZ», alternateName «Genesis»,
  logo, contacto), `WebSite`, `SoftwareApplication` (oferta 3000 MZN/mês) e `FAQPage`.
  `public/robots.txt` (Disallow `/app`, `/terminal`, `/suporte`, `/verify`, `/onboarding`,
  `/api/`; Sitemap), `public/sitemap.xml` (4 páginas com alternates), `favicon.ico` real.

## Conteúdo (só o que existe e está verificado — regras 8 e 9)
Landing: herói com captura real do terminal; dores → resposta (caixa que falta → fecho cego;
stock que some/expira → lotes, validades e alertas; chenecas esquecidas; não saber o lucro real →
relatório mensal com salários, renda e despesas); funcionalidades (terminal com leitor/câmara/
atalhos, Dinheiro/M-Pesa/e-Mola/Cartão, funciona sem internet, PIN do dono para cancelar e
descontos, recibo PDF com QR de verificação, impressora USB/Bluetooth, lista de compras e
encomenda por WhatsApp ao fornecedor, sino de alertas, equipa e caixistas com PIN, PT/EN);
para quem (bottle store, mercearia, padaria, talho, restaurante, supermercado — catálogo pronto
com 209 produtos); como começar (pedir conta → aprovação → configurar em 5 passos → emparelhar o
terminal com código de 6 dígitos); segurança (dados de cada loja isolados, auditoria); preço;
FAQ; contacto. **Fora**: relatórios automáticos por WhatsApp (desligados), testemunhos, números
de clientes, «ilimitado» (só se verificado no código), forma de pagar a subscrição e cancelamento
(não definidos → «fale connosco»).
Planos: um plano, 3.000 MT/mês, tudo incluído; «Clientes novos: o 1.º mês é grátis — só começa a
pagar no 2.º mês»; FAQ do plano; CTA.
Imagens: **capturas reais** da app numa loja de demonstração («Bottle Store Exemplo», criada e
apagada por script, em PT e EN), em WebP; imagem OG gerada a partir do logótipo.

## Marca (decisão: site e app com as cores do logo)
- `site/logo.svg` (símbolo G + quadrado dourado; tentar extrair os vectores do
  `Genesis_Imagens/Capa letreiro.pdf`, senão redesenhar o símbolo à mão; wordmark em texto).
- `frontend/src/ui/tokens.css`: `--accent` #0B4D3C (+ hover, soft, text, focus); dourado
  #F0B400 só como cor da marca (logo/site), nunca semântica. `--positive` fica esmeralda.
  O admin herda pelos aliases `@tokens` (verificar build).
- Favicon, ícones PWA, `apple-touch-icon`, `theme-color`; o «G» preto de `AuthLayout.jsx` e do
  `AppShell.jsx` passa a ser o símbolo verdadeiro.
- Rasterização (ícones, OG, WebP) com o Chromium do Playwright já instalado. **Nunca** usar
  `convert` (no Windows é o conversor de discos do sistema).

## Mini-metas (uma de cada vez, prova + checkpoint de 2–3 linhas)
- **11.1 Fundação** — app.html, plugin dev/preview, `/inicio`, PWA (fallback/denylist/start_url),
  robots, sitemap, `nginx.conf`, ícones da marca. Landing provisória mínima.
  Prova: build; `dist/` com os ficheiros; e2e de regressão `flows`, `pos`, `idioma`, `pedir_conta`;
  teste novo em `vite preview` com SW: recarregar `/terminal` **offline** abre o terminal e `/`
  offline em modo standalone reencaminha.
- **11.2 Marca** — logo SVG, tokens, AuthLayout/AppShell, imagem OG. Prova: builds frontend e
  admin; capturas revistas (entrar, painel, terminal, admin); `flows` + `idioma_admin`.
- **11.3 Site PT/EN** — gerador + textos + planos/pricing + JSON-LD + capturas reais
  (`frontend/scripts/capturas_site.mjs`, loja de demonstração apagada no fim).
  Prova: teste unitário do gerador; e2e novo `frontend/tests/e2e/site.mjs` (título/h1/canonical/
  hreflang por página, JSON-LD faz parse, links Entrar/Terminal/Pedir conta/WhatsApp/planos e
  PT↔EN funcionam, standalone → `/inicio`, dono com sessão → `/app`, 390 px sem deslocamento
  horizontal, 0 erros de JS); HTML lido sem JS contém o texto; capturas revistas.
- **11.4 Publicar** (pedir confirmação antes: mexe no nginx de produção) — `ssh` ler o ficheiro
  vivo, cópia de segurança, aplicar só os `location`, `nginx -t`, reload; depois commit + push +
  `publicar.sh`. Prova de fora com UA do Googlebot: `/` com o h1 e JSON-LD; `/robots.txt`
  `text/plain`; `/sitemap.xml` XML; `/app` com `X-Robots-Tag: noindex`; `/favicon.ico` imagem;
  `/entrar`, `/terminal`, admin 200; `site.mjs` e `flows.mjs` contra genesismz.com. IndexNow
  (Bing) com ficheiro-chave.
- **11.5 Guia para o fundador** (texto simples/PDF): Google Search Console (propriedade de domínio
  pela Cloudflare, submeter sitemap, pedir indexação), Bing Webmaster Tools (importar do Google —
  alimenta o ChatGPT/Copilot), verificar na Cloudflare que «Block AI bots»/«AI Crawl Control» não
  bloqueia, Perfil de Empresa no Google (opcional), ligar redes sociais ao site. Oferecer fazê-lo
  em conjunto pelo Chrome.
- **Paragem entre fases** depois da 11.5.

## Ficheiros principais
Novos: `frontend/app.html`, `frontend/planos.html`, `frontend/en/{index,pricing}.html` (gerados),
`frontend/site/{template.js,textos.pt.js,textos.en.js,site.css,site.js,logo.svg}`,
`frontend/scripts/{gerar_site,capturas_site,gerar_icones}.mjs`, `frontend/public/{robots.txt,
sitemap.xml,favicon.ico,icons/*,site/*}`, `frontend/tests/site.test.mjs`,
`frontend/tests/e2e/site.mjs`.
Alterados: `frontend/index.html` (landing), `frontend/vite.config.js`, `frontend/tailwind.config.js`
(content), `frontend/src/App.jsx`, `frontend/src/pages/auth/AuthLayout.jsx`,
`frontend/src/layouts/AppShell.jsx`, `frontend/src/ui/tokens.css`, `deploy/nginx.conf`,
`CLAUDE.md` (rotas/arquitectura), documentação do protocolo (Mapa Mental A+B, `Oque ja fiz…txt`,
`mapa_mental_status.json` + `node scripts/gen_mindmap_data.js`). Memória: número de contacto
provisório.

## Verificação ponta-a-ponta (resumo)
1. `npm run build` (frontend e admin) + grep do bundle (sem código admin).
2. Unitários: `site.test.mjs`, `i18n.test.mjs`, `offline_queue.test.mjs`.
3. e2e locais (backend de teste em `TZ=UTC`): `site.mjs` + regressão `flows`, `pos`, `idioma`,
   `pedir_conta`, `idioma_admin`; offline com SW em `vite preview`.
4. Produção: `curl` com UA Googlebot às URLs acima; `site.mjs` e `flows.mjs` contra o site.
5. Fundador: Search Console «Inspecionar URL» → «Pedir indexação»; teste de resultados
   enriquecidos do Google na `/`.
