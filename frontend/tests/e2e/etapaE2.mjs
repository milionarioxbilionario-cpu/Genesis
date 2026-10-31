// E2 (31/10/2026) num browser real:
//  - o dono com 2 estabelecimentos entra pelo hub («Em qual estabelecimento deseja
//    entrar?»), abre o Painel geral (barra propria, 7 paginas) e cria um gerente;
//  - o gerente entra com e-mail e senha, vai direito ao seu estabelecimento e ve o
//    painel reduzido: sem custos, sem o relatorio mensal, sem trabalhadores, sem
//    trocar de estabelecimento; /geral manda-o para /app.
//   BASE=https://genesismz.com FIXTURE=f.json SHOTS=pasta node tests/e2e/etapaE2.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
async function unlockIfNeeded(p) {
  const h = p.getByRole('heading', { name: 'Painel bloqueado' });
  await h.waitFor({ timeout: 4000 }).catch(() => {});
  if (await h.isVisible().catch(() => false)) { await p.keyboard.type(fx.lockPin); await h.waitFor({ state: 'detached', timeout: 60000 }); }
}
const watch = (page) => {
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER|status of 40[13]/.test(m.text())) errors.push('console: ' + m.text()); });
};
const managerEmail = 'gerente-e2e-' + crypto.randomBytes(3).toString('hex') + '@teste.local';
const managerPw = 'Gerente-' + crypto.randomBytes(4).toString('hex');

const browser = await chromium.launch();
try {
  // ---------------------------------------------------------------- dono
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });
  await unlockIfNeeded(page);
  // 2.o estabelecimento (pela API, como no seletor) e uma venda nele.
  const made = await page.evaluate(async () => {
    const r = await fetch('/api/establishments', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Mercearia E2', business_type: 'mercearia', location: 'Matola' }) });
    return r.status;
  });
  ok(made === 201, '2.o estabelecimento criado', made);
  // Ao entrar de novo (abrir a app): o hub.
  await page.goto(BASE + '/inicio');
  await page.waitForURL('**/escolher', { timeout: T });
  await page.getByRole('heading', { name: 'Em qual estabelecimento deseja entrar?' }).waitFor({ timeout: T });
  await page.getByText('Mercearia E2').first().waitFor({ timeout: T });
  ok(await page.getByRole('button', { name: /Painel geral/ }).isVisible(), 'hub: os 2 estabelecimentos e o cartão «Painel geral»');
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) { await page.setViewportSize({ width: w, height: h }); await shot(page, `E2-01-hub-${w}`); }

  // Painel geral: as 7 paginas.
  await page.getByRole('button', { name: /Painel geral/ }).click();
  await page.waitForURL('**/geral', { timeout: T });
  await page.getByRole('heading', { name: 'Visão geral' }).waitFor({ timeout: T });
  await page.getByText('De onde veio cada valor').waitFor({ timeout: 2 * T });
  ok(await page.getByText('Mercearia E2').count() >= 1, 'visão geral: um cartão por estabelecimento');
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) { await page.setViewportSize({ width: w, height: h }); await shot(page, `E2-02-visao-geral-${w}`); }
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [link, heading, name] of [
    ['Estabelecimentos', 'Estabelecimentos', '03-estabelecimentos'],
    ['Relatórios', 'Relatórios de todos', '04-relatorios'],
    ['Rastreio geral', 'Rastreio geral', '05-rastreio'],
    ['Stock geral', 'Stock geral', '06-stock'],
    ['Gerentes', 'Gerentes', '07-gerentes'],
    ['Mapa', 'Mapa', '08-mapa'],
  ]) {
    await page.getByRole('navigation', { name: 'Navegação do painel geral' }).getByRole('link', { name: link }).click();
    await page.getByRole('heading', { name: heading, exact: true }).waitFor({ timeout: 2 * T });
    await page.waitForTimeout(800);
    ok(true, 'painel geral: ' + heading);
    await shot(page, 'E2-' + name);
  }

  // Criar o gerente (no estabelecimento principal).
  await page.getByRole('navigation', { name: 'Navegação do painel geral' }).getByRole('link', { name: 'Gerentes' }).click();
  await page.getByRole('button', { name: 'Novo gerente' }).click();
  const est = page.getByLabel('Estabelecimento');
  const opts = await est.locator('option').allInnerTexts();
  await est.selectOption({ label: opts.find((o) => o && o !== 'Escolha o estabelecimento' && o !== 'Mercearia E2') });
  await page.getByLabel('Nome', { exact: true }).fill('Gerente E2');
  await page.getByLabel('E-mail').fill(managerEmail);
  await page.getByLabel('Senha', { exact: true }).fill(managerPw);
  await page.getByLabel('PIN de autorização').fill('9753');
  await shot(page, 'E2-09-novo-gerente');
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await page.getByRole('cell', { name: /Gerente E2/ }).waitFor({ timeout: T });
  ok(true, 'gerente criado e na lista');
  await shot(page, 'E2-10-gerentes');
  await ctx.close();

  // ---------------------------------------------------------------- gerente
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const mctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'pt-PT' });
    const m = await mctx.newPage();
    watch(m);
    await m.goto(BASE + '/entrar');
    await m.getByLabel('Email').fill(managerEmail);
    await m.getByLabel('Senha').fill(managerPw);
    await m.getByRole('button', { name: 'Entrar' }).click();
    await m.waitForURL('**/app', { timeout: T });
    await m.getByText('Hoje até agora').first().waitFor({ timeout: T });
    ok(!(await m.getByText('Lucro bruto').count()), `gerente ${w}px: o Início sem lucro`);
    await shot(m, `E2-11-gerente-inicio-${w}`);
    if (w === 1440) {
      ok(await m.getByText('Gerente · Perfil').isVisible(), 'gerente: «Gerente · Perfil» na barra');
      ok(await m.getByRole('button', { name: 'Os seus estabelecimentos' }).isDisabled(), 'gerente: sem trocar de estabelecimento');
      await m.goto(BASE + '/app/produtos');
      await m.getByRole('heading', { name: 'Produtos' }).waitFor({ timeout: T });
      await m.getByRole('table').first().waitFor({ timeout: T });
      ok(!(await m.getByRole('columnheader', { name: 'Custo' }).count()) && !(await m.getByRole('columnheader', { name: 'Margem' }).count()), 'gerente: produtos sem custo nem margem');
      ok(!(await m.getByRole('tab', { name: 'Histórico de custos' }).count()), 'gerente: sem o histórico de custos');
      await shot(m, 'E2-12-gerente-produtos');
      await m.goto(BASE + '/app/relatorios');
      await m.getByRole('tab', { name: 'Diário' }).waitFor({ timeout: T });
      ok(!(await m.getByRole('tab', { name: 'Mensal' }).count()), 'gerente: sem o relatório mensal');
      await m.getByText('Receita').first().waitFor({ timeout: T });
      ok(!(await m.getByText('Lucro bruto').count()), 'gerente: relatório diário sem lucro');
      await shot(m, 'E2-13-gerente-relatorios');
      await m.goto(BASE + '/app/equipa');
      await m.getByRole('heading', { name: 'Equipa' }).waitFor({ timeout: T });
      ok(!(await m.getByRole('tab', { name: 'Trabalhadores' }).count()), 'gerente: sem trabalhadores (salários)');
      await m.goto(BASE + '/app/definicoes');
      await m.getByRole('tab', { name: 'Terminais' }).waitFor({ timeout: T });
      ok(!(await m.getByRole('tab', { name: 'Custos e despesas' }).count()) && !(await m.getByRole('tab', { name: 'Descontos e PIN' }).count()), 'gerente: definições só operacionais');
      await m.getByText('Mensagem no fim do recibo').first().waitFor({ timeout: T });
      await shot(m, 'E2-14-gerente-definicoes');
      await m.goto(BASE + '/geral');
      await m.waitForURL('**/app', { timeout: T });
      ok(true, 'gerente: /geral manda para /app');
      await m.goto(BASE + '/escolher');
      await m.waitForURL('**/app', { timeout: T });
      ok(true, 'gerente: o hub manda para /app');
    }
    await mctx.close();
  }
} finally {
  await browser.close();
}
if (errors.length) { console.log('\nErros de JS:'); for (const e of errors) console.log('  ' + e); }
console.log('\n' + (failures === 0 && errors.length === 0 ? 'RESULTADO: tudo OK' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`));
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
