// Fase 8.2: formulario do produto (icone, varias validades, fornecedor, stock
// actual, validade de um lote ali mesmo, botao Stock) e sugestao ao super
// admin de um produto fora do catalogo-mestre.
//   BASE=http://localhost:5181 ADMIN=http://localhost:5185 FIXTURE=fx.json ADMIN_FIXTURE=admin.json SHOTS=pasta node tests/e2e/fase8_2.mjs
// O backend tem de aceitar a origem do admin (ADMIN_ORIGINS=http://localhost:5185).
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5181';
const ADMIN = process.env.ADMIN || 'http://localhost:5185';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const ax = JSON.parse(fs.readFileSync(process.env.ADMIN_FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
const shot = (page, name, fullPage = true) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage });
const watch = (page, label) => {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
};
const day = (n) => { const d = new Date(Date.now() + n * 86400000); return d.toLocaleDateString('sv-SE'); };
const NAME = 'Aqua Plus ' + fx.tenantId.slice(0, 8);
const getJson = (page, url) => page.evaluate(async (u) => (await fetch(u, { credentials: 'include' })).json(), url);

async function login(page) {
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ctx.newPage();
  watch(owner, 'dono');
  await login(owner);
  const sup = await owner.evaluate(async () => (await fetch('/api/inventory/suppliers', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Distribuidora E2E', phone: '841112233', delivery_cost_per_visit: 20000 }) })).json());

  console.log('\n=== Novo produto fora do catálogo: ícone, 2 validades, fornecedor ===');
  await owner.goto(BASE + '/app/produtos');
  await owner.getByRole('button', { name: 'Novo produto' }).click();
  const drawer = owner.getByRole('dialog');
  await drawer.getByLabel('Nome').fill(NAME);
  await drawer.getByLabel('Categoria', { exact: true }).fill('Águas');
  await drawer.getByRole('radio', { name: 'Água / líquidos' }).click();
  ok(await drawer.getByRole('radio', { name: 'Água / líquidos' }).getAttribute('aria-checked') === 'true', 'ícone de líquidos escolhido');
  await drawer.getByLabel('Preço de compra').fill('20');
  await drawer.getByLabel('Preço de venda').fill('35');
  await drawer.getByLabel('Produto com validade').check();
  await drawer.getByLabel('Quantidade 1').fill('50');
  await drawer.getByLabel('Validade 1').fill(day(20));
  await drawer.getByRole('button', { name: 'Outra validade' }).click();
  await drawer.getByLabel('Quantidade 2').fill('50');
  ok(await drawer.getByRole('button', { name: 'Guardar' }).isDisabled(), 'sem a 2.ª validade não deixa guardar');
  await drawer.getByLabel('Validade 2').fill(day(10));
  ok(await drawer.getByText('Total: 100 un.').isVisible(), 'mostra o total (100 un.)');
  await drawer.getByLabel('Fornecedor (opcional)').selectOption({ label: 'Distribuidora E2E' });
  await shot(owner, '91-novo-produto');
  await drawer.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Produto criado.').waitFor({ timeout: T });
  const prods = await getJson(owner, '/api/products');
  const p = prods.find((x) => x.name === NAME);
  ok(p && p.icon === 'droplet' && p.stock_qty === 100 && p.cost_price === 2000 && p.sell_price === 3500 && p.has_expiry, 'gravado: ícone gota, 100 un., 20,00 / 35,00 MT (centavos)', JSON.stringify(p));
  const lots = await getJson(owner, `/api/products/${p.id}/lots`);
  ok(lots.lots.length === 2 && lots.lots[0].expiry_date === day(10) && lots.lots[1].expiry_date === day(20), 'dois lotes com as validades certas', JSON.stringify(lots.lots));
  const row = owner.locator('tbody tr', { hasText: NAME });
  ok(await row.locator('svg.lucide-droplet').count() === 1, 'na lista aparece a gota (e não a caixa)');

  console.log('\n=== Editar: stock actual e validade de parte de um lote ===');
  await row.click();
  await drawer.getByText('Stock actual').waitFor({ timeout: T });
  ok(await drawer.getByText('100 un.', { exact: true }).isVisible(), 'stock actual visível no produto (100 un.)');
  const units = drawer.getByLabel(/^Unidades/);
  ok(await units.count() === 2, 'duas linhas de validade');
  await units.nth(0).fill('20');
  await drawer.getByLabel(/^Validade/).nth(0).fill(day(3));
  await drawer.locator('section', { hasText: 'Stock actual' }).getByRole('button', { name: 'Guardar' }).first().click();
  await owner.getByText('20 un. passam a ter outra validade.').waitFor({ timeout: T });
  await owner.waitForFunction(() => document.querySelectorAll('[role=dialog] input[type=date]').length === 3, null, { timeout: T });
  const after = await getJson(owner, `/api/products/${p.id}/lots`);
  ok(after.lots.length === 3 && after.lots[0].quantity === 20 && after.lots[0].expiry_date === day(3) && after.stock_qty === 100, '20 un. com validade ' + day(3) + '; total continua 100', JSON.stringify(after.lots));
  await shot(owner, '92-validades');
  await drawer.getByRole('radio', { name: 'Energético' }).click();
  await drawer.getByRole('button', { name: 'Guardar', exact: true }).last().click();
  await owner.getByText('Produto actualizado.').waitFor({ timeout: T });
  ok((await getJson(owner, '/api/products')).find((x) => x.id === p.id)?.icon === 'zap', 'ícone trocado para energético');

  console.log('\n=== Botão Stock: guarda e abre o Stock com o produto escolhido ===');
  await owner.locator('tbody tr', { hasText: NAME }).click();
  await drawer.getByText('Stock actual').waitFor({ timeout: T });
  await drawer.getByLabel('Stock mínimo').fill('12');
  await drawer.getByRole('button', { name: 'Stock', exact: true }).click();
  await owner.waitForURL(/tab=stock/, { timeout: T });
  await owner.getByRole('dialog').getByText('Ajuste manual').waitFor({ timeout: T });
  ok(await owner.getByRole('dialog').getByLabel('Produto').inputValue() === p.id, 'Ajuste manual aberto com o produto já escolhido');
  ok((await getJson(owner, '/api/products')).find((x) => x.id === p.id)?.min_stock === 12, 'a edição foi guardada antes de ir ao Stock');
  await shot(owner, '93-stock');

  console.log('\n=== iPhone (390 px): formulário cabe no ecrã ===');
  const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const phone = await phoneCtx.newPage();
  watch(phone, 'iphone');
  await login(phone);
  await phone.goto(BASE + '/app/produtos');
  await phone.getByRole('button', { name: 'Novo produto' }).click();
  await phone.getByRole('dialog').getByLabel('Produto com validade').check();
  const w = await phone.evaluate(() => [document.documentElement.scrollWidth, window.visualViewport.width]);
  ok(w[0] <= w[1], 'novo produto cabe nos 390 px', w.join(' > '));
  await shot(phone, '94-iphone-novo-produto', false);
  await phoneCtx.close();

  console.log('\n=== Super admin: notificação e acrescentar ao catálogo-mestre ===');
  const actx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const admin = await actx.newPage();
  watch(admin, 'admin');
  await admin.goto(ADMIN + '/entrar');
  await admin.getByLabel('Email').fill(ax.admin.email);
  await admin.getByLabel('Senha').fill(ax.admin.password);
  await admin.getByRole('button', { name: 'Entrar' }).click();
  await admin.getByText('Receita mensal recorrente').waitFor({ timeout: T });
  ok(await admin.getByText(/produto\(s\) novo\(s\) nas lojas/).isVisible({ timeout: T }), 'visão geral avisa os produtos novos');
  await admin.getByRole('link', { name: 'Ver sugestões' }).click();
  const srow = admin.locator('tbody tr', { hasText: NAME });
  await srow.waitFor({ timeout: T });
  const st = await srow.textContent();
  ok(/Bottle store/.test(st) && /20,00 MT/.test(st) && /35,00 MT/.test(st) && !st.includes('Bottle Store Central'), 'linha: tipo, compra 20, venda 35, sem nome da loja', st);
  ok(await srow.locator('svg.lucide-zap').count() === 1, 'mostra o ícone escolhido pela loja');
  await shot(admin, '95-admin-sugestoes');
  await srow.click();
  const ad = admin.getByRole('dialog');
  await ad.getByLabel('Preço de venda sugerido').fill('40');
  await ad.getByRole('button', { name: 'Acrescentar' }).click();
  await admin.getByText(/Acrescentado ao catálogo-mestre/).waitFor({ timeout: T });
  ok(await admin.locator('tbody tr', { hasText: NAME }).waitFor({ state: 'detached', timeout: 30000 }).then(() => true).catch(() => false), 'sai da lista de sugestões');
  const cat = await owner.evaluate(async () => (await fetch('/api/catalogs/bottle_store')).json());
  const m = cat.template.sampleProducts.find((x) => x.name === NAME);
  ok(m && m.price_mzn === 40 && m.cost_mzn === 20 && m.icon === 'zap' && m.category === 'Águas', 'catálogo-mestre: lojas novas recebem o produto (40 MT, ícone)', JSON.stringify(m));
} finally {
  await browser.close();
}

if (errors.length) { console.log('\nErros de JS:'); for (const e of errors) console.log('  ' + e); }
console.log(`\n${failures === 0 && errors.length === 0 ? 'TODOS OS PASSOS PASSARAM' : `FALHAS: ${failures}, erros JS: ${errors.length}`}`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
