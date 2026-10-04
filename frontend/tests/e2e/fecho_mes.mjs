// Teste de browser real do fecho do mes (Genesis 2.1, Fase 5.3).
// Fixture: node scripts/e2e_fixture.js create f.json fecho (loja "antiga").
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/fecho_mes.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
const watch = (page, label) => {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
};
const prev = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
const title = `Fecho de ${MONTHS[prev.getMonth()]} ${prev.getFullYear()}`;

async function login(ctx) {
  const page = await ctx.newPage();
  watch(page, 'dono');
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });
  return page;
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  await ctx.route('https://wa.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>wa.me</p>' }));
  let owner = await login(ctx);

  console.log('\n=== Fecho do mes ===');
  const dialog = owner.getByRole('dialog', { name: title });
  await dialog.waitFor({ timeout: T });
  ok(true, `1.o acesso abre "${title}"`);
  const text = await dialog.textContent();
  // 30 x 40 MT = 1 200 MT de receita no mes passado.
  ok(/1\s?200,00/.test(text), 'resumo: receita do mes passado (1 200 MT)', text.slice(0, 200));
  ok(/Lucro líquido real/.test(text) && /Água Namaacha 1,5L/.test(text), 'resumo com lucro liquido e lista sugerida (Agua)');
  await shot(owner, 'f5-fecho');

  // Fechar no X adia so esta sessao: recarregar nao volta a abrir.
  await dialog.getByRole('button', { name: 'Fechar' }).click();
  await owner.reload();
  await owner.getByText('Meta do mês').waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  ok(await dialog.count() === 0, 'fechar no X: nao volta a abrir nesta sessao');

  // Nova sessao: volta a aparecer; "Contactar fornecedor agora" abre o WhatsApp.
  await ctx.close();
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  await ctx2.route('https://wa.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>wa.me</p>' }));
  owner = await login(ctx2);
  const dialog2 = owner.getByRole('dialog', { name: title });
  await dialog2.waitFor({ timeout: T });
  ok(true, 'noutra sessao volta a aparecer (ainda sem decisao)');
  const popupP = ctx2.waitForEvent('page', { timeout: T });
  await dialog2.getByRole('button', { name: 'Contactar fornecedor agora' }).click();
  const popup = await popupP;
  await popup.waitForURL(/wa\.me/, { timeout: T });
  const waUrl = decodeURIComponent(popup.url());
  ok(waUrl.startsWith('https://wa.me/?text=') && /× Água Namaacha 1,5L/.test(waUrl), 'WhatsApp com a encomenda (sem fornecedor: escolher o contacto)', waUrl);
  await popup.close();
  await dialog2.waitFor({ state: 'detached', timeout: T });
  ok(true, 'o dialogo fecha depois de contactar');

  await owner.goto(BASE + '/app/produtos?tab=shopping');
  const row = owner.locator('tbody tr', { hasText: 'Compras depois do fecho' });
  await row.waitFor({ timeout: T });
  ok(/Enviada/.test(await row.textContent()), 'a lista ficou guardada como "Enviada"');

  // Ja decidido: noutra sessao nao volta a aparecer.
  await ctx2.close();
  const ctx3 = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  owner = await login(ctx3);
  await owner.getByText('Meta do mês').waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  ok(await owner.getByRole('dialog', { name: title }).count() === 0, 'depois de decidir, nao volta a aparecer');
  await owner.goto(BASE + `/app/relatorios?tab=monthly&y=${prev.getFullYear()}&m=${prev.getMonth() + 1}`);
  await owner.getByRole('heading', { name: `${MONTHS[prev.getMonth()]} ${prev.getFullYear()}` }).waitFor({ timeout: T });
  ok(true, 'ligacao ?y=&m= abre o relatorio mensal desse mes');
  await ctx3.close();
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: fecho do mes passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
