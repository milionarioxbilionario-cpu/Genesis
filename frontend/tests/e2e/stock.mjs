// Teste de browser real do separador Stock (Fase 3 + Fase 8.3):
//  - "Ajuste manual" > Adicionar: compra de um produto que ja existe com duas
//    validades, custo e fornecedor; quantidade sempre positiva;
//  - "Ajuste manual" > Retirar: quantidade positiva + motivo, sai por FEFO;
//  - "Entrada de stock": abre o formulario de produto NOVO;
//  - "Validades", aviso no Inicio e dias de aviso nas Definicoes.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/stock.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const AGUA = 'Água Namaacha 1,5L';
const NOVO = 'Iogurte Novo E2E ' + Date.now().toString().slice(-5);
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}
async function login(page) {
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });
}
const getJson = (page, url) => page.evaluate(async (u) => (await fetch(u, { credentials: 'include' })).json(), url);

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page, 'dono');
  await login(page);
  const sup = await page.evaluate(async () => (await fetch('/api/inventory/suppliers', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Distribuidora Stock E2E', phone: '841112244', delivery_cost_per_visit: 10000 }) })).json());
  const agua = (await getJson(page, '/api/products')).find((p) => p.name === AGUA);
  const drawer = page.getByRole('dialog');

  console.log('\n=== Ajuste manual > Adicionar: duas validades, custo e fornecedor ===');
  await page.goto(BASE + '/app/produtos?tab=stock');
  await page.getByRole('button', { name: 'Ajuste manual' }).click({ timeout: T });
  await drawer.getByLabel('Produto').selectOption(agua.id);
  ok(await drawer.getByText(`Stock actual: ${agua.stock_qty} un.`).isVisible(), `mostra o stock actual (${agua.stock_qty} un.)`);
  ok(await drawer.getByRole('radio', { name: 'Adicionar' }).getAttribute('aria-checked') === 'true', 'Adicionar escolhido por defeito');
  await drawer.getByLabel('Quantidade 1').fill('12');
  await drawer.getByLabel('Validade 1').fill(day(3));
  await drawer.getByRole('button', { name: 'Outra validade' }).click();
  await drawer.getByLabel('Quantidade 2').fill('8');
  await drawer.getByLabel('Validade 2').fill(day(20));
  await drawer.getByLabel('Custo unitário').fill('19');
  await drawer.getByLabel('Fornecedor (opcional)').selectOption(sup.id);
  ok(await drawer.getByText(`Fica com ${agua.stock_qty + 20} un.`).isVisible(), `diz com quanto fica (${agua.stock_qty + 20} un.)`);
  await page.screenshot({ path: path.join(SHOTS, 's1-ajuste-adicionar.png') });
  await drawer.getByRole('button', { name: 'Adicionar 20 un.' }).click();
  await page.getByText(`20 un. de ${AGUA} adicionadas.`).waitFor({ timeout: T });
  let lots = await getJson(page, `/api/products/${agua.id}/lots`);
  const dated = lots.lots.filter((l) => l.expiry_date);
  ok(lots.stock_qty === agua.stock_qty + 20 && dated.length === 2 && dated[0].quantity === 12 && dated[0].expiry_date === day(3) && dated[1].quantity === 8 && dated[1].expiry_date === day(20), 'gravado: +20 em dois lotes (12 a 3 dias, 8 a 20 dias)', JSON.stringify(lots));
  ok((await getJson(page, '/api/products')).find((p) => p.id === agua.id)?.cost_price === 1900, 'custo do produto actualizado para 19,00 MT (centavos)');
  const moves = await getJson(page, '/api/inventory/stock');
  ok(moves.filter((m) => m.product_id === agua.id && m.supplier_id === sup.id).length === 2, 'duas entradas com o fornecedor (uma por validade)');
  await page.getByRole('heading', { name: 'Validades' }).waitFor({ timeout: T });
  const row = page.locator('tr', { hasText: AGUA }).first();
  ok(/12 de \d+ un\./.test((await row.textContent()) || ''), 'Validades: o lote de 12 aparece', await row.textContent());

  console.log('\n=== Ajuste manual > Retirar: quantidade positiva + motivo ===');
  await page.getByRole('button', { name: 'Ajuste manual' }).click();
  await drawer.getByLabel('Produto').selectOption(agua.id);
  await drawer.getByRole('radio', { name: 'Retirar' }).click();
  const stockNow = lots.stock_qty;
  await drawer.getByLabel('Quantidade a retirar').fill(String(stockNow + 1));
  ok(await drawer.getByText(`Só há ${stockNow} un. em stock.`).isVisible(), 'mais do que há: aviso');
  ok(await drawer.getByRole('button', { name: `Retirar ${stockNow + 1} un.` }).isDisabled(), 'mais do que há: botão desactivado');
  await drawer.getByLabel('Quantidade a retirar').fill('5');
  ok(await drawer.getByRole('button', { name: 'Retirar 5 un.' }).isDisabled(), 'sem motivo: botão desactivado');
  await drawer.getByLabel('Motivo').fill('contagem física');
  await page.screenshot({ path: path.join(SHOTS, 's2-ajuste-retirar.png') });
  await drawer.getByRole('button', { name: 'Retirar 5 un.' }).click();
  await page.getByText(`5 un. de ${AGUA} retiradas. Fica na auditoria com o motivo.`).waitFor({ timeout: T });
  lots = await getJson(page, `/api/products/${agua.id}/lots`);
  ok(lots.stock_qty === stockNow - 5 && lots.lots.find((l) => l.expiry_date === day(3))?.quantity === 7, `stock ${stockNow - 5}; saíram do lote que expira primeiro (12 -> 7)`, JSON.stringify(lots));

  console.log('\n=== Entrada de stock = produto novo ===');
  await page.getByRole('button', { name: 'Entrada de stock' }).click();
  await drawer.getByRole('heading', { name: 'Entrada de stock' }).waitFor({ timeout: T });
  ok(await drawer.getByLabel('Nome').isVisible() && await drawer.getByText('Unidades que entram').isVisible(), 'abre o formulário de produto novo (nome, unidades que entram)');
  await drawer.getByLabel('Nome').fill(NOVO);
  await drawer.getByLabel('Categoria', { exact: true }).fill('Frescos');
  await drawer.getByLabel('Preço de compra').fill('30');
  await drawer.getByLabel('Preço de venda').fill('50');
  await drawer.getByLabel('Produto com validade').check();
  await drawer.getByLabel('Quantidade 1').fill('10');
  await drawer.getByLabel('Validade 1').fill(day(2));
  await page.screenshot({ path: path.join(SHOTS, 's3-entrada-produto-novo.png') });
  await drawer.getByRole('button', { name: 'Guardar' }).click();
  await page.getByText(`Entrada registada: ${NOVO} (10 un.).`).waitFor({ timeout: T });
  const novo = (await getJson(page, '/api/products')).find((p) => p.name === NOVO);
  ok(novo && novo.stock_qty === 10 && novo.cost_price === 3000 && novo.sell_price === 5000 && novo.has_expiry, 'produto novo gravado: 10 un., 30,00 / 50,00 MT', JSON.stringify(novo));
  await page.locator('tr', { hasText: NOVO }).first().waitFor({ timeout: T });
  ok(/10 de 10 un\./.test((await page.locator('tr', { hasText: NOVO }).first().textContent()) || ''), 'Validades: produto novo aparece (10 de 10 un.)');
  await page.screenshot({ path: path.join(SHOTS, 's4-validades.png'), fullPage: true });

  // Desde a Fase 13 os avisos estao no sino (o Inicio nao repete alertas).
  await page.goto(BASE + '/app');
  await page.getByRole('button', { name: /^Notificações/ }).click();
  const bellDlg = page.getByRole('dialog', { name: 'Notificações' });
  await bellDlg.getByText(/validade/i).first().waitFor({ timeout: T });
  ok(true, 'o sino avisa os lotes perto da validade');
  await page.keyboard.press('Escape');

  await page.goto(BASE + '/app/definicoes?tab=store');
  await page.getByLabel('Avisar com').fill('2');
  await page.locator('div', { hasText: /^Avisar com/ }).getByRole('button', { name: 'Guardar' }).last().click().catch(async () => {
    await page.getByRole('button', { name: 'Guardar' }).last().click();
  });
  await page.getByText('Alterações guardadas.').waitFor({ timeout: T });
  const al = await getJson(page, '/api/owner/alerts');
  ok(al.alertDays === 2 && !al.expiringLots.some((l) => l.days_left > 2), 'Definições: aviso a 2 dias aplicado aos alertas', JSON.stringify({ d: al.alertDays, n: al.expiringLots.length }));

  console.log('\n=== iPhone (390 px): ajuste cabe no ecrã ===');
  const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const phone = await phoneCtx.newPage();
  watch(phone, 'iphone');
  await login(phone);
  await phone.goto(BASE + '/app/produtos?tab=stock');
  await phone.getByRole('button', { name: 'Ajuste manual' }).click({ timeout: T });
  const pd = phone.getByRole('dialog');
  await pd.getByLabel('Produto').selectOption(agua.id);
  await pd.getByRole('button', { name: 'Outra validade' }).click();
  const wide = await phone.evaluate(() => document.documentElement.scrollWidth);
  ok(wide <= 390, 'sem deslocamento horizontal (' + wide + ' px)');
  const btn = await pd.getByRole('button', { name: 'Adicionar', exact: true }).boundingBox();
  ok(btn && btn.x >= 0 && btn.x + btn.width <= 390, 'botão Adicionar dentro do ecrã');
  await phone.screenshot({ path: path.join(SHOTS, 's5-iphone-ajuste.png') });
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: stock e validades passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
