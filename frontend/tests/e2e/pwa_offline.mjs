// Fase 11.1: com o site publico na raiz, a app (terminal incluido) tem de
// continuar a abrir SEM rede pelo service worker. So com o build real:
//   npm run build && GENESIS_API_URL=http://127.0.0.1:4100 npx vite preview --port 5190 --strictPort
//   BASE=http://localhost:5190 node tests/e2e/pwa_offline.mjs
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5190';
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const LANDING = /Genesis MZ/;

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ locale: 'pt-PT' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  // 1) Visita a app com rede: o service worker instala-se e passa a controlar.
  await page.goto(BASE + '/entrar');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  ok(controlled, 'service worker activo e a controlar a página');

  // 2) Sem rede.
  await ctx.setOffline(true);
  for (const p of ['/terminal', '/app/produtos', '/entrar', '/inicio']) {
    const r = await page.goto(BASE + p).catch((e) => e);
    const title = await page.title().catch(() => '');
    const rendered = await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, null, { timeout: 8000 }).then(() => true, () => false);
    ok(!(r instanceof Error) && title === 'Genesis' && rendered, `offline: ${p} abre a app (não a landing nem o erro do browser)`, { title, err: r instanceof Error ? r.message : null });
  }
  const r = await page.goto(BASE + '/').catch((e) => e);
  ok(!(r instanceof Error) && LANDING.test(await page.title()), 'offline: / abre a landing guardada');
  await ctx.setOffline(false);

  // 3) App instalada (ecrã principal) que ainda abre em "/": vai logo para a app.
  const pwa = await browser.newContext({ locale: 'pt-PT' });
  await pwa.addInitScript(() => {
    const mm = window.matchMedia.bind(window);
    window.matchMedia = (q) => (q.includes('display-mode: standalone') ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : mm(q));
  });
  const pp = await pwa.newPage();
  await pp.goto(BASE + '/');
  await pp.waitForURL((u) => u.pathname === '/entrar', { timeout: 10000 }).catch(() => {});
  ok(new URL(pp.url()).pathname === '/entrar', 'app instalada em "/" → /inicio → /entrar (sem sessão)', pp.url());
  await pwa.close();
} finally {
  await browser.close();
}
ok(errors.length === 0, '0 erros de JS', errors);
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os passos passaram.');
process.exit(failures ? 1 : 0);
