// Teste de browser real do assistente de configuracao (primeiro login).
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/onboarding.mjs
// A fixture e criada com: node scripts/e2e_fixture.js create <f> onboarding
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
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra ? '  -> ' + extra : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push('console: ' + m.text()); });
  const apiErrors = [];
  page.on('response', async (r) => { if (r.url().includes('/api/') && r.status() >= 400) apiErrors.push(`${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')} ${(await r.text().catch(() => '')).slice(0, 300)}`); });

  console.log('\n=== Onboarding ===');
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/onboarding', { timeout: T });
  ok(true, 'primeiro login -> /onboarding');

  // Passo 1: tipo principal.
  await page.getByText('Que tipo de negócio tem?').waitFor({ timeout: T });
  await page.getByRole('button', { name: /Bottle store/ }).click();
  ok(await page.getByRole('button', { name: /Bottle store/ }).getAttribute('aria-pressed') === 'true', 'passo 1: bottle store seleccionada');
  await shot(page, 'o1-tipo');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Passo 2: categoria adicional (o botao tem de reagir).
  await page.getByText('Vende também outra coisa?').waitFor();
  const extra = page.getByRole('button', { name: /Restaurante/ });
  await extra.click();
  ok(await extra.getAttribute('aria-pressed') === 'true', 'passo 2: categoria adicional fica seleccionada ao clicar');
  await extra.click();
  ok(await extra.getAttribute('aria-pressed') === 'false', 'passo 2: segundo clique desselecciona');
  await extra.click();
  await shot(page, 'o2-adicionais');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Passo 3: catalogo pre-definido.
  await page.getByText('O seu catálogo').waitFor();
  await page.getByText(/produto\(s\) a importar/).waitFor({ timeout: T });
  const count = Number((await page.getByText(/produto\(s\) a importar/).textContent()).match(/\d+/)[0]);
  ok(count > 0, 'passo 3: catalogo carregado', count + ' produtos');
  await shot(page, 'o3-catalogo');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Passo 4: custos.
  await page.getByText('Custos fixos e equipa').waitFor();
  await page.getByLabel('Renda mensal do local').fill('15000');
  await shot(page, 'o4-custos');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Passo 5: horario + concluir (aqui e feito o import).
  await page.getByText('Horário de funcionamento').waitFor();
  await shot(page, 'o5-horario');
  await page.getByRole('button', { name: 'Concluir e entrar' }).click();
  await Promise.race([
    page.waitForURL('**/app', { timeout: T }),
    page.locator('[role=alert], .text-danger').first().waitFor({ timeout: T }),
  ]);
  const landed = page.url().endsWith('/app');
  ok(landed, 'concluir -> importa o catalogo e entra no painel', landed ? '' : await page.locator('[role=alert]').first().textContent().catch(() => page.url()));
  await shot(page, 'o6-depois');

  if (landed) {
    const r = await page.evaluate(async () => (await fetch('/api/products', { credentials: 'include' })).json());
    const list = Array.isArray(r) ? r : r.products || [];
    ok(list.length === count, 'produtos gravados = produtos escolhidos', `${list.length} vs ${count}`);
    const cats = [...new Set(list.map((p) => p.category))].sort();
    console.log('  categorias gravadas: ' + cats.join(', '));
    ok(!cats.includes('Higiene'), 'sem categoria Higiene numa bottle store + restaurante');
  }
  if (apiErrors.length) { console.log('  respostas de erro da API:'); for (const e of apiErrors) console.log('    ' + e); }
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: onboarding passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
