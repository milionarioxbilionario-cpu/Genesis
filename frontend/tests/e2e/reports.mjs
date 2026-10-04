// Teste de browser real dos relatorios (Genesis 2.1, Fase 4): rastreio,
// perdas, % da meta, semanal -> diario, mensal com chenecas e restock.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/reports.mjs
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
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  // Meta do mes: 10 000 MT.
  await owner.getByRole('button', { name: 'Definir' }).click({ timeout: T });
  await owner.getByLabel('Receita que quer atingir').fill('10000');
  await owner.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Meta do mês guardada.').waitFor({ timeout: T });

  // Terminal: venda de 2M + Coca-Cola e uma quebra.
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await owner.getByRole('button', { name: 'Emparelhar terminal' }).click();
  await owner.getByLabel('Nome do terminal').fill('Balcão');
  await owner.getByRole('button', { name: 'Gerar código' }).click();
  const code = (await owner.locator('p.num.text-2xl').textContent({ timeout: T })).trim();
  const termCtx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pt-PT' });
  const term = await termCtx.newPage();
  watch(term, 'terminal');
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill(code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByRole('button', { name: /Carlos/ }).click({ timeout: T });
  await term.getByText('Introduza o seu PIN').waitFor();
  await term.keyboard.type(fx.cashier.pin);
  await term.getByText('Venda actual').waitFor({ timeout: T });
  await term.locator('button[data-tile]', { hasText: '2M 340ml' }).click({ timeout: T });
  await term.locator('button[data-tile]', { hasText: 'Coca-Cola 500ml' }).click();
  await term.keyboard.press('Control+Enter');
  await term.getByText('Venda registada').waitFor({ timeout: T });
  await term.getByRole('button', { name: 'Nova venda' }).click();
  const products = await term.evaluate(async () => (await fetch('/api/products', { credentials: 'include' })).json());
  const heineken = products.find((p) => p.name === 'Heineken 330ml');
  const sh = await term.evaluate(async (pid) => (await fetch('/api/shrinkage_records', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: crypto.randomUUID(), product_id: pid, quantity: 1, reason: 'broken' }) })).status, heineken.id);
  ok(sh < 300, 'quebra de 1 Heineken registada no terminal', sh);

  console.log('\n=== Relatorio diario ===');
  await owner.goto(BASE + '/app/relatorios');
  await owner.getByRole('heading', { name: 'Rastreio' }).waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  ok(await owner.getByText('Perdas', { exact: true }).first().isVisible(), 'KPI de perdas');
  // 105 MT de 10 000 MT = 1,05% -> mostrado com uma casa decimal.
  ok(await owner.getByText(/Este dia: \+1,[01]%/).isVisible(), 'meta: a venda de 105 MT vale ~1% da meta de 10 000 MT');
  ok(!/\d{4}-\d{2}-\d{2}/.test(await owner.locator('section:has(h2:text("Rastreio")) tbody').textContent()), 'rastreio: datas formatadas (nada de AAAA-MM-DD)');
  const saleRow = owner.locator('tbody tr', { hasText: 'Venda n.º' }).first();
  const saleText = await saleRow.textContent();
  ok(/\d{2}:\d{2}:\d{2}/.test(saleText) && /Carlos/.test(saleText) && /2M 340ml/.test(saleText) && /\+105,00 MT/.test(saleText), 'rastreio: venda com hora ao segundo, caixista, produtos e +105 MT', saleText);
  const lossText = await owner.locator('tbody tr', { hasText: 'Perda: 1 × Heineken' }).first().textContent();
  ok(/Partido/.test(lossText) && /−55,00 MT/.test(lossText) && /6001234000031/.test(lossText), 'rastreio: perda com motivo, codigo de barras e −55 MT', lossText);
  await shot(owner, 'r1-diario');
  await saleRow.click();
  await owner.getByRole('button', { name: 'Reimprimir recibo' }).waitFor({ timeout: 10000 });
  ok(await owner.getByText('1 × Coca-Cola 500ml', { exact: true }).isVisible(), 'clicar na venda abre o recibo com os itens');
  await shot(owner, 'r2-recibo');
  await owner.keyboard.press('Escape');
  await owner.getByLabel('Tipo de movimento').selectOption('loss');
  // Espera que o filtro chegue: a tabela deixa de estar ocupada e so tem perdas.
  await owner.waitForFunction(() => {
    const box = [...document.querySelectorAll('section')].find((s) => s.querySelector('h2')?.textContent === 'Rastreio')?.querySelector('[aria-busy]');
    const rows = box ? [...box.querySelectorAll('tbody tr')] : [];
    return box && box.getAttribute('aria-busy') === 'false' && rows.length > 0 && rows.every((r) => r.textContent.includes('Perda'));
  }, null, { timeout: 30000 }).catch(() => {});
  const rows = await owner.locator('section:has(h2:text("Rastreio")) tbody tr').allTextContents();
  ok(rows.length >= 1 && rows.every((r) => /Perda/.test(r)), 'filtro "Perdas" so mostra perdas', rows.length);

  console.log('\n=== Semanal ===');
  await owner.getByRole('tab', { name: 'Semanal' }).click();
  await owner.getByText('Dia a dia').waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  ok(await owner.getByText('Melhor e pior dia').isVisible() && await owner.getByText('Mais rentáveis').first().isVisible(), 'semanal: melhor/pior dia e mais rentaveis');
  ok(await owner.getByText('O que comprar para a próxima semana').isVisible(), 'semanal: recomendacao de restock');
  await shot(owner, 'r3-semanal');
  const dayRows = owner.locator('tbody tr').filter({ hasText: /^(domingo|segunda|terça|quarta|quinta|sexta|sábado), \d/ });
  ok(await dayRows.count() === 7, 'semanal: tabela com os 7 dias', await dayRows.count());
  await dayRows.nth(5).click();
  await owner.waitForURL(/tab=daily&date=/, { timeout: 10000 });
  ok(true, 'clicar num dia da semana abre o relatorio desse dia');

  console.log('\n=== Mensal ===');
  await owner.getByRole('tab', { name: 'Mensal' }).click();
  await owner.getByText('Do que entrou ao que ficou').waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  ok(await owner.getByText('Sr. Mabunda').first().isVisible(), 'mensal: chenecas em aberto (Sr. Mabunda)');
  ok(await owner.getByText(/Perdas do mês/).isVisible(), 'mensal: perdas do mes mostradas a parte');
  ok(await owner.getByText('Metas dos últimos 12 meses').isVisible() && await owner.getByText('(este mês)').isVisible(), 'mensal: historico de metas');
  ok(await owner.getByText('O que comprar para o próximo mês').isVisible(), 'mensal: restock para o proximo mes');
  await shot(owner, 'r4-mensal');

  await owner.goto(BASE + '/app');
  await owner.getByText('Meta do mês').waitFor({ timeout: T });
  await shot(owner, 'r5-inicio');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: relatorios passaram' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
