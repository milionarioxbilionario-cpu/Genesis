// Fase 10.1: sino de notificacoes do dono (Prompt Mestre 6.4; especificacao
// 6.4/6.5). A loja de teste traz a Agua com 8 un. (minimo 12) e a cheneca do
// Sr. Mabunda vencida ha 2 dias: o sino mostra 2 alertas criticos; tocar abre a
// pagina certa; repor o stock tira o alerta; ingles; iPhone.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/sino.mjs
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
const api = (page, method, url, body) => page.evaluate(async ([m, u, b]) => {
  const r = await fetch(u, { method: m, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}, [method, url, body]);

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page, 'dono');
  await login(page);

  console.log('\n=== Sino no cabecalho ===');
  const bell = page.getByRole('button', { name: /^Notificações/ });
  await page.getByRole('button', { name: 'Notificações (2)' }).waitFor({ timeout: T });
  ok(true, 'sino com 2 alertas (Água 8/12 e cheneca vencida)');
  ok(/bg-danger/.test(await bell.locator('span').first().getAttribute('class')), 'contador vermelho: ha alertas criticos');
  await bell.click();
  const dr = page.getByRole('dialog', { name: 'Notificações' });
  await dr.getByText('Stock crítico').waitFor({ timeout: T });
  ok(await dr.getByText('Água Namaacha 1,5L: 8 un. (mínimo 12).').isVisible(), 'stock critico: Água 8 un. (mínimo 12)');
  ok(await dr.getByText('Cheneca vencida').isVisible() && await dr.getByText(/^Sr\. Mabunda: falta 2[\s  ]000,00 MT, venceu há 2 dia\(s\)\.$/).isVisible(), 'cheneca vencida: Sr. Mabunda, falta 2 000,00 MT, há 2 dias');
  await page.screenshot({ path: path.join(SHOTS, 's1-sino-aberto.png') });

  console.log('\n=== Tocar leva a pagina certa ===');
  await dr.getByText('Stock crítico').click();
  await page.waitForURL('**/app/produtos?tab=stock', { timeout: T });
  const closed = await dr.waitFor({ state: 'detached', timeout: 5000 }).then(() => true, () => false);
  ok(closed, 'tocar no stock fecha o sino e abre Produtos > Stock');
  await bell.click();
  await dr.getByText('Cheneca vencida').click();
  await page.waitForURL('**/app/chenecas', { timeout: T });
  ok(true, 'tocar na cheneca abre Chenecas');

  console.log('\n=== Repor o stock tira o alerta ===');
  const agua = (await api(page, 'GET', '/api/products')).data.find((p) => p.name === 'Água Namaacha 1,5L');
  const entry = await api(page, 'POST', '/api/inventory/stock', { product_id: agua.id, quantity: 40, unit_cost: 2200 });
  ok(entry.status === 201 || entry.status === 200, 'entrada de 40 un. de Água', entry.status);
  await page.goto(BASE + '/app');
  await page.getByRole('button', { name: 'Notificações (1)' }).waitFor({ timeout: T });
  ok(true, 'depois de repor: o sino fica com 1 (só a cheneca)');

  console.log('\n=== Ingles ===');
  ok((await api(page, 'PUT', '/api/auth/language', { language: 'en' })).status === 200, 'dono passa a EN');
  await page.reload();
  const bellEn = page.getByRole('button', { name: 'Notifications (1)' });
  await bellEn.waitFor({ timeout: T });
  await bellEn.click();
  const drEn = page.getByRole('dialog', { name: 'Notifications' });
  await drEn.getByText('Credit overdue').waitFor({ timeout: T });
  ok(await drEn.getByText('What needs your attention now.').isVisible() && await drEn.getByText(/^Sr\. Mabunda: .*2,000\.00.* outstanding, overdue by 2 day\(s\)\.$/).isVisible(), 'em inglês: «Credit overdue» e o detalhe');
  await page.screenshot({ path: path.join(SHOTS, 's2-sino-en.png') });
  await api(page, 'PUT', '/api/auth/language', { language: 'pt' });

  console.log('\n=== iPhone ===');
  const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const phone = await phoneCtx.newPage();
  watch(phone, 'iphone');
  await login(phone);
  const pb = phone.getByRole('button', { name: 'Notificações (1)' });
  await pb.waitFor({ timeout: T });
  const box = await pb.boundingBox();
  ok(box && box.x + box.width <= 390 && box.y < 56, 'sino visível no cabeçalho do iPhone', JSON.stringify(box));
  await pb.click();
  await phone.getByRole('dialog', { name: 'Notificações' }).getByText('Cheneca vencida').waitFor({ timeout: T });
  ok(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'sem deslocamento lateral (390 px)');
  await phone.screenshot({ path: path.join(SHOTS, 's3-sino-iphone.png') });
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: sino passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
