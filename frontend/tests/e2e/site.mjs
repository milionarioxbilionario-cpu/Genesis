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
} finally {
  await browser.close();
}
ok(errors.length === 0, '0 erros de JS', errors);
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os passos passaram.');
process.exit(failures ? 1 : 0);
