// Fase 11: site publico (landing). Corre contra o Vite, o preview ou o site:
//   BASE=http://localhost:5180 SHOTS=pasta node tests/e2e/site.mjs
// As sessoes sao simuladas (pedidos interceptados): nada e gravado.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const SHOTS = path.resolve(process.env.SHOTS || 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const watch = (page) => {
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push('console: ' + m.text()); });
};

const browser = await chromium.launch();
try {
  // 1) Sem sessao: fica no site.
  const ctx = await browser.newContext({ locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  ok(new URL(page.url()).pathname === '/', 'sem sessão: fica na landing', page.url());
  ok(/Genesis MZ/.test(await page.title()), 'título com «Genesis MZ»', await page.title());
  ok(await page.locator('h1').count() === 1, 'um único h1');
  await page.getByRole('link', { name: 'Pedir conta' }).first().click();
  await page.getByRole('heading', { name: 'Pedir uma conta' }).waitFor({ timeout: 10000 }).catch(() => {});
  ok(await page.getByRole('heading', { name: 'Pedir uma conta' }).isVisible(), '«Pedir conta» abre o formulário da app');
  await ctx.close();

  // 2) Com sessao (simulada): segue para o sitio certo; "?site" mostra o site.
  const cases = [
    { name: 'dono com sessão → /app', me: { user: { role: 'owner' } }, term: null, want: '/app' },
    { name: 'caixista com sessão → /terminal', me: { user: { role: 'cashier' } }, term: null, want: '/terminal' },
    { name: 'browser emparelhado como terminal → /terminal', me: null, term: { terminal: { id: 't' } }, want: '/terminal' },
  ];
  for (const c of cases) {
    const cx = await browser.newContext({ locale: 'pt-PT' });
    const p = await cx.newPage();
    await p.route('**/api/auth/me', (r) => (c.me ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(c.me) }) : r.fulfill({ status: 401, contentType: 'application/json', body: '{}' })));
    await p.route('**/api/pos/terminal', (r) => (c.term ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(c.term) }) : r.fulfill({ status: 401, contentType: 'application/json', body: '{}' })));
    // A app que abre a seguir faz os seus pedidos; so interessa o destino.
    await p.goto(BASE + '/');
    await p.waitForURL((u) => u.pathname.startsWith(c.want), { timeout: 10000 }).catch(() => {});
    ok(new URL(p.url()).pathname.startsWith(c.want), c.name, p.url());
    if (c.me?.user?.role === 'owner') {
      await p.goto(BASE + '/?site');
      await p.waitForLoadState('networkidle');
      ok(new URL(p.url()).pathname === '/', 'dono com sessão em «/?site» vê o site', p.url());
    }
    await cx.close();
  }

  // 3) Fase 11.3: as 4 paginas. Sem JS (o que o Google le) e com JS.
  const PAGES = [
    { url: '/', lang: 'pt-MZ', h1: 'Vendas, stock e caixa' },
    { url: '/planos', lang: 'pt-MZ', h1: 'Um preço simples' },
    { url: '/en/', lang: 'en', h1: 'Sales, stock and cash' },
    { url: '/en/pricing', lang: 'en', h1: 'Simple pricing' },
  ];
  const raw = await browser.newContext({ javaScriptEnabled: false });
  for (const pg of PAGES) {
    const res = await raw.request.get(BASE + pg.url);
    const html = await res.text();
    ok(res.status() === 200 && html.includes(`lang="${pg.lang}"`) && html.includes(pg.h1), `${pg.url}: sem JS já tem a língua e o h1`);
    let ld = null;
    try { ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]); } catch { /* falha abaixo */ }
    ok(ld?.['@graph']?.some((g) => g['@type'] === 'SoftwareApplication' && g.offers?.priceCurrency === 'MZN'), `${pg.url}: JSON-LD válido com o preço em MZN`);
  }
  await raw.close();

  for (const [vp, name] of [[{ width: 1440, height: 900 }, 'computador'], [{ width: 390, height: 844 }, 'telemóvel']]) {
    const cx = await browser.newContext({ viewport: vp, locale: 'pt-PT' });
    const p = await cx.newPage();
    watch(p);
    for (const pg of PAGES) {
      await p.goto(BASE + pg.url + (pg.url.endsWith('/') ? '?site' : ''));
      await p.waitForLoadState('networkidle');
      const look = await p.evaluate(() => ({
        sw: document.documentElement.scrollWidth, w: window.innerWidth,
        font: getComputedStyle(document.body).fontFamily,
        btn: getComputedStyle(document.querySelector('.btn-primary')).backgroundColor,
      }));
      ok(look.sw <= look.w, `${pg.url} (${name}): sem deslocamento horizontal`, look);
      ok(/Inter/.test(look.font) && look.btn === 'rgb(11, 77, 59)', `${pg.url} (${name}): letra Inter e verde do logótipo carregados`, look);
      const imgs = await p.evaluate(() => [...document.images].filter((i) => i.getBoundingClientRect().width > 0).length);
      if (pg.url.endsWith('/')) ok(imgs >= 1, `${pg.url} (${name}): imagem da app visível`);
    }
    if (name === 'telemóvel') {
      await p.goto(BASE + '/?site');
      await p.locator('[data-menu-toggle]').click();
      ok(await p.locator('[data-menu]').isVisible() && await p.locator('[data-menu]').getByRole('link', { name: 'Planos' }).isVisible(), 'telemóvel: o menu abre com os links');
    }
    await cx.close();
  }

  // 3b) Fase 14: acessos claros no topo, «Ver mais detalhes», relatorios explicados,
  //     blocos que aparecem ao descer (e tudo visivel sem JS / com menos movimento).
  {
    const cx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-PT' });
    const p = await cx.newPage();
    watch(p);
    await p.goto(BASE + '/?site');
    await p.waitForLoadState('networkidle');
    ok(await p.locator('header').getByRole('link', { name: 'Entrar', exact: true }).isVisible(), 'telemóvel: «Entrar» visível no topo sem abrir o menu');
    // 27/10 (fundador): o branco e o destaque; o verde so acompanha.
    const heroBg = await p.locator('main > section').first().evaluate((s) => getComputedStyle(s).backgroundColor);
    ok(heroBg === 'rgb(255, 255, 255)', 'herói com fundo branco (verde só nos botões e destaques)', heroBg);
    ok(await p.getByRole('link', { name: /Entrar no painel/ }).isVisible() && await p.getByRole('link', { name: /Abrir o terminal/ }).isVisible(), 'herói: «Entrar no painel» e «Abrir o terminal» à vista');
    ok(await p.getByText('O Genesis avisa antes de o produto vencer').isVisible().catch(() => false) || (await p.content()).includes('O Genesis avisa antes de o produto vencer'), 'validades escritas como solução («O Genesis avisa antes de o produto vencer»)');
    const first = p.locator('details.more').first();
    await first.scrollIntoViewIfNeeded();
    await first.locator('summary').click();
    ok(await first.evaluate((d) => d.open) && await first.locator('li').first().isVisible(), '«Ver mais detalhes» abre a lista da funcionalidade');
    ok(await p.locator('#relatorios-titulo').count() === 1 && (await p.content()).includes('Quanto lucrei de verdade?'), 'relatórios explicados: diário, semanal e mensal');
    const lastCard = p.locator('.rv').last();
    await lastCard.scrollIntoViewIfNeeded();
    await p.waitForTimeout(900);
    ok(await lastCard.evaluate((el) => el.classList.contains('is-in') && getComputedStyle(el).opacity === '1'), 'ao descer, os blocos aparecem (opacidade 1)');
    await cx.close();
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const np = await nojs.newPage();
    await np.goto(BASE + '/');
    const hidden = await np.locator('.rv').evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
    ok(hidden === 0, 'sem JavaScript: nada fica escondido', hidden);
    await nojs.close();
    const rm = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const rp = await rm.newPage();
    await rp.goto(BASE + '/?site');
    await rp.waitForLoadState('networkidle');
    const moving = await rp.locator('.rv').evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
    ok(moving === 0, 'menos movimento: tudo visível sem animação', moving);
    await rm.close();
  }

  // 4) WhatsApp: mensagem escrita com a saudacao da hora de quem visita.
  for (const [hour, want, url] of [[9, 'Bom dia!', '/?site'], [15, 'Boa tarde!', '/?site'], [21, 'Boa noite!', '/planos'], [9, 'Good morning!', '/en/?site']]) {
    const cx = await browser.newContext();
    const p = await cx.newPage();
    await p.clock.setFixedTime(new Date(2026, 9, 25, hour, 0));
    await p.goto(BASE + url);
    await p.waitForLoadState('networkidle');
    const href = await p.locator('a[data-wa]').first().getAttribute('href');
    const text = decodeURIComponent(href.split('?text=')[1] || '');
    ok(href.startsWith('https://wa.me/258870150055?text=') && text.startsWith(want), `WhatsApp às ${hour}h em ${url}: «${want}»`, text);
    await cx.close();
  }
  {
    const cx = await browser.newContext();
    const p = await cx.newPage();
    await p.goto(BASE + '/planos');
    await p.waitForLoadState('networkidle');
    const join = decodeURIComponent((await p.getByRole('link', { name: 'Aderir ao plano' }).getAttribute('href')).split('?text=')[1]);
    ok(/Quero aderir ao plano Genesis MZ de 3\s000\sMT\/mês\./.test(join), '«Aderir ao plano» leva o plano e o preço na mensagem', join);
    const paid = decodeURIComponent((await p.getByRole('link', { name: /Já paguei/ }).getAttribute('href')).split('?text=')[1]);
    ok(/Já paguei a subscrição/.test(paid), '«Já paguei» pede o comprovativo', paid);
    await p.getByRole('link', { name: 'EN', exact: true }).first().click();
    await p.waitForURL('**/en/pricing');
    ok(new URL(p.url()).pathname === '/en/pricing', 'PT → EN na página de planos abre /en/pricing', p.url());
    await p.getByRole('link', { name: 'PT', exact: true }).first().click();
    await p.waitForURL((u) => u.pathname === '/planos');
    ok(new URL(p.url()).pathname === '/planos', 'EN → PT volta a /planos', p.url());
    await cx.close();
  }
} finally {
  await browser.close();
}
ok(errors.length === 0, '0 erros de JS', errors);
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os passos passaram.');
process.exit(failures ? 1 : 0);
