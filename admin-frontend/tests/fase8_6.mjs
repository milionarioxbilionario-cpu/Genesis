// Fase 8.6 (pedido do fundador 10/10/2026): o super admin edita o
// catalogo-mestre (nome, precos, icone) e as lojas novas recebem a alteracao.
//   ADMIN=http://localhost:5185 APP=http://localhost:5180 FIXTURE=admin.json SHOTS=pasta node tests/fase8_6.mjs
// O produto de teste leva a etiqueta do admin de teste; e2e_admin_fixture.js delete apaga-o.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('../../frontend/node_modules/@playwright/test');

const ADMIN = process.env.ADMIN || 'http://localhost:5185';
const APP = process.env.APP || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
const TAG = fx.admin.email.split('@')[0];
const NAME = 'Sumo ' + TAG;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, n + '.png') });
const watch = (page) => {
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
};
const onboarding = async () => (await (await fetch(APP + '/api/catalogs/bottle_store')).json()).template.sampleProducts.find((p) => p.name.startsWith(NAME));

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(ADMIN + '/entrar');
  await page.getByLabel('Email').fill(fx.admin.email);
  await page.getByLabel('Senha').fill(fx.admin.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Receita mensal recorrente').waitFor({ timeout: T });

  console.log('\n=== Catálogo-mestre: novo produto ===');
  await page.getByRole('link', { name: 'Catálogos-mestre' }).click();
  await page.locator('tbody tr', { hasText: 'MT' }).first().waitFor({ timeout: T });
  const before = await page.locator('tbody tr').count();
  ok(before > 10 && /\(\d+\)/.test(await page.getByLabel('Tipo de negócio').textContent()), 'lista do bottle store carregada (' + before + ' produtos) e contagem por tipo');
  await page.getByRole('button', { name: 'Novo produto' }).click();
  const dr = page.getByRole('dialog');
  await dr.getByLabel('Nome', { exact: true }).fill(NAME);
  await dr.getByLabel('Categoria').fill('Sumos');
  await dr.getByLabel('Preço de compra sugerido').fill('30');
  await dr.getByLabel('Preço de venda sugerido').fill('45');
  await dr.getByLabel('Ícone').selectOption('droplet');
  await dr.getByRole('button', { name: 'Guardar' }).click();
  await page.getByText('Produto acrescentado ao catálogo-mestre.').waitFor({ timeout: T });
  let o = await onboarding();
  ok(o && o.price_mzn === 45 && o.cost_mzn === 30 && o.icon === 'droplet', 'onboarding recebe o novo (30 / 45 MT, gota)', JSON.stringify(o));

  console.log('\n=== Editar nome e preço ===');
  await page.getByLabel('Procurar no catálogo').fill(TAG);
  const row = page.locator('tbody tr', { hasText: NAME });
  await row.waitFor({ timeout: T });
  ok(await page.locator('tbody tr').count() === 1, 'procurar encontra só o produto');
  await row.click();
  await dr.getByRole('heading', { name: 'Editar produto' }).waitFor({ timeout: T });
  ok(await dr.getByLabel('Preço de venda sugerido').inputValue() === '45', 'a gaveta abre com os valores actuais (45 MT)');
  await dr.getByLabel('Nome', { exact: true }).fill(NAME + ' 1L');
  await dr.getByLabel('Preço de venda sugerido').fill('52,50');
  await shot(page, 'm1-editar-catalogo');
  await dr.getByRole('button', { name: 'Guardar' }).click();
  await page.getByText('Produto actualizado. Os estabelecimentos novos já o recebem assim.').waitFor({ timeout: T });
  await page.locator('tbody tr', { hasText: NAME + ' 1L' }).waitFor({ timeout: T });
  ok(/52,50 MT/.test(await page.locator('tbody tr', { hasText: NAME + ' 1L' }).textContent()), 'tabela mostra 52,50 MT');
  o = await onboarding();
  ok(o && o.name === NAME + ' 1L' && o.price_mzn === 52.5, 'onboarding das lojas novas já usa o nome e o preço novos (52,50 MT)', JSON.stringify(o));

  await page.locator('tbody tr', { hasText: NAME + ' 1L' }).click();
  await dr.getByLabel('Preço de venda sugerido').fill('0');
  ok(await dr.getByRole('button', { name: 'Guardar' }).isDisabled(), 'venda a 0: não deixa guardar');
  await dr.getByRole('button', { name: 'Cancelar' }).click();

  console.log('\n=== Telemóvel (390 px) ===');
  const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const ph = await phoneCtx.newPage();
  watch(ph);
  await ph.goto(ADMIN + '/entrar');
  await ph.getByLabel('Email').fill(fx.admin.email);
  await ph.getByLabel('Senha').fill(fx.admin.password);
  await ph.getByRole('button', { name: 'Entrar' }).click();
  await ph.getByText('Receita mensal recorrente').waitFor({ timeout: T });
  await ph.goto(ADMIN + '/catalogos');
  await ph.locator('tbody tr').first().waitFor({ timeout: T });
  await ph.getByRole('button', { name: 'Novo produto' }).click();
  const w = await ph.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(w[0] <= w[1], 'gaveta cabe nos 390 px', w.join(' > '));
  await shot(ph, 'm2-iphone-catalogo');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: catalogo-mestre passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
