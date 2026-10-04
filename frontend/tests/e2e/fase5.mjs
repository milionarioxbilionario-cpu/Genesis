// Teste de browser real da Fase 5 (Genesis 2.1): despesas avulsas no lucro.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/fase5.mjs
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
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
const watch = (page, label) => {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
};

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ctx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });

  console.log('\n=== Despesas avulsas ===');
  // Lucro liquido antes, lido da API com a sessao do dono.
  const now = new Date();
  const ym = `year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
  const before = await owner.evaluate(async (q) => (await fetch('/api/owner/reports/monthly?' + q, { credentials: 'include' })).json(), ym);

  await owner.goto(BASE + '/app/definicoes?tab=costs');
  await owner.getByRole('heading', { name: 'Despesas avulsas' }).waitFor({ timeout: T });
  await owner.getByRole('button', { name: 'Nova despesa' }).click();
  await owner.getByLabel('Categoria').fill('Limpeza');
  await owner.getByLabel('Descrição (opcional)').fill('Detergente e vassouras');
  await owner.getByLabel('Valor').fill('350,50');
  await owner.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Despesa guardada.').waitFor({ timeout: T });
  const row = owner.locator('tbody tr', { hasText: 'Detergente e vassouras' });
  await row.waitFor({ timeout: T });
  ok(/350,50/.test(await row.textContent()), 'despesa aparece na lista com 350,50 MT', await row.textContent());
  ok(/Total do mês:\s*350,50/.test(await owner.getByText(/Total do mês:/).textContent()), 'total do mes 350,50 MT');
  await shot(owner, 'f5-despesas');

  const after = await owner.evaluate(async (q) => (await fetch('/api/owner/reports/monthly?' + q, { credentials: 'include' })).json(), ym);
  ok(after.deductions.total_expenses - before.deductions.total_expenses === 35050, 'servidor recebeu 35050 centavos (nao 350,50 nem 3505000)', after.deductions.total_expenses);
  ok(before.net_profit - after.net_profit === 35050, 'lucro liquido desce 350,50 MT');

  await owner.goto(BASE + '/app/relatorios?tab=monthly');
  await owner.getByText('Do que entrou ao que ficou').waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  const cascade = await owner.locator('div', { hasText: /^Despesas avulsas/ }).filter({ hasText: '350,50' }).count();
  ok(cascade > 0, 'cascata do mensal tem a linha "Despesas avulsas" com 350,50 MT');
  ok(await owner.getByText('Despesas avulsas por categoria').isVisible(), 'mensal: despesas por categoria');
  await shot(owner, 'f5-mensal');

  await owner.goto(BASE + '/app/relatorios');
  await owner.getByRole('heading', { name: 'Rastreio' }).waitFor({ timeout: T });
  await owner.getByLabel('Tipo de movimento').selectOption('expense');
  const exp = owner.locator('section:has(h2:text("Rastreio")) tbody tr', { hasText: 'Despesa: Limpeza' });
  await exp.waitFor({ timeout: T });
  const expText = await exp.textContent();
  ok(/\(dia\)/.test(expText) && /350,50/.test(expText) && !/12:00:00/.test(expText), 'rastreio: despesa com o dia (sem hora inventada) e o valor', expText);

  // Editar e apagar no ecra.
  await owner.goto(BASE + '/app/definicoes?tab=costs');
  await row.click({ timeout: T });
  await owner.getByLabel('Valor').fill('400');
  await owner.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Despesa guardada.').waitFor({ timeout: T });
  await owner.locator('tbody tr', { hasText: /Detergente e vassouras.*400,00/ }).waitFor({ timeout: T });
  ok(true, 'editar o valor para 400 MT');
  await owner.locator('tbody tr', { hasText: 'Detergente e vassouras' }).click();
  await owner.getByRole('button', { name: 'Remover' }).click();
  await owner.getByLabel('Remover despesa').getByRole('button', { name: 'Remover' }).click();
  await owner.getByText('Despesa removida.').waitFor({ timeout: T });
  ok(await owner.getByText('Sem despesas neste mês.').waitFor({ timeout: T }).then(() => true, () => false), 'apagar: a lista fica vazia');

  console.log('\n=== Lista de compras ===');
  // O wa.me e externo: o teste so le o URL, sem sair para a internet.
  await ctx.route('https://wa.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>wa.me</p>' }));
  const sup = await owner.evaluate(async () => (await fetch('/api/inventory/suppliers', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'CDM Maputo', phone: '84 123 4567', delivery_cost_per_visit: 50000 }) })).status);
  ok(sup < 300, 'fornecedor CDM Maputo criado (entrega 500 MT)', sup);
  await owner.goto(BASE + '/app/produtos?tab=shopping');
  await owner.getByRole('button', { name: 'Gerar da recomendação' }).click({ timeout: T });
  await owner.getByText('Nova lista de compras').waitFor({ timeout: T });
  ok(true, 'gerar da recomendacao abre a lista (loja nova: pode vir vazia)');
  await owner.getByLabel('Nome da lista').fill('Compra da semana');
  await owner.getByLabel('Fornecedor').selectOption({ label: 'CDM Maputo' });
  // A sugestao pode trazer outros produtos: fica so com os dois do teste.
  for (const b of await owner.getByRole('button', { name: /^Tirar / }).all()) {
    if (!/2M 340ml|Heineken 330ml/.test(await b.getAttribute('aria-label'))) await b.click();
  }
  for (const name of ['2M 340ml', 'Heineken 330ml']) {
    if (await owner.getByLabel('Quantidade de ' + name).count() === 0) {
      const value = await owner.getByLabel('Juntar produto').locator('option', { hasText: name }).first().getAttribute('value');
      await owner.getByLabel('Juntar produto').selectOption(value);
      await owner.getByRole('button', { name: 'Juntar', exact: true }).click();
    }
  }
  await owner.getByLabel('Quantidade de 2M 340ml').fill('24');
  await owner.getByLabel('Quantidade de Heineken 330ml').fill('12');
  // 24 x 38 + 12 x 55 = 1 572 MT + entrega 500 = 2 072 MT
  const totalText = await owner.getByText('Investimento (ao custo)').locator('xpath=../..').textContent();
  ok(/1\s?572,00/.test(totalText) && /500,00/.test(totalText) && /2\s?072,00/.test(totalText), 'totais: investimento 1 572 MT + entrega 500 MT = 2 072 MT', totalText);
  await shot(owner, 'f5-lista');
  const popupP = ctx.waitForEvent('page', { timeout: T });
  await owner.getByRole('button', { name: 'Enviar por WhatsApp' }).click();
  const popup = await popupP;
  await popup.waitForURL(/wa\.me/, { timeout: T });
  const waUrl = decodeURIComponent(popup.url());
  ok(waUrl.startsWith('https://wa.me/258841234567?text=') && /24 × 2M 340ml/.test(waUrl) && /12 × Heineken 330ml/.test(waUrl), 'WhatsApp abre para +258 84 123 4567 com a encomenda', waUrl);
  await popup.close();
  const listRow = owner.locator('tbody tr', { hasText: 'Compra da semana' });
  await listRow.filter({ hasText: 'Enviada' }).waitFor({ timeout: T });
  ok(/2\s?072,00/.test(await listRow.textContent()), 'lista guardada como "Enviada" com o total');
  await listRow.click();
  await owner.getByRole('button', { name: 'Marcar como recebida' }).click({ timeout: T });
  await listRow.filter({ hasText: 'Recebida' }).waitFor({ timeout: T });
  ok(true, 'marcar como recebida');
  await listRow.click();
  ok(await owner.getByText(/Lista recebida\. A entrada no stock/).waitFor({ timeout: T }).then(() => true, () => false), 'lista recebida fica so de leitura e diz onde registar a entrada');
  await shot(owner, 'f5-lista-recebida');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: fase 5 passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
