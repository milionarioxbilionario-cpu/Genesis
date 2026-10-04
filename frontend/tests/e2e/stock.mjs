// Teste de browser real: entrada de stock com validade -> "Validades" (Fase 3).
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/stock.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push('console: ' + m.text()); });
  console.log('\n=== Stock e validades ===');
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });

  await page.goto(BASE + '/app/produtos?tab=stock');
  await page.getByRole('button', { name: 'Entrada de stock' }).click({ timeout: T });
  await page.getByLabel('Produto').selectOption({ label: 'Água Namaacha 1,5L (8 un.)' });
  await page.getByLabel('Quantidade').fill('12');
  await page.getByLabel('Validade deste lote').fill(day(3));
  await page.screenshot({ path: path.join(SHOTS, 's1-entrada-validade.png') });
  await page.getByRole('button', { name: 'Registar' }).click();
  await page.getByText('Entrada de stock registada.').waitFor({ timeout: T });
  await page.getByRole('heading', { name: 'Validades' }).waitFor({ timeout: T });
  const row = page.locator('tr', { hasText: 'Água Namaacha 1,5L' }).first();
  const text = (await row.textContent()) || '';
  ok(/12 de 20 un\./.test(text) && /\d dia\(s\)|Expira hoje/.test(text), 'Validades: "12 de 20 un." com dias restantes', text);
  await page.screenshot({ path: path.join(SHOTS, 's2-validades.png'), fullPage: true });

  await page.goto(BASE + '/app');
  await page.getByText(/lote\(s\) perto da validade/).waitFor({ timeout: T });
  ok(true, 'Inicio avisa os lotes perto da validade');
  await page.screenshot({ path: path.join(SHOTS, 's3-inicio-aviso.png') });

  await page.goto(BASE + '/app/definicoes?tab=store');
  await page.getByLabel('Avisar com').fill('2');
  await page.locator('div', { hasText: /^Avisar com/ }).getByRole('button', { name: 'Guardar' }).last().click().catch(async () => {
    await page.getByRole('button', { name: 'Guardar' }).last().click();
  });
  await page.getByText('Alterações guardadas.').waitFor({ timeout: T });
  const al = await page.evaluate(async () => (await fetch('/api/owner/alerts', { credentials: 'include' })).json());
  ok(al.alertDays === 2 && !al.expiringLots.some((l) => l.days_left > 2), 'Definicoes: aviso a 2 dias aplicado aos alertas', JSON.stringify({ d: al.alertDays, n: al.expiringLots.length }));
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
