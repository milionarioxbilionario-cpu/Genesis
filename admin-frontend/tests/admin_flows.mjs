// Teste de browser do painel admin (Chromium via Playwright do frontend).
//   ADMIN=http://localhost:5185 APP=http://localhost:5180 FIXTURE=admin.json SHOTS=pasta node tests/admin_flows.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/@playwright/test');

const ADMIN = process.env.ADMIN || 'http://localhost:5185';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
const T = 120000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra ? '  -> ' + extra : '')); } };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true });

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

  await page.goto(ADMIN + '/entrar');
  await page.getByText('Acesso restrito').waitFor();
  await shot(page, '40-admin-entrar');
  await page.getByLabel('Email').fill(fx.admin.email);
  await page.getByLabel('Senha').fill(fx.admin.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Receita mensal recorrente').waitFor({ timeout: T });
  await page.waitForLoadState('networkidle', { timeout: T });
  ok(true, 'login super admin -> visao geral');
  await shot(page, '41-admin-visao-geral');

  await page.getByRole('link', { name: 'Pedidos de conta' }).click();
  await page.getByText(fx.request.name).waitFor({ timeout: T });
  await shot(page, '42-admin-pedidos');
  const row = page.locator('tr', { hasText: fx.request.name });
  await row.getByRole('button', { name: 'Aprovar' }).click();
  await page.getByText('Conta criada').waitFor({ timeout: T });
  ok(await page.getByText('Senha temporária', { exact: true }).isVisible(), 'aprovar pedido mostra a senha temporaria');
  await shot(page, '43-admin-aprovado');
  await page.getByRole('button', { name: 'Concluído' }).click();

  await page.getByRole('link', { name: 'Lojas' }).click();
  await page.getByText(fx.request.name).first().waitFor({ timeout: T });
  await page.waitForLoadState('networkidle', { timeout: T });
  await shot(page, '44-admin-lojas');
  await page.getByText(fx.request.name).first().click();
  await page.getByText('Abrir modo suporte (só leitura)').waitFor({ timeout: T });
  ok(true, 'detalhe da loja abre com accoes');
  await shot(page, '45-admin-loja-detalhe');

  // Modo suporte: abre o frontend da loja em so leitura.
  const [popup] = await Promise.all([
    ctx.waitForEvent('page', { timeout: T }),
    page.getByRole('button', { name: 'Abrir modo suporte (só leitura)' }).click(),
  ]);
  await popup.getByText('Modo suporte Genesis — só leitura').waitFor({ timeout: T });
  ok(true, 'modo suporte abre o painel da loja com o aviso de so leitura');
  await popup.waitForLoadState('networkidle', { timeout: T });
  await shot(popup, '46-suporte-so-leitura');

  await popup.close();
  // Em localhost os cookies nao distinguem portas: a sessao de suporte (aberta no
  // mesmo browser) substituiu a do admin. Em producao cada painel tem o seu
  // dominio e os cookies ficam separados. Aqui o admin entra de novo.
  await page.goto(ADMIN + '/entrar');
  await page.getByLabel('Email').fill(fx.admin.email);
  await page.getByLabel('Senha').fill(fx.admin.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Receita mensal recorrente').waitFor({ timeout: T });
  await page.getByRole('link', { name: 'Auditoria' }).click();
  await page.getByText('APPROVE_TENANT').first().waitFor({ timeout: T });
  ok(true, 'auditoria regista a aprovacao');
  await shot(page, '47-admin-auditoria');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('Erros de JavaScript: ' + errors.length);
errors.slice(0, 10).forEach((e) => console.log('  ' + e));
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: todos os fluxos passaram' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
