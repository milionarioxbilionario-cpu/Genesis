// Etapa B — terminal do guarda, num browser real (Chromium):
//  dono cria o guarda em Equipa -> terminal da saida -> guarda entra com PIN ->
//  le o QR de um recibo verdadeiro -> «Conferido» -> o mesmo recibo outra vez =
//  ecra vermelho «ja conferido» -> o dono ve no rastreio.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/guarda.mjs
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
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}
async function unlockIfNeeded(p) {
  const h = p.getByRole('heading', { name: 'Painel bloqueado' });
  await h.waitFor({ timeout: 4000 }).catch(() => {});
  if (await h.isVisible().catch(() => false)) { await p.keyboard.type(fx.lockPin); await h.waitFor({ state: 'detached', timeout: 60000 }); }
}
async function pairingCode(owner, name) {
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await unlockIfNeeded(owner);
  await owner.getByRole('button', { name: 'Emparelhar terminal' }).click();
  await owner.getByLabel('Nome do terminal').fill(name);
  await owner.getByRole('button', { name: 'Gerar código' }).click();
  const el = owner.locator('p.num.text-2xl');
  await el.waitFor({ timeout: T });
  const code = (await el.textContent()).trim();
  await owner.keyboard.press('Escape');
  return code;
}
async function enterTerminal(browser, code, profile, pin, label) {
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, locale: 'pt-PT' });
  const p = await ctx.newPage();
  watch(p, label);
  await p.goto(BASE + '/terminal');
  await p.getByLabel('Código de emparelhamento').fill(code);
  await p.getByRole('button', { name: 'Emparelhar' }).click();
  await p.getByRole('button', { name: new RegExp(profile) }).click();
  await p.getByText('Introduza o seu PIN').waitFor({ timeout: T });
  await p.keyboard.type(pin);
  return p;
}

const browser = await chromium.launch();
try {
  console.log('\n=== Dono: cria o guarda ===');
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  await unlockIfNeeded(owner);
  await owner.goto(BASE + '/app/equipa');
  await unlockIfNeeded(owner);
  await owner.getByRole('button', { name: /Novo perfil|Novo caixista/ }).click();
  await owner.getByLabel('Nome').fill('Rui Guarda');
  await owner.getByLabel('Função').selectOption('guard');
  await owner.getByLabel('PIN de 4 dígitos').fill('1357');
  await owner.getByRole('button', { name: /Criar/ }).click();
  const row = owner.locator('tr', { hasText: 'Rui Guarda' });
  await row.waitFor({ timeout: T });
  ok(await row.getByText('Guarda', { exact: true }).isVisible() && (await row.innerText()).includes('—'), 'Equipa: guarda criado, com a função à vista (sem vendas nem receita)');
  await shot(owner, 'B-01-equipa-guarda');

  console.log('\n=== Caixista vende ===');
  const cashCode = await pairingCode(owner, 'Balcão B');
  const caixa = await enterTerminal(browser, cashCode, fx.cashier.name, fx.cashier.pin, 'caixa');
  await caixa.getByText('Venda actual').waitFor({ timeout: T });
  const skip = caixa.getByRole('button', { name: 'Não tenho — saltar' });
  if (await skip.count()) await skip.click();
  await caixa.getByRole('button', { name: /Coca-Cola 500ml/ }).click();
  const saleResp = caixa.waitForResponse((r) => r.url().endsWith('/api/sales') && r.request().method() === 'POST', { timeout: T });
  await caixa.getByRole('button', { name: /Cobrar/ }).click();
  await caixa.getByText('Venda registada').waitFor({ timeout: T });
  const saleId = (await saleResp).request().postDataJSON().id;
  ok(Boolean(saleId), 'venda registada (recibo com QR)');

  console.log('\n=== Guarda na saída ===');
  const guardCode = await pairingCode(owner, 'Saída');
  const guard = await enterTerminal(browser, guardCode, 'Rui Guarda', '1357', 'guarda');
  await guard.getByText('Peça o recibo ao cliente e leia o código.').waitFor({ timeout: T });
  ok(!(await guard.getByText('Venda actual').count()), 'guarda vê o leitor de recibos, não o ecrã de vendas');
  const field = guard.getByLabel('Recibo');
  await field.fill(BASE + '/verify/' + saleId);
  await field.press('Enter');
  await guard.getByRole('button', { name: 'Marcar como conferido' }).waitFor({ timeout: T });
  ok(await guard.getByText(/Coca-Cola 500ml/).isVisible(), 'QR lido: mostra os artigos da venda');
  await guard.getByRole('button', { name: 'Marcar como conferido' }).click();
  await guard.getByText('Conferido. Pode sair.').waitFor({ timeout: T });
  ok(true, 'conferido: verde «Pode sair»');
  await shot(guard, 'B-02-conferido');
  await guard.getByRole('button', { name: 'Ler o próximo recibo' }).click();
  await field.fill(BASE + '/verify/' + saleId);
  await field.press('Enter');
  await guard.getByText('Recibo já conferido').waitFor({ timeout: T });
  ok(await guard.getByText(/por Rui Guarda/).isVisible() && !(await guard.getByRole('button', { name: 'Marcar como conferido' }).count()), 'o mesmo recibo outra vez: vermelho «já conferido… por Rui Guarda»');
  await shot(guard, 'B-03-ja-conferido');

  console.log('\n=== Dono: rastreio ===');
  await owner.goto(BASE + '/app/definicoes?tab=audit');
  await unlockIfNeeded(owner);
  await owner.getByText('Recibo conferido à saída').first().waitFor({ timeout: T });
  ok(true, 'rastreio: «Recibo conferido à saída»');
  ok(await owner.getByText('Recibo já conferido apresentado outra vez').first().isVisible(), 'rastreio: tentativa repetida em destaque');
  await shot(owner, 'B-04-rastreio');
} finally {
  await browser.close();
}
if (errors.length) { console.log('\nErros de JS:'); for (const e of errors) console.log('  ' + e); }
console.log('\n' + (failures === 0 && errors.length === 0 ? 'RESULTADO: tudo OK' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`));
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
