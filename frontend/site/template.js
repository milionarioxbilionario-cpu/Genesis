// Modelo das paginas do site publico (Fase 11.3). Funcoes puras: recebem os
// textos de uma lingua (textos.pt.js / textos.en.js) e devolvem o HTML
// completo. Quem escreve os ficheiros e scripts/gerar_site.mjs.
// O conteudo esta todo no HTML (Google, Bing e IAs leem sem correr JS); o
// site.js so trata do menu, do encaminhamento e da saudacao do WhatsApp.

import { markSvg } from '../src/ui/marca.js';
import { SITE_URL, SITE_UPDATED, WHATSAPP, WHATSAPP_DISPLAY, PLAN_PRICE_CENTS, PAYMENT } from './config.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Ancoras da landing em cada lingua.
const IDS = {
  pt: { features: 'funcionalidades', who: 'para-quem', how: 'como-comecar', faq: 'perguntas', pay: 'como-pagar' },
  en: { features: 'features', who: 'who-it-is-for', how: 'getting-started', faq: 'faq', pay: 'how-to-pay' },
};

export function priceText(t) { return t.price(PLAN_PRICE_CENTS / 100); }
const fill = (t, s) => s.replace(/\{price\}/g, priceText(t));

// Ligacao ao WhatsApp: sem JS sai com «Ola»; o site.js troca pela saudacao da
// hora do visitante (data-wa guarda a mensagem com {g}).
export function waHref(t, key) {
  const msg = fill(t, t.wa[key]);
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg.replace('{g}', t.wa.fallback))}`;
}
const waAttrs = (t, key) => `href="${esc(waHref(t, key))}" data-wa="${esc(fill(t, t.wa[key]))}" target="_blank" rel="noopener"`;

const logo = (size, cls = '') => markSvg({ size, radius: 0.22, scale: 0.62 }).replace('<svg ', `<svg aria-hidden="true" focusable="false" class="${cls}" `);

// ----------------------------------------------------------------- pecas
function head(t, page, ctx) {
  const m = t.meta[page];
  const title = fill(t, m.title);
  const desc = fill(t, m.description);
  const here = t.paths[page];
  const pt = page === 'home' ? '/' : '/planos';
  const en = page === 'home' ? '/en/' : '/en/pricing';
  const ogImg = SITE_URL + t.og;
  return `<!DOCTYPE html>
<html lang="${t.htmlLang}" data-wa-greet="${esc(t.wa.greet.join('|'))}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${SITE_URL}${here}" />
    <link rel="alternate" hreflang="pt-MZ" href="${SITE_URL}${pt}" />
    <link rel="alternate" hreflang="en" href="${SITE_URL}${en}" />
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${pt}" />
    <meta name="theme-color" content="#0B4D3B" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Genesis MZ" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${SITE_URL}${here}" />
    <meta property="og:image" content="${ogImg}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Genesis MZ" />
    <meta property="og:locale" content="${t.ogLocale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${ogImg}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd(t, page, ctx)).replace(/</g, '\\u003c')}</script>
    <!-- Antes do 1.o desenho: com JS os blocos aparecem ao descer (site.css .rv); sem JS fica tudo visivel. -->
    <script>document.documentElement.classList.add('js')</script>
    <script type="module" src="/site/site.js"></script>
  </head>`;
}

function jsonLd(t, page) {
  const org = {
    '@type': 'Organization', '@id': SITE_URL + '/#org', name: 'Genesis MZ', alternateName: ['Genesis', 'genesismz'],
    url: SITE_URL + '/', logo: SITE_URL + '/icons/icon-512.png',
    contactPoint: { '@type': 'ContactPoint', telephone: '+' + WHATSAPP, contactType: 'sales', areaServed: 'MZ', availableLanguage: ['Portuguese', 'English'] },
  };
  const app = {
    '@type': 'SoftwareApplication', '@id': SITE_URL + '/#app', name: 'Genesis MZ',
    applicationCategory: 'BusinessApplication', applicationSubCategory: t.lang === 'pt' ? 'Ponto de venda' : 'Point of sale',
    operatingSystem: 'Web', url: SITE_URL + t.paths.home, inLanguage: ['pt', 'en'], description: fill(t, t.meta.home.description),
    publisher: { '@id': SITE_URL + '/#org' },
    offers: {
      // Sem priceSpecification: o teste de resultados do Google nao o aceita
      // aqui (25/10/2026). O "por mes" esta no texto da pagina.
      '@type': 'Offer', price: String(PLAN_PRICE_CENTS / 100), priceCurrency: 'MZN', url: SITE_URL + t.paths.pricing,
      eligibleRegion: { '@type': 'Country', name: 'Mozambique' },
    },
  };
  const faqItems = page === 'home' ? t.faq.items : t.pricing.faq;
  const faq = { '@type': 'FAQPage', mainEntity: faqItems.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: fill(t, f.a) } })) };
  const graph = [org, app, faq];
  if (page === 'home') graph.splice(1, 0, { '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL + '/', name: 'Genesis MZ', alternateName: 'Genesis', inLanguage: t.htmlLang, publisher: { '@id': SITE_URL + '/#org' } });
  graph.forEach((g) => { if (g['@type'] !== 'Organization') g.dateModified = SITE_UPDATED; });
  return { '@context': 'https://schema.org', '@graph': graph };
}

function header(t, page, { icon }) {
  const id = IDS[t.lang];
  const home = t.paths.home;
  const anchor = (k) => (page === 'home' ? `#${id[k]}` : `${home}#${id[k]}`);
  const links = [
    [t.nav.features, anchor('features')], [t.nav.who, anchor('who')], [t.nav.how, anchor('how')],
    [t.nav.pricing, t.paths.pricing], [t.nav.faq, anchor('faq')],
  ];
  const other = page === 'home' ? t.other.home : t.other.pricing;
  const navLink = ([label, href]) => `<a href="${href}" class="nav-link"${href === t.paths[page] ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
  return `
    <a href="#conteudo" class="skip">${t.lang === 'pt' ? 'Saltar para o conteúdo' : 'Skip to content'}</a>
    <header class="sticky top-0 z-30 border-b border-border bg-surface">
      <div class="mx-auto flex h-16 max-w-content items-center gap-6 px-4 sm:px-6">
        <a href="${home}" class="flex shrink-0 items-center gap-2.5" aria-label="Genesis MZ — ${esc(t.nav.home)}">
          ${logo(32, 'h-8 w-8')}
          <span class="text-md font-semibold tracking-tight text-ink">Genesis <span class="text-brand">MZ</span></span>
        </a>
        <nav class="hidden items-center gap-6 lg:flex" aria-label="${esc(t.nav.menu)}">${links.map(navLink).join('')}</nav>
        <div class="ml-auto flex items-center gap-2">
          <a href="${other}" hreflang="${t.other.lang}" lang="${t.other.lang}" class="btn-ghost hidden sm:inline-flex" title="${esc(t.other.label)}">${icon('languages', 'h-4 w-4')}${t.other.short}</a>
          <a data-app href="/terminal" class="btn-ghost hidden xl:inline-flex">${icon('monitor', 'h-4 w-4')}${esc(t.nav.terminal)}</a>
          <a data-app href="/inicio" class="btn-secondary">${esc(t.nav.signIn)}</a>
          <a data-app href="/pedir-conta" class="btn-primary hidden sm:inline-flex">${esc(t.nav.start)}</a>
          <button type="button" class="btn-icon lg:hidden" data-menu-toggle aria-expanded="false" aria-controls="menu" aria-label="${esc(t.nav.menu)}">${icon('menu', 'h-5 w-5')}</button>
        </div>
      </div>
      <div id="menu" data-menu hidden class="border-t border-border bg-surface lg:hidden">
        <nav class="mx-auto flex max-w-content flex-col px-4 py-3 sm:px-6" aria-label="${esc(t.nav.menu)}">
          ${links.map(([l, h]) => `<a href="${h}" class="menu-link">${esc(l)}</a>`).join('')}
          <a data-app href="/inicio" class="menu-link">${esc(t.nav.signIn)}</a>
          <a data-app href="/terminal" class="menu-link">${esc(t.nav.terminal)}</a>
          <a href="${other}" hreflang="${t.other.lang}" lang="${t.other.lang}" class="menu-link">${esc(t.other.label)}</a>
          <a data-app href="/pedir-conta" class="btn-primary mt-3 justify-center">${esc(t.nav.start)}</a>
        </nav>
      </div>
    </header>`;
}

function footer(t, page, { icon }) {
  const id = IDS[t.lang];
  const home = t.paths.home;
  const other = page === 'home' ? t.other.home : t.other.pricing;
  const col = (title, items) => `<div><p class="text-sm font-semibold text-ink">${esc(title)}</p><ul class="mt-3 space-y-2">${items.join('')}</ul></div>`;
  const li = (label, href, extra = '') => `<li><a href="${href}" class="footer-link"${extra}>${esc(label)}</a></li>`;
  return `
    <footer class="border-t border-border bg-surface">
      <div class="mx-auto grid max-w-content gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <a href="${home}" class="flex items-center gap-2.5">${logo(28, 'h-7 w-7')}<span class="font-semibold text-ink">Genesis <span class="text-brand">MZ</span></span></a>
          <p class="mt-3 text-base text-ink-muted">${esc(t.footer.tagline)}</p>
        </div>
        ${col(t.footer.product, [li(t.nav.features, `${home}#${id.features}`), li(t.nav.pricing, t.paths.pricing), li(t.nav.faq, `${home}#${id.faq}`)])}
        ${col(t.footer.access, [li(t.nav.signIn, '/inicio', ' data-app'), li(t.nav.terminal, '/terminal', ' data-app'), li(t.footer.request, '/pedir-conta', ' data-app')])}
        ${col(t.footer.contact, [`<li><a ${waAttrs(t, 'contact')} class="footer-link inline-flex items-center gap-2">${icon('message-circle', 'h-4 w-4')}${esc(t.footer.whatsapp)} ${WHATSAPP_DISPLAY}</a></li>`])}
      </div>
      <div class="border-t border-border">
        <div class="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-ink-muted sm:px-6">
          <span>${esc(t.footer.rights)}</span>
          <a href="${other}" hreflang="${t.other.lang}" lang="${t.other.lang}" class="footer-link inline-flex items-center gap-1.5">${icon('languages', 'h-4 w-4')}${esc(t.other.label)}</a>
        </div>
      </div>
    </footer>
  </body>
</html>
`;
}

// Imagem real da app (capturas em public/site/shots, ver scripts/capturas_site.mjs).
function shot(ctx, key, alt, { eager = false, cls = '' } = {}) {
  const s = ctx.shots[key];
  if (!s) throw new Error('falta a captura ' + key + ' (correr scripts/capturas_site.mjs)');
  return `<img src="/site/shots/${s.file}" width="${s.width}" height="${s.height}" alt="${esc(alt)}" class="${cls}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;
}

const sectionHead = (title, lead, id) => `
        <h2 id="${id}-titulo" class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">${esc(title)}</h2>
        ${lead ? `<p class="mt-4 max-w-2xl text-md text-ink-2">${esc(lead)}</p>` : ''}`;

// ----------------------------------------------------------------- paginas
export function renderHome(t, ctx) {
  const { icon } = ctx;
  const id = IDS[t.lang];
  const [h1a, h1b] = t.hero.title.split(' — ');
  const shotLang = (k) => `${k}-${t.lang}`;
  return `${head(t, 'home', ctx)}
  <body class="bg-bg text-ink">${header(t, 'home', ctx)}
    <main id="conteudo">
      <section class="border-b border-border bg-surface">
        <div class="mx-auto grid max-w-content items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:py-20">
          <div class="rv">
            <p class="eyebrow">${esc(t.hero.eyebrow)}</p>
            <h1 class="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">${esc(h1a)} <span class="text-brand">— ${esc(h1b)}</span></h1>
            <p class="mt-5 max-w-xl text-md text-ink-2">${esc(t.hero.lead)}</p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a data-app href="/pedir-conta" class="btn-primary btn-lg">${esc(t.hero.primary)}${icon('arrow-right', 'h-4 w-4')}</a>
              <a ${waAttrs(t, 'contact')} class="btn-secondary btn-lg">${icon('message-circle', 'h-4 w-4')}${esc(t.hero.secondary)}</a>
            </div>
            <p class="mt-4 text-sm text-ink-muted">${esc(fill(t, t.hero.note))}</p>
            <div class="mt-6 grid gap-2 sm:grid-cols-2">
              <a data-app href="/inicio" class="access-card"><span class="text-sm text-ink-muted">${esc(t.hero.already)}</span><span class="flex items-center gap-2 font-semibold">${icon('log-in', 'h-4 w-4 text-accent')}${esc(t.nav.signInLong)}</span></a>
              <a data-app href="/terminal" class="access-card"><span class="text-sm text-ink-muted">${esc(t.hero.counter)}</span><span class="flex items-center gap-2 font-semibold">${icon('monitor', 'h-4 w-4 text-accent')}${esc(t.nav.terminalLong)}</span></a>
            </div>
          </div>
          <div class="rv relative pb-6 sm:pb-10">
            <div class="mx-auto w-[62%] max-w-[300px] sm:hidden"><div class="phone">${shot(ctx, shotLang('telemovel'), t.hero.phoneAlt, { eager: true, cls: 'block w-full' })}</div></div>
            <div class="hidden sm:block">
              <div class="frame">${shot(ctx, shotLang('terminal'), t.hero.shotAlt, { eager: true, cls: 'block w-full' })}</div>
              <div class="phone absolute -bottom-2 right-3 w-[24%]">${shot(ctx, shotLang('telemovel'), t.hero.phoneAlt, { cls: 'block w-full' })}</div>
            </div>
          </div>
        </div>
        <div class="border-t border-border">
          <ul class="mx-auto grid max-w-content grid-cols-2 gap-x-6 gap-y-3 px-4 py-5 text-sm font-medium text-ink-2 sm:px-6 lg:grid-cols-4">
            ${t.hero.trust.map((x) => `<li class="flex items-center gap-2">${icon('circle-check', 'h-4 w-4 shrink-0 text-accent')}<span>${esc(x)}</span></li>`).join('\n            ')}
          </ul>
        </div>
      </section>

      <section class="section" aria-labelledby="dores-titulo">
        <div class="mx-auto max-w-content px-4 sm:px-6">${sectionHead(t.pains.title, t.pains.lead, 'dores')}
          <div class="mt-10 grid gap-4 md:grid-cols-2">
            ${t.pains.items.map((p) => `<article class="card rv solution">
              <div class="flex items-center gap-3"><div class="icon-tile">${icon(p.icon, 'h-5 w-5')}</div><p class="label-muted">${esc(t.pains.problem)}</p></div>
              <h3 class="mt-3 text-lg font-semibold text-ink">${esc(p.q)}</h3>
              <p class="label-accent mt-4">${icon('check', 'h-4 w-4')}${esc(t.pains.solution)}</p>
              <p class="mt-1.5 text-md text-ink-2">${esc(p.a)}</p>
            </article>`).join('\n            ')}
          </div>
        </div>
      </section>

      <section id="${id.features}" class="section border-y border-border bg-surface" aria-labelledby="${id.features}-titulo">
        <div class="mx-auto max-w-content px-4 sm:px-6">${sectionHead(t.features.title, t.features.lead, id.features)}
          <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            ${t.features.items.map((f) => `<article class="card rv flex flex-col">
              <div class="icon-tile">${icon(f.icon, 'h-5 w-5')}</div>
              <h3 class="mt-4 text-md font-semibold text-ink">${esc(f.t)}</h3>
              <p class="mt-1 text-base text-ink-2">${esc(f.d)}</p>
              <details class="more mt-auto pt-3">
                <summary>${esc(t.features.more)}${icon('chevron-down', 'more-chevron h-4 w-4')}</summary>
                <ul>${f.more.map((m) => `<li>${icon('check', 'mt-1 h-4 w-4 shrink-0 text-accent')}<span>${esc(m)}</span></li>`).join('')}</ul>
              </details>
            </article>`).join('\n            ')}
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="relatorios-titulo">
        <div class="mx-auto max-w-content px-4 sm:px-6">${sectionHead(t.reports.title, t.reports.lead, 'relatorios')}
          <div class="mt-10 grid gap-4 lg:grid-cols-3">
            ${t.reports.items.map((r) => `<article class="card rv">
              <div class="flex items-center gap-3"><div class="icon-tile">${icon(r.icon, 'h-5 w-5')}</div><h3 class="text-lg font-semibold text-ink">${esc(r.t)}</h3></div>
              <p class="mt-3 text-md font-medium text-accent-text">«${esc(r.q)}»</p>
              <ul class="mt-3 space-y-2">${r.points.map((x) => `<li class="flex gap-2.5 text-base text-ink-2">${icon('check', 'mt-1 h-4 w-4 shrink-0 text-accent')}<span>${esc(x)}</span></li>`).join('')}</ul>
            </article>`).join('\n            ')}
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="ecras-titulo">
        <div class="mx-auto max-w-content px-4 sm:px-6">${sectionHead(t.screens.title, t.screens.lead, 'ecras')}
          <div class="mt-10 grid gap-8 lg:grid-cols-3">
            ${t.screens.items.map((s) => `<figure class="rv">
              <div class="frame">${shot(ctx, shotLang(s.key), s.cap, { cls: 'block w-full' })}</div>
              <figcaption class="mt-3 text-base text-ink-2">${esc(s.cap)}</figcaption>
            </figure>`).join('\n            ')}
          </div>
        </div>
      </section>

      <section id="${id.who}" class="section border-y border-border bg-surface" aria-labelledby="${id.who}-titulo">
        <div class="mx-auto max-w-content px-4 sm:px-6">${sectionHead(t.who.title, t.who.lead, id.who)}
          <ul class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            ${t.who.items.map((w) => `<li class="card rv flex flex-col items-center gap-3 py-6 text-center"><span class="icon-tile">${icon(w.icon, 'h-5 w-5')}</span><span class="text-md font-medium text-ink">${esc(w.t)}</span></li>`).join('\n            ')}
          </ul>
          <p class="mt-6 text-base text-ink-2"><a ${waAttrs(t, 'contact')} class="text-link">${esc(t.who.other)}</a></p>
        </div>
      </section>

      <section id="${id.how}" class="section" aria-labelledby="${id.how}-titulo">
        <div class="mx-auto max-w-content px-4 sm:px-6">${sectionHead(t.how.title, '', id.how)}
          <ol class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            ${t.how.items.map((s, i) => `<li class="card rv">
              <span class="step">${i + 1}</span>
              <h3 class="mt-4 text-md font-semibold text-ink">${esc(s.t)}</h3>
              <p class="mt-1 text-base text-ink-2">${esc(s.d)}</p>
            </li>`).join('\n            ')}
          </ol>
          <p class="mt-8"><a data-app href="/pedir-conta" class="btn-primary">${esc(t.footer.request)}${icon('arrow-right', 'h-4 w-4')}</a></p>
        </div>
      </section>

      <section class="section bg-brand text-white" aria-labelledby="seguranca-titulo">
        <div class="mx-auto grid max-w-content gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span class="icon-tile-dark">${icon('shield-check', 'h-6 w-6')}</span>
            <h2 id="seguranca-titulo" class="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">${esc(t.security.title)}</h2>
          </div>
          <ul class="space-y-4">
            ${t.security.items.map((s) => `<li class="flex gap-3 text-md text-brand-tint">${icon('check', 'mt-1 h-5 w-5 shrink-0 text-white')}<span>${esc(s)}</span></li>`).join('\n            ')}
          </ul>
        </div>
      </section>

      <section class="section" aria-labelledby="preco-titulo">
        <div class="mx-auto max-w-content px-4 sm:px-6">
          <div class="card rv mx-auto max-w-2xl p-8 text-center sm:p-10">
            <h2 id="preco-titulo" class="text-2xl font-bold tracking-tight text-ink">${esc(t.priceBlock.title)}</h2>
            <p class="mt-3 text-md text-ink-2">${esc(t.priceBlock.lead)}</p>
            <p class="mt-6"><span class="num text-4xl font-bold tracking-tight text-ink">${esc(priceText(t))}</span><span class="text-md text-ink-muted">${esc(t.perMonth)}</span></p>
            <p class="badge mt-4">${esc(t.priceBlock.free)}</p>
            <p class="mt-8"><a href="${t.paths.pricing}" class="btn-primary btn-lg">${esc(t.priceBlock.cta)}${icon('arrow-right', 'h-4 w-4')}</a></p>
          </div>
        </div>
      </section>

      <section id="${id.faq}" class="section border-t border-border bg-surface" aria-labelledby="${id.faq}-titulo">
        <div class="mx-auto max-w-3xl px-4 sm:px-6">${sectionHead(t.faq.title, '', id.faq)}
          ${faqList(t, t.faq.items, icon)}
        </div>
      </section>

      ${finalCta(t, icon)}
    </main>${footer(t, 'home', ctx)}`;
}

function faqList(t, items, icon) {
  return `<div class="mt-8 divide-y divide-border border-y border-border">
            ${items.map((f) => `<details class="faq group">
              <summary>${esc(f.q)}${icon('chevron-down', 'faq-chevron h-5 w-5 shrink-0 text-ink-muted')}</summary>
              <p>${esc(fill(t, f.a))}</p>
            </details>`).join('\n            ')}
          </div>`;
}

function finalCta(t, icon) {
  return `<section class="section border-t border-border bg-surface" aria-labelledby="final-titulo">
        <div class="rv mx-auto max-w-content px-4 text-center sm:px-6">
          <h2 id="final-titulo" class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">${esc(t.final.title)}</h2>
          <p class="mx-auto mt-4 max-w-xl text-md text-ink-2">${esc(t.final.lead)}</p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <a data-app href="/pedir-conta" class="btn-primary btn-lg">${esc(t.hero.primary)}${icon('arrow-right', 'h-4 w-4')}</a>
            <a ${waAttrs(t, 'contact')} class="btn-secondary btn-lg">${icon('message-circle', 'h-4 w-4')}${esc(t.hero.secondary)}</a>
          </div>
        </div>
      </section>`;
}

function paymentMethods(t, icon) {
  const p = t.pricing;
  const row = (label, value) => `<div class="flex justify-between gap-4 py-1.5"><dt class="text-ink-muted">${esc(label)}</dt><dd class="num text-right font-medium text-ink">${esc(value)}</dd></div>`;
  const blocks = [];
  if (PAYMENT.mobile.length) {
    blocks.push(`<div class="card"><h3 class="flex items-center gap-2 text-md font-semibold text-ink">${icon('smartphone', 'h-5 w-5 text-brand')}${esc(p.mobileTitle)}</h3>
              ${PAYMENT.mobile.map((m) => `<dl class="mt-3 border-t border-border pt-2 text-base"><p class="py-1 font-semibold text-ink">${esc(m.name)}</p>${row(p.account, m.number)}${m.holder ? row(p.holder, m.holder) : ''}</dl>`).join('')}</div>`);
  }
  if (PAYMENT.banks.length) {
    blocks.push(`<div class="card"><h3 class="flex items-center gap-2 text-md font-semibold text-ink">${icon('landmark', 'h-5 w-5 text-brand')}${esc(p.bankTitle)}</h3>
              ${PAYMENT.banks.map((b) => `<dl class="mt-3 border-t border-border pt-2 text-base"><p class="py-1 font-semibold text-ink">${esc(b.name)}</p>${row(p.account, b.account)}${b.nib ? row(p.nib, b.nib) : ''}${b.holder ? row(p.holder, b.holder) : ''}</dl>`).join('')}</div>`);
  }
  return blocks.length ? `<div class="mt-8 grid gap-4 md:grid-cols-2">${blocks.join('')}</div>` : '';
}

export function renderPricing(t, ctx) {
  const { icon } = ctx;
  const p = t.pricing;
  const id = IDS[t.lang];
  return `${head(t, 'pricing', ctx)}
  <body class="bg-bg text-ink">${header(t, 'pricing', ctx)}
    <main id="conteudo">
      <section class="border-b border-border bg-surface">
        <div class="mx-auto max-w-content px-4 py-14 sm:px-6 lg:py-16">
          <p class="eyebrow">${esc(p.eyebrow)}</p>
          <h1 class="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">${esc(p.title)}</h1>
          <p class="mt-4 max-w-2xl text-md text-ink-2">${esc(p.lead)}</p>
        </div>
      </section>

      <section class="section">
        <div class="mx-auto grid max-w-content gap-6 px-4 sm:px-6 lg:grid-cols-2">
          <div class="card plan p-8">
            <h2 class="text-xl font-bold text-ink">${esc(p.planName)}</h2>
            <p class="mt-1 text-base text-ink-2">${esc(p.planDesc)}</p>
            <p class="mt-6"><span class="num text-4xl font-bold tracking-tight text-ink">${esc(priceText(t))}</span><span class="text-md text-ink-muted">${esc(t.perMonth)}</span></p>
            <p class="badge mt-4">${esc(p.free)}</p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a ${waAttrs(t, 'join')} class="btn-primary btn-lg justify-center">${icon('message-circle', 'h-4 w-4')}${esc(p.join)}</a>
              <a data-app href="/pedir-conta" class="btn-secondary btn-lg justify-center">${esc(p.start)}</a>
            </div>
          </div>
          <div class="card p-8">
            <h2 class="text-md font-semibold text-ink">${esc(p.included)}</h2>
            <ul class="mt-4 space-y-3">
              ${p.includedItems.map((x) => `<li class="flex gap-3 text-base text-ink-2">${icon('check', 'mt-0.5 h-5 w-5 shrink-0 text-brand')}<span>${esc(x)}</span></li>`).join('\n              ')}
            </ul>
          </div>
        </div>
        <div class="mx-auto mt-6 max-w-content px-4 sm:px-6">
          <div class="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 class="text-md font-semibold text-ink">${esc(p.annualTitle)}</h2><p class="mt-1 text-base text-ink-2">${esc(p.annualText)}</p></div>
            <a ${waAttrs(t, 'annual')} class="btn-secondary shrink-0 justify-center">${icon('message-circle', 'h-4 w-4')}${esc(p.annualCta)}</a>
          </div>
        </div>
      </section>

      <section id="${id.pay}" class="section border-y border-border bg-surface" aria-labelledby="${id.pay}-titulo">
        <div class="mx-auto max-w-content px-4 sm:px-6">${sectionHead(p.payTitle, '', id.pay)}
          <ol class="mt-10 grid gap-6 md:grid-cols-3">
            ${p.paySteps.map((s, i) => `<li class="card"><span class="step">${i + 1}</span><h3 class="mt-4 text-md font-semibold text-ink">${esc(s.t)}</h3><p class="mt-1 text-base text-ink-2">${esc(s.d)}</p></li>`).join('\n            ')}
          </ol>
          ${paymentMethods(t, icon)}
          <p class="mt-8"><a ${waAttrs(t, 'paid')} class="btn-secondary">${icon('receipt', 'h-4 w-4')}${esc(p.paidCta)}</a></p>
        </div>
      </section>

      <section class="section" aria-labelledby="perguntas-plano-titulo">
        <div class="mx-auto max-w-3xl px-4 sm:px-6">${sectionHead(p.faqTitle, '', 'perguntas-plano')}
          ${faqList(t, p.faq, icon)}
        </div>
      </section>

      ${finalCta(t, icon)}
    </main>${footer(t, 'pricing', ctx)}`;
}

// Sitemap das 4 paginas com as alternativas de lingua.
export function renderSitemap() {
  const pairs = [['/', '/en/'], ['/planos', '/en/pricing']];
  const urls = [];
  for (const [pt, en] of pairs) {
    for (const loc of [pt, en]) {
      urls.push(`  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${SITE_UPDATED}</lastmod>
    <xhtml:link rel="alternate" hreflang="pt-MZ" href="${SITE_URL}${pt}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${pt}"/>
  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
