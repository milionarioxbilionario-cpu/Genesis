// Etapa D num browser real: o dono acrescenta um 2.o estabelecimento (abre no
// onboarding dele), volta ao 1.o, abre o «Painel geral» com os dois, e cada um
// mostra so os seus produtos.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/etapaD.mjs
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
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
async function unlockIfNeeded(p) {
  const h = p.getByRole('heading', { name: 'Painel bloqueado' });
  await h.waitFor({ timeout: 4000 }).catch(() => {});
  if (await h.isVisible().catch(() => false)) { await p.keyboard.type(fx.lockPin); await h.waitFor({ state: 'detached', timeout: 60000 }); }
}

const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });
  await unlockIfNeeded(page);
  await page.getByText('Hoje até agora').first().waitFor({ timeout: T });
  const nameA = (await page.getByRole('button', { name: 'Os seus estabelecimentos' }).innerText()).split('\n')[0].trim();

  // Acrescentar o 2.o
  await page.getByRole('button', { name: 'Os seus estabelecimentos' }).click();
  await page.getByRole('button', { name: 'Acrescentar estabelecimento' }).click();
  await page.getByLabel('Nome do estabelecimento').fill('Mercearia da Matola');
  await page.getByLabel('Tipo de negócio').selectOption('mercearia');
  await page.getByLabel('Localização').fill('Matola, Maputo');
  await shot(page, 'D-01-acrescentar');
  await page.getByRole('button', { name: 'Criar e abrir' }).click();
  await page.waitForURL('**/onboarding', { timeout: 3 * T }); // criar + trocar + abrir: varios pedidos a BD
  ok(true, 'estabelecimento novo criado: abre no onboarding dele');
  await shot(page, 'D-02-onboarding-novo');

  // Voltar ao 1.o pelo seletor (o onboarding nao tem barra lateral: vai-se ao painel e troca-se).
  const back = await page.evaluate(async () => {
    const list = await (await fetch('/api/establishments', { credentials: 'same-origin' })).json();
    const home = list.find((e) => e.is_home);
    return (await fetch('/api/establishments/switch', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: home.id }) })).status;
  });
  ok(back === 200, 'voltar ao estabelecimento de casa');
  await page.goto(BASE + '/app');
  await unlockIfNeeded(page);
  await page.getByText('Hoje até agora').first().waitFor({ timeout: T });
  ok((await page.getByRole('button', { name: 'Os seus estabelecimentos' }).innerText()).includes(nameA), 'barra lateral mostra o estabelecimento de casa');
  await page.getByRole('button', { name: 'Os seus estabelecimentos' }).click();
  await page.getByText('Mercearia da Matola').waitFor({ timeout: T });
  ok(await page.getByText('por configurar').isVisible(), 'seletor: o 2.o aparece «por configurar»');
  await shot(page, 'D-03-seletor');
  await page.getByRole('button', { name: 'Painel geral' }).click();
  await page.getByRole('heading', { name: 'Painel geral' }).waitFor({ timeout: T });
  await page.getByRole('cell', { name: /Mercearia da Matola/ }).waitFor({ timeout: T });
  ok(await page.getByRole('cell', { name: new RegExp(nameA) }).count() >= 1, 'Painel geral: os dois estabelecimentos');
  await shot(page, 'D-04-painel-geral');
  // Isolamento visto no browser: os produtos do 1.o nao aparecem no 2.o.
  const prods = await page.evaluate(async () => {
    const a = await (await fetch('/api/products', { credentials: 'same-origin' })).json();
    const list = await (await fetch('/api/establishments', { credentials: 'same-origin' })).json();
    const other = list.find((e) => !e.is_home);
    await fetch('/api/establishments/switch', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: other.id }) });
    const b = await (await fetch('/api/products', { credentials: 'same-origin' })).json();
    return { a: a.length, b: b.length };
  });
  ok(prods.a > 0 && prods.b === 0, 'o 2.o não vê os produtos do 1.o', prods);
} finally {
  await browser.close();
}
if (errors.length) { console.log('\nErros de JS:'); for (const e of errors) console.log('  ' + e); }
console.log('\n' + (failures === 0 && errors.length === 0 ? 'RESULTADO: tudo OK' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`));
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
