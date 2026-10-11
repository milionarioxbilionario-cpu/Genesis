// Fase 8.5 (pedido do fundador 10/10/2026): auditoria do dono.
//  - filtros Hoje/Semana/Mes/Tudo e por tipo;
//  - tocar num registo mostra o detalhe (antes -> depois): entrada de stock e
//    mudanca de PIN;
//  - o dono escolhe quantos meses guarda (minimo 2; baixar pede confirmacao);
//  - iPhone 390 px.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/fase8_5.mjs
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
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
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
const call = (page, method, url, body) => page.evaluate(async ([m, u, b]) => {
  const r = await fetch(u, { method: m, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}, [method, url, body]);

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page, 'dono');
  await login(page);
  const prods = (await call(page, 'GET', '/api/products')).data;
  const agua = prods.find((p) => p.name.startsWith('Água'));
  const e = await call(page, 'POST', '/api/inventory/stock', { product_id: agua.id, unit_cost: 1900, lots: [{ quantity: 12, expiry_date: null }] });
  ok(e.status === 201, 'entrada de stock de 12 un. a 19 MT (preparação)', e.status);
  const p = await call(page, 'PUT', '/api/settings/authorization-pin', { owner_password: fx.owner.password, pin: '8642' });
  ok(p.status === 200, 'PIN de autorização mudado (preparação)', p.status);

  console.log('\n=== Definições › Auditoria ===');
  await page.goto(BASE + '/app/definicoes?tab=audit');
  await page.getByText('Quanto tempo guardar').waitFor({ timeout: T });
  ok(await page.getByRole('radio', { name: 'Semana' }).getAttribute('aria-checked') === 'true', 'abre na semana');
  await page.getByRole('radio', { name: 'Hoje' }).click();
  await page.getByRole('button', { name: /Entrada de stock/ }).first().waitFor({ timeout: T });
  ok(await page.getByRole('button', { name: /PIN de autorização alterado/ }).count() >= 1, 'hoje: vê a entrada de stock e a mudança de PIN');
  await shot(page, 'a1-auditoria-hoje');

  await page.getByLabel('Tipo').selectOption('stock');
  await page.getByRole('button', { name: /PIN de autorização alterado/ }).first().waitFor({ state: 'detached', timeout: T });
  const rowsStock = await page.locator('ul li button').allTextContents();
  ok(rowsStock.length > 0 && rowsStock.every((t) => !/PIN de autoriza/.test(t)) && rowsStock.some((t) => /Entrada de stock/.test(t) && /\+12 un\./.test(t)), 'tipo Stock: só stock, entrada com +12 un.', rowsStock.slice(0, 3).join(' | '));
  await page.getByRole('button', { name: /Entrada de stock/ }).first().click();
  const dr = page.getByRole('dialog');
  await dr.getByText('O que mudou').waitFor({ timeout: T });
  const dt = (await dr.textContent()) || '';
  ok(/Entraram/.test(dt) && /12/.test(dt) && /Custo unitário/.test(dt) && /19,00 MT/.test(dt) && /Ana Machava/.test(dt), 'detalhe: entraram 12, custo 19,00 MT, quem fez', dt.slice(0, 300));
  const costRow = (await dr.locator('tr', { hasText: 'Preço de compra' }).textContent()) || '';
  ok(/MT.*19,00 MT/.test(costRow) && !/—/.test(costRow), 'preço de compra: antes → 19,00 MT (não "apagado")', costRow);
  ok(await dr.locator('tr', { hasText: 'Fornecedor' }).count() === 0, 'sem linhas vazias (fornecedor — → —)');
  await shot(page, 'a2-detalhe-entrada');
  await dr.getByRole('button', { name: 'Fechar' }).last().click();

  await page.getByLabel('Tipo').selectOption('security');
  await page.getByRole('button', { name: /PIN de autorização alterado/ }).first().click({ timeout: T });
  const pt = (await page.getByRole('dialog').textContent()) || '';
  ok(/Ana Machava/.test(pt) && !pt.includes('8642'), 'detalhe da mudança de PIN: quem fez, sem o PIN', pt.slice(0, 200));
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).last().click();

  console.log('\n=== Retenção ===');
  const sel = page.getByLabel('Guardar');
  ok(await sel.inputValue() === '2', 'por defeito: 2 meses');
  await sel.selectOption('6');
  await page.getByText('A auditoria guarda agora 6 meses.').waitFor({ timeout: T });
  ok(true, 'mudou para 6 meses');
  await sel.selectOption('2');
  await page.getByText('Guardar menos tempo').waitFor({ timeout: T });
  ok(true, 'baixar pede confirmação');
  await shot(page, 'a3-confirmar-retencao');
  await page.getByRole('button', { name: 'Guardar 2 meses' }).click();
  await page.getByText('A auditoria guarda agora 2 meses.').waitFor({ timeout: T });
  const st = await call(page, 'GET', '/api/settings');
  ok(st.data.audit_retention_months === 2, 'gravado: 2 meses');
  await page.getByRole('radio', { name: 'Hoje' }).click();
  await page.getByLabel('Tipo').selectOption('settings');
  await page.getByRole('button', { name: /Tempo da auditoria alterado/ }).nth(1).waitFor({ timeout: T }).catch(() => {});
  ok(await page.getByRole('button', { name: /Tempo da auditoria alterado/ }).count() === 2, 'as duas mudanças de retenção ficam na auditoria');

  console.log('\n=== iPhone (390 px) ===');
  const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const phone = await phoneCtx.newPage();
  watch(phone, 'iphone');
  await login(phone);
  await phone.goto(BASE + '/app/definicoes?tab=audit');
  await phone.getByRole('button', { name: /Entrada de stock/ }).first().waitFor({ timeout: T });
  const w = await phone.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(w[0] <= w[1], 'auditoria cabe nos 390 px', w.join(' > '));
  await phone.getByRole('button', { name: /Entrada de stock/ }).first().click();
  await phone.getByText('O que mudou').waitFor({ timeout: T });
  const w2 = await phone.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(w2[0] <= w2[1], 'detalhe cabe nos 390 px', w2.join(' > '));
  await shot(phone, 'a4-iphone-detalhe');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: auditoria passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
