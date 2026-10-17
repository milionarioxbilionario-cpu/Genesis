// Fase 9.7: painel super admin em PT/EN (a escolha fica na conta do super
// admin) e «Nome em inglês» no catalogo-mestre, que a loja recebe como name_en.
//   ADMIN=http://localhost:5175 APP=http://localhost:5180 FIXTURE=admin.json SHOTS=pasta node tests/idioma_admin.mjs
// O produto de teste leva a etiqueta do admin de teste; e2e_admin_fixture.js delete apaga-o.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('../../frontend/node_modules/@playwright/test');

const ADMIN = process.env.ADMIN || 'http://localhost:5175';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
const TAG = fx.admin.email.split('@')[0];
const NAME = 'Água ' + TAG;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true });
const watch = (page) => {
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
};
const api = (page, method, url, body) => page.evaluate(async ([m, u, b]) => { const r = await fetch(u, { method: m, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => null) }; }, [method, url, body]);
const PT_WORDS = ['Visão geral', 'Pedidos', 'Lojas', 'Catálogo', 'Sugestões', 'Auditoria', 'Sair', 'Receita', 'Pendente', 'Activa', 'Em teste', 'Negócio', 'Dono', 'Pesquisar', 'Procurar', 'Novo produto', 'Compra sugerida', 'Venda sugerida', 'Quando', 'Acção', 'Último', 'Nenhum', 'Sem ', 'Tipo de negócio', 'dias', 'Unidades'];
const ptLeft = async (page) => {
  const text = await page.evaluate(() => document.body.innerText);
  return PT_WORDS.filter((w) => text.includes(w)).map((w) => { const i = text.indexOf(w); return w + ' «' + text.slice(Math.max(0, i - 20), i + 30).replace(/\s+/g, ' ') + '»'; });
};

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(ADMIN + '/entrar');
  await page.getByRole('heading', { name: 'Acesso restrito' }).waitFor({ timeout: T });
  await page.getByRole('radio', { name: 'EN' }).click();
  await page.getByRole('heading', { name: 'Restricted access' }).waitFor();
  ok(await page.getByLabel('Password').isVisible() && await page.getByRole('button', { name: 'Sign in' }).isVisible(), 'entrada em inglês (escolhida no aparelho)');
  await page.getByLabel('Email').fill(fx.admin.email);
  await page.getByLabel('Password').fill('errada-' + Date.now());
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByText('Invalid credentials', { exact: false }).first().waitFor({ timeout: T });
  ok(true, 'erro do servidor em inglês («Invalid credentials»)');
  await page.getByLabel('Password').fill(fx.admin.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Conta nova em PT: depois de entrar manda a lingua da conta.
  await page.getByText('Receita mensal recorrente').waitFor({ timeout: T });
  ok(true, 'conta do super admin em PT: o painel abre em português');
  const put = page.waitForResponse((r) => r.url().includes('/api/auth/language') && r.request().method() === 'PUT', { timeout: T });
  await page.getByRole('radio', { name: 'EN' }).click();
  ok((await put).status() === 200, 'menu: EN grava na conta do super admin');
  await page.getByText('Monthly recurring revenue').waitFor({ timeout: T });

  for (const [link, marker, name] of [
    ['Overview', 'Monthly recurring revenue', 'a1-overview'],
    ['Account requests', 'Approving creates the owner account', 'a2-requests'],
    ['Stores', 'Active and on trial', 'a3-stores'],
    ['Master catalogues', 'Suggested purchase', 'a4-catalogues'],
    ['Suggestions', 'Catalogue suggestions', 'a5-suggestions'],
    ['Customer requests', 'Product requested', 'a6-customer-requests'],
    ['Audit log', 'Last 200 actions', 'a7-audit'],
  ]) {
    await page.getByRole('link', { name: link }).first().click();
    await page.getByText(marker).first().waitFor({ timeout: T });
    await page.waitForLoadState('networkidle', { timeout: T }).catch(() => {});
    // Tabelas: esperar que o esqueleto de carregamento saia (as linhas reais entram na verificacao).
    await page.waitForFunction(() => document.querySelectorAll('tbody .animate-pulse').length === 0, null, { timeout: T });
    const left = (await ptLeft(page)).filter((w) => !w.startsWith(NAME));
    ok(left.length === 0, `«${link}» em inglês`, left);
    await shot(page, name);
  }

  console.log('\n=== Catálogo-mestre: nome em inglês ===');
  await page.getByRole('link', { name: 'Master catalogues' }).first().click();
  await page.locator('tbody tr', { hasText: 'MT' }).first().waitFor({ timeout: T });
  await page.getByRole('button', { name: 'New product' }).click();
  const dr = page.getByRole('dialog');
  await dr.getByLabel('Name', { exact: true }).fill(NAME);
  await dr.getByLabel('Name in English').fill('Water ' + TAG);
  await dr.getByLabel('Category').fill('Águas');
  await dr.getByLabel('Suggested purchase price').fill('10');
  await dr.getByLabel('Suggested selling price').fill('20');
  ok((await ptLeft(page)).filter((w) => !w.startsWith(NAME)).length === 0, 'gaveta do produto em inglês', await ptLeft(page));
  await shot(page, 'a8-new-product');
  await dr.getByRole('button', { name: 'Save' }).click();
  await page.getByText('Product added to the master catalogue.').waitFor({ timeout: T });
  await page.getByLabel('Search the catalogue').fill('water ' + TAG);
  await page.locator('tbody tr', { hasText: NAME }).waitFor({ timeout: T });
  ok(await page.locator('tbody tr', { hasText: 'Water ' + TAG }).count() === 1, 'a lista mostra o nome em inglês e procura por ele');
  const list = await api(page, 'GET', '/api/admin/master-catalog?type=bottle_store');
  ok(list.data.products.find((p) => p.product_name === NAME)?.product_name_en === 'Water ' + TAG, 'gravado: product_name_en');

  const me = await api(page, 'GET', '/api/auth/me');
  ok(me.data.user.language === 'en', 'a língua ficou na conta (/me: en)');
  // Outro aparelho (telemovel em PT): o painel abre em EN — a lingua e da pessoa.
  const phone = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const m = await phone.newPage();
  watch(m);
  await m.goto(ADMIN + '/entrar');
  await m.getByLabel('Email').fill(fx.admin.email);
  await m.getByLabel('Senha').fill(fx.admin.password);
  await m.getByRole('button', { name: 'Entrar' }).click();
  await m.getByText('Monthly recurring revenue').waitFor({ timeout: T });
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'iPhone: painel em inglês sem deslocamento lateral');
  await shot(m, 'a9-iphone');
  await phone.close();
  ok((await api(page, 'PUT', '/api/auth/language', { language: 'pt' })).status === 200, 'super admin de volta a PT');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: admin em inglês passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
