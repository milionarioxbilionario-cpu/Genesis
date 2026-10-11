// Fase 8.4 (pedido do fundador 10/10/2026): vendas perdidas no terminal.
//  - iPhone: o botao "Produto em falta" existe no telemovel (antes so no PC);
//  - fora do catalogo: o que o cliente pediu, quantidade e preco opcional;
//  - do catalogo com quantidade;
//  - o dono ve nos Relatorios ("fora do catalogo", unidades, valor estimado);
//  - o super admin ve o pedido em "Pedidos de clientes", sem o nome da loja.
//   BASE=http://localhost:5180 ADMIN=http://localhost:5185 FIXTURE=f.json ADMIN_FIXTURE=a.json SHOTS=pasta node tests/e2e/fase8_4.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const ADMIN = process.env.ADMIN || '';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const ax = process.env.ADMIN_FIXTURE ? JSON.parse(fs.readFileSync(process.env.ADMIN_FIXTURE, 'utf8')) : null;
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
const NAME = 'Cotonetes E2E ' + Date.now().toString().slice(-5);
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}
const getJson = (page, url) => page.evaluate(async (u) => (await fetch(u, { credentials: 'include' })).json(), url);

const browser = await chromium.launch();
try {
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  const heineken = (await getJson(owner, '/api/products')).find((p) => p.name.startsWith('Heineken'));
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await owner.getByRole('button', { name: 'Emparelhar terminal' }).click();
  await owner.getByLabel('Nome do terminal').fill('Telemóvel');
  await owner.getByRole('button', { name: 'Gerar código' }).click();
  const code = (await owner.locator('p.num.text-2xl').textContent({ timeout: T })).trim();

  console.log('\n=== Terminal no iPhone (390 px): Produto em falta ===');
  const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const term = await phoneCtx.newPage();
  watch(term, 'terminal');
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill(code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByRole('button', { name: /Carlos/ }).click({ timeout: T });
  await term.getByText('Introduza o seu PIN').waitFor();
  await term.keyboard.type(fx.cashier.pin);
  // Pergunta dos dispositivos (Fase 8.8), se existir.
  const skip = term.getByRole('button', { name: 'Não tenho' }).first();
  const btn = term.getByRole('button', { name: 'Produto em falta' });
  await Promise.race([btn.waitFor({ timeout: T }), skip.waitFor({ timeout: T }).then(() => skip.click())]);
  await btn.waitFor({ timeout: T });
  ok(await btn.isVisible(), 'botão "Produto em falta" visível no telemóvel');
  const w0 = await term.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(w0[0] <= w0[1], 'terminal sem deslocamento horizontal', w0.join(' > '));
  await shot(term, 'l1-terminal-iphone');

  await btn.click();
  const dlg = term.getByRole('dialog');
  await dlg.getByRole('radio', { name: 'Fora do catálogo' }).click();
  await dlg.getByLabel('O que o cliente pediu').fill(NAME);
  await dlg.getByLabel('Quantidade').fill('3');
  await dlg.getByLabel('Preço unitário (opcional)').fill('25');
  const dw = await term.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(dw[0] <= dw[1], 'diálogo cabe no ecrã', dw.join(' > '));
  await shot(term, 'l2-fora-do-catalogo');
  await dlg.getByRole('button', { name: 'Registar pedido' }).click();
  await term.getByText(`Pedido registado: 3 × ${NAME}.`).waitFor({ timeout: T });
  ok(true, 'fora do catálogo registado (3 un. a 25 MT)');

  await btn.click();
  ok(await dlg.getByRole('radio', { name: 'Do catálogo', exact: true }).getAttribute('aria-checked') === 'true', 'abre em "Do catálogo"');
  await dlg.getByLabel('Produto', { exact: true }).fill('Heine');
  await dlg.getByLabel('Escolher produto').selectOption(heineken.id);
  await dlg.getByLabel('Quantidade').fill('0');
  ok(await dlg.getByRole('button', { name: 'Registar pedido' }).isDisabled() && await dlg.getByText('Quantidade entre 1 e 1000.').isVisible(), 'quantidade 0: bloqueado com aviso');
  await dlg.getByLabel('Quantidade').fill('2');
  await dlg.getByRole('button', { name: 'Registar pedido' }).click();
  await term.getByText(`Pedido registado: 2 × ${heineken.name}.`).waitFor({ timeout: T });
  ok(true, 'do catálogo registado (2 un.)');

  console.log('\n=== Dono: Relatórios ===');
  let lost = [];
  for (let i = 0; i < 30; i++) {
    lost = (await getJson(owner, '/api/owner/reports/daily')).lost_demand || [];
    if (lost.some((d) => d.name === NAME) && lost.some((d) => d.product_id === heineken.id)) break;
    await owner.waitForTimeout(3000);
  }
  const out = lost.find((d) => d.name === NAME);
  const cat = lost.find((d) => d.product_id === heineken.id);
  ok(out && out.outside && out.units === 3 && out.unit_price === 2500 && out.estimated_value === 7500, 'servidor: fora do catálogo 3 un. × 25 MT = 75 MT (centavos)', JSON.stringify(out));
  ok(cat && !cat.outside && cat.units === 2, 'servidor: Heineken 2 un.', JSON.stringify(cat));
  await owner.goto(BASE + '/app/relatorios');
  const card = owner.locator('div').filter({ has: owner.getByRole('heading', { name: 'Vendas perdidas' }) }).filter({ hasText: NAME }).last();
  await owner.getByRole('heading', { name: 'Vendas perdidas' }).waitFor({ timeout: T });
  const text = (await card.textContent()) || '';
  ok(text.includes(NAME) && text.includes('fora do catálogo') && /3 un\./.test(text) && /75,00 MT/.test(text), 'Relatórios: nome, "fora do catálogo", 3 un., ≈ 75 MT', text.slice(0, 300));
  await owner.getByRole('heading', { name: 'Vendas perdidas' }).scrollIntoViewIfNeeded();
  await shot(owner, 'l3-relatorio-vendas-perdidas');

  if (ADMIN && ax) {
    console.log('\n=== Super admin: Pedidos de clientes ===');
    const actx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
    const admin = await actx.newPage();
    watch(admin, 'admin');
    await admin.goto(ADMIN + '/entrar');
    await admin.getByLabel('Email').fill(ax.admin.email);
    await admin.getByLabel('Senha').fill(ax.admin.password);
    await admin.getByRole('button', { name: 'Entrar' }).click();
    await admin.getByText('Receita mensal recorrente').waitFor({ timeout: T });
    ok(await admin.getByText(/pedido\(s\) de clientes fora do catálogo/).isVisible({ timeout: T }), 'visão geral avisa os pedidos fora do catálogo');
    await admin.getByRole('link', { name: 'Ver pedidos' }).click();
    const row = admin.locator('tbody tr', { hasText: NAME });
    await row.waitFor({ timeout: T });
    const rt = (await row.textContent()) || '';
    ok(/Bottle store/.test(rt) && /25,00 MT/.test(rt) && !rt.includes('Bottle Store Central'), 'linha: tipo, preço 25 MT, sem o nome da loja', rt);
    await shot(admin, 'l4-admin-pedidos-clientes');
    await actx.close();
  } else console.log('  (admin saltado: falta ADMIN/ADMIN_FIXTURE)');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: vendas perdidas passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
